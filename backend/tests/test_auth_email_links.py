import json
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from core.database import Base
from core.security import hash_password, verify_password
from modules.auth import services
from modules.auth import routes
from modules.auth.models import AuthLinkToken
from modules.auth.schemas import EmailLinkRequest, LoginPayload
from modules.users.models import User
from shared.enums import RoleType


class AuthEmailLinkTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine, tables=[User.__table__, AuthLinkToken.__table__])
        self.session_factory = sessionmaker(bind=self.engine)
        self.db = self.session_factory()
        self.user = User(
            hs_email_id="employee@highspring.in",
            password=hash_password("temporary-password"),
            first_name="Employee",
            role=RoleType.USER,
            is_password_reset_required=True,
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_auth_email_is_normalized_and_restricted_to_domain(self):
        self.assertEqual(
            LoginPayload(email=" Employee@Highspring.in ", password="pw").email,
            "employee@highspring.in",
        )
        with self.assertRaises(ValidationError):
            EmailLinkRequest(email="employee@gmail.com")
        with self.assertRaises(ValidationError):
            EmailLinkRequest(email="employee@@highspring.in")

    def test_yopmail_domain_is_allowed_only_in_local_environment(self):
        with patch("modules.auth.schemas.settings.ENVIRONMENT", "local"):
            self.assertEqual(
                LoginPayload(email="admin.highspring@yopmail.com", password="pw").email,
                "admin.highspring@yopmail.com",
            )
            self.assertEqual(
                EmailLinkRequest(email="admin.highspring@yopmail.com").email,
                "admin.highspring@yopmail.com",
            )

        with patch("modules.auth.schemas.settings.ENVIRONMENT", "prod"):
            with self.assertRaises(ValidationError):
                LoginPayload(email="admin.highspring@yopmail.com", password="pw")
            with self.assertRaises(ValidationError):
                EmailLinkRequest(email="admin.highspring@yopmail.com")

    @patch("modules.auth.services.EmailUtils.send_email")
    def test_auth_email_links_use_purpose_specific_link_labels(self, send_email):
        services._send_auth_link("employee@highspring.in", "setup-token", "setup")
        setup_html = send_email.call_args.kwargs["html_body"]
        self.assertIn(">create password</a>", setup_html)
        self.assertNotIn("setup-token", setup_html.split("</a>")[1])

        services._send_auth_link("employee@highspring.in", "reset-token", "recovery")
        recovery_html = send_email.call_args.kwargs["html_body"]
        self.assertIn(">reset password</a>", recovery_html)
        self.assertNotIn("reset-token", recovery_html.split("</a>")[1])

    @patch("modules.auth.services._send_auth_link")
    @patch("modules.auth.routes.ensure_super_admin")
    def test_first_login_sends_setup_link(self, ensure_super_admin, send_link):
        response = routes.login(
            LoginPayload(email=self.user.hs_email_id, password="temporary-password"),
            self.db,
        )
        body = json.loads(response.body)

        self.assertTrue(body["data"]["setup_link_sent"])
        self.assertNotIn("reset_token", body["data"])
        self.assertEqual(send_link.call_args.args[0], self.user.hs_email_id)

    @patch("modules.auth.services._send_auth_link")
    def test_setup_link_sets_password_and_cannot_be_reused(self, send_link):
        services.request_auth_link(self.db, self.user.hs_email_id, "setup")
        token = send_link.call_args.args[1]
        updated = services.complete_auth_link(self.db, token, "a-strong-password")

        self.assertTrue(verify_password("a-strong-password", updated.password))
        self.assertFalse(updated.is_password_reset_required)
        with self.assertRaises(HTTPException):
            services.complete_auth_link(self.db, token, "another-strong-password")

    @patch("modules.auth.services._send_auth_link")
    def test_recovery_link_updates_password_and_activates_account(self, send_link):
        services.request_auth_link(self.db, self.user.hs_email_id, "recovery")
        token = send_link.call_args.args[1]

        updated = services.complete_auth_link(self.db, token, "recovered-password-1")
        self.assertFalse(updated.is_password_reset_required)
        self.assertTrue(verify_password("recovered-password-1", updated.password))

    @patch("modules.auth.services._send_auth_link", side_effect=RuntimeError("mail unavailable"))
    def test_mail_failure_does_not_leave_a_usable_token(self, send_link):
        sent = services.request_auth_link(self.db, self.user.hs_email_id, "setup")
        self.assertFalse(sent)
        record = self.db.scalar(select(AuthLinkToken))
        self.assertIsNotNone(record.consumed_at)

    @patch("modules.auth.routes.settings.SMTP_HOST", None)
    @patch("modules.auth.services._send_auth_link")
    def test_setup_request_reports_missing_email_configuration(self, send_link):
        response = routes.request_account_setup(
            EmailLinkRequest(email=self.user.hs_email_id), self.db
        )
        body = json.loads(response.body)

        self.assertEqual(response.status_code, 503)
        self.assertFalse(body["success"])
        self.assertEqual(
            body["message"],
            "Email delivery is not configured. Contact your administrator.",
        )
        send_link.assert_not_called()

    @patch("modules.auth.services._send_auth_link")
    def test_reissued_link_invalidates_previous_token(self, send_link):
        services.request_auth_link(self.db, self.user.hs_email_id, "setup")
        first_token = send_link.call_args.args[1]
        services.request_auth_link(self.db, self.user.hs_email_id, "setup")
        second_token = send_link.call_args.args[1]

        with self.assertRaises(HTTPException):
            services.complete_auth_link(self.db, first_token, "first-password-123")
        services.complete_auth_link(self.db, second_token, "second-password-123")

    @patch("modules.auth.services._send_auth_link")
    def test_expired_link_is_rejected(self, send_link):
        services.request_auth_link(self.db, self.user.hs_email_id, "setup")
        token = send_link.call_args.args[1]
        record = self.db.scalar(select(AuthLinkToken))
        record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        self.db.commit()

        with self.assertRaises(HTTPException):
            services.complete_auth_link(self.db, token, "expired-password-123")

    @patch("modules.auth.services._send_auth_link")
    def test_unknown_and_already_setup_users_do_not_receive_setup_links(self, send_link):
        services.request_auth_link(self.db, "unknown@highspring.in", "setup")
        self.user.is_password_reset_required = False
        self.db.commit()
        services.request_auth_link(self.db, self.user.hs_email_id, "setup")
        send_link.assert_not_called()


if __name__ == "__main__":
    unittest.main()
