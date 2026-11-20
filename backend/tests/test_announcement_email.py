import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock, patch

from modules.announcement.routes import _schedule_announcement_notification
from modules.announcement.services import send_announcement_notification


class AnnouncementEmailTests(unittest.TestCase):
    def test_schedules_announcement_for_publisher_and_cc_recipients(self):
        data = {
            "id": 5,
            "cc": ["person@example.test"],
            "email_subject": "Announcement subject",
            "title": "Announcement title",
            "summary": "Short summary",
            "description": "Announcement details",
            "publish_date": date(2026, 11, 20),
        }
        actor = SimpleNamespace(hs_email_id="publisher@example.test")
        background_tasks = SimpleNamespace(add_task=Mock())

        _schedule_announcement_notification(background_tasks, data, actor)

        background_tasks.add_task.assert_called_once()
        args = background_tasks.add_task.call_args.args
        self.assertEqual(args[0], send_announcement_notification)
        self.assertEqual(args[1:4], (5, "publisher@example.test", ["person@example.test"]))
        self.assertEqual(args[4], "Announcement subject")
        self.assertIn("Announcement details", args[5])

    def test_skips_notification_without_cc_recipients(self):
        background_tasks = SimpleNamespace(add_task=Mock())
        _schedule_announcement_notification(background_tasks, {"cc": []}, SimpleNamespace())
        background_tasks.add_task.assert_not_called()

    def test_background_sender_sends_message(self):
        with patch("modules.announcement.services.EmailUtils.send_email") as send_email:
            send_announcement_notification(
                5,
                "publisher@example.test",
                ["person@example.test"],
                "Subject",
                "Body",
            )

        send_email.assert_called_once_with(
            to_email="publisher@example.test",
            subject="Subject",
            body="Body",
            cc=["person@example.test"],
        )


if __name__ == "__main__":
    unittest.main()