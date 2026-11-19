import unittest

from pydantic import ValidationError

from modules.announcement.models import Announcement
from modules.announcement.schemas import AnnouncementCreate, AnnouncementUpdate
from modules.announcement.services import serialize_announcement
from shared.enums import AnnouncementType


class AnnouncementTests(unittest.TestCase):
    def test_create_normalizes_cc_and_text(self):
        payload = AnnouncementCreate.model_validate(
            {
                "type": "UPDATE",
                "publish_date": "2026-11-19",
                "title": " Product update ",
                "summary": " A short summary ",
                "description": " Details ",
                "cc": [" Person@example.com ", "person@example.com"],
            }
        )

        self.assertEqual(payload.title, "Product update")
        self.assertEqual(payload.cc, ["person@example.com"])

    def test_invalid_cc_and_non_http_media_urls_are_rejected(self):
        base = {
            "type": "FIX",
            "publish_date": "2026-11-19",
            "title": "Fix",
            "summary": "Summary",
            "description": "Details",
        }
        with self.assertRaises(ValidationError):
            AnnouncementCreate.model_validate({**base, "cc": ["not-an-email"]})
        with self.assertRaises(ValidationError):
            AnnouncementCreate.model_validate({**base, "image_url": "/uploads/image.png"})
        with self.assertRaises(ValidationError):
            AnnouncementCreate.model_validate({**base, "title": "   "})

    def test_public_serialization_does_not_expose_cc(self):
        announcement = Announcement(
            id=3,
            type=AnnouncementType.FEATURE_LAUNCH,
            cc=["private@example.com"],
            title="Launch",
            summary="Summary",
            description="Details",
        )
        announcement.posted_by = type(
            "Poster",
            (),
            {"id": 8, "first_name": "Rahul", "last_name": "Mehta"},
        )()

        response = serialize_announcement(announcement)

        self.assertEqual(response["posted_by"]["name"], "Rahul Mehta")
        self.assertNotIn("cc", response)
        author_response = serialize_announcement(announcement, include_private=True)
        self.assertEqual(author_response["cc"], ["private@example.com"])

    def test_update_schema_accepts_partial_payload(self):
        payload = AnnouncementUpdate.model_validate({"title": "New title"})
        self.assertEqual(payload.model_dump(exclude_unset=True), {"title": "New title"})


if __name__ == "__main__":
    unittest.main()