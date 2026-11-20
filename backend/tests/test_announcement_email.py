import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from modules.announcement.services import _send_announcement_notification


class AnnouncementEmailTests(unittest.TestCase):
    def test_sends_announcement_to_publisher_and_cc_recipients(self):
        announcement = SimpleNamespace(
            id=5,
            cc=["person@example.test"],
            email_subject="Announcement subject",
            title="Announcement title",
            summary="Short summary",
            description="Announcement details",
            publish_date=date(2026, 11, 20),
        )
        actor = SimpleNamespace(hs_email_id="publisher@example.test")

        with patch("modules.announcement.services.EmailUtils.send_email") as send_email:
            _send_announcement_notification(announcement, actor)

        send_email.assert_called_once()
        kwargs = send_email.call_args.kwargs
        self.assertEqual(kwargs["to_email"], "publisher@example.test")
        self.assertEqual(kwargs["cc"], ["person@example.test"])
        self.assertEqual(kwargs["subject"], "Announcement subject")
        self.assertIn("Announcement details", kwargs["body"])

    def test_skips_notification_without_cc_recipients(self):
        announcement = SimpleNamespace(cc=[])
        with patch("modules.announcement.services.EmailUtils.send_email") as send_email:
            _send_announcement_notification(announcement, SimpleNamespace())
        send_email.assert_not_called()


if __name__ == "__main__":
    unittest.main()