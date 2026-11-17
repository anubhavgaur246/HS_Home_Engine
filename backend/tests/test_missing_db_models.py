import unittest

from modules.users.models import AccessControl, Bugs, DemoQueries, EmailQueries, Tools
from modules.users.schemas import ToolCreatePayload


class MissingDbModelTests(unittest.TestCase):
    def test_required_tables_exist_as_sqlalchemy_models(self):
        expected_tables = {
            "Bugs": Bugs.__table__,
            "DemoQueries": DemoQueries.__table__,
            "EmailQueries": EmailQueries.__table__,
            "access_control": AccessControl.__table__,
            "tools": Tools.__table__,
        }

        self.assertSetEqual(set(expected_tables.keys()), {table.name for table in expected_tables.values()})

        self.assertTrue({"requestor_email", "subject", "issue_details"}.issubset({c.name for c in Bugs.__table__.columns}))
        self.assertTrue({"requestor_name", "email_id", "notes", "demo_request_date"}.issubset({c.name for c in DemoQueries.__table__.columns}))
        self.assertTrue({"send_by", "sent_to", "cc", "bcc", "subject"}.issubset({c.name for c in EmailQueries.__table__.columns}))
        self.assertTrue({"role", "ldap", "hs_email", "access_list"}.issubset({c.name for c in AccessControl.__table__.columns}))
        self.assertTrue({"name", "link", "video_url", "user_guide_url", "poc_id", "description", "is_product_live", "is_upcoming"}.issubset({c.name for c in Tools.__table__.columns}))

    def test_tool_payload_contains_expected_fields(self):
        fields = set(ToolCreatePayload.model_fields)
        self.assertTrue({"name", "link", "video_url", "user_guide_url", "poc_id", "description", "is_product_live", "is_upcoming"}.issubset(fields))


if __name__ == "__main__":
    unittest.main()
