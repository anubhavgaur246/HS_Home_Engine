import io
import unittest
from unittest.mock import patch

from fastapi import HTTPException, UploadFile

from modules.announcement import storage
from modules.announcement.schemas import AnnouncementCreate


class FakeBlob:
    def __init__(self, content=b"", content_type="image/png"):
        self.content = content
        self.content_type = content_type
        self.size = len(content)

    def upload_from_string(self, content, content_type, if_generation_match):
        self.content = content
        self.content_type = content_type
        self.size = len(content)

    def exists(self):
        return True

    def download_as_bytes(self):
        return self.content


class FakeBucket:
    name = "announcement-test-bucket"

    def __init__(self):
        self.blobs = {}

    def blob(self, name):
        return self.blobs.setdefault(name, FakeBlob())


class AnnouncementStorageTests(unittest.IsolatedAsyncioTestCase):
    async def test_upload_validates_signature_and_returns_private_object_reference(self):
        bucket = FakeBucket()
        uploaded = UploadFile(filename="cover.png", file=io.BytesIO(b"\x89PNG\r\n\x1a\nimage"))
        with (
            patch.object(storage.settings, "ANNOUNCEMENT_MEDIA_BUCKET", bucket.name),
            patch("modules.announcement.storage._bucket", return_value=bucket),
        ):
            media_ref = await storage.upload_announcement_file(uploaded, "image")

        self.assertTrue(media_ref.startswith(f"gs://{bucket.name}/announcements/image/"))

    async def test_upload_rejects_mismatched_file_content(self):
        uploaded = UploadFile(filename="cover.png", file=io.BytesIO(b"not an image"))
        with self.assertRaises(HTTPException) as raised:
            await storage.upload_announcement_file(uploaded, "image")
        self.assertEqual(raised.exception.status_code, 400)

    def test_media_references_validate_and_serialize_to_api_urls(self):
        media_ref = "gs://announcement-test-bucket/announcements/image/example.png"
        payload = {
            "type": "UPDATE",
            "publish_date": "2026-11-20",
            "title": "Update",
            "summary": "Summary",
            "description": "Details",
            "image_url": media_ref,
        }
        with patch.object(storage.settings, "ANNOUNCEMENT_MEDIA_BUCKET", "announcement-test-bucket"):
            validated = AnnouncementCreate.model_validate(payload)
            media_url = storage.announcement_media_url(validated.image_url)
        self.assertEqual(
            media_url,
            "/api/announcements/media/announcements/image/example.png",
        )

    def test_media_download_reads_from_gcs_bucket(self):
        bucket = FakeBucket()
        blob = bucket.blob("announcements/document/test.pdf")
        blob.content = b"%PDF-test"
        blob.content_type = "application/pdf"
        blob.size = len(blob.content)
        with (
            patch.object(storage.settings, "ANNOUNCEMENT_MEDIA_BUCKET", bucket.name),
            patch("modules.announcement.storage._bucket", return_value=bucket),
        ):
            content, content_type = storage.download_announcement_file(blob_name := "announcements/document/test.pdf")
        self.assertEqual(content, b"%PDF-test")
        self.assertEqual(content_type, "application/pdf")


if __name__ == "__main__":
    unittest.main()