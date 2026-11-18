import unittest
from unittest.mock import patch

from shared.utils import EmailUtils


class SendEmailTests(unittest.TestCase):
    @patch("shared.utils.settings.SMTP_HOST", "smtp.example.test")
    @patch("shared.utils.settings.SMTP_FROM_EMAIL", "sender@example.test")
    @patch("shared.utils.settings.SMTP_USERNAME", "smtp-user")
    @patch("shared.utils.settings.SMTP_PASSWORD", "smtp-password")
    @patch("shared.utils.settings.SMTP_USE_TLS", True)
    def test_sends_configured_email_over_tls(self):
        with patch("shared.utils.smtplib.SMTP") as smtp_factory:
            smtp = smtp_factory.return_value.__enter__.return_value

            EmailUtils.send_email(
                "recipient@example.test",
                "Subject",
                "Message body",
                "<p>HTML body</p>",
            )

        smtp_factory.assert_called_once_with("smtp.example.test", 587, timeout=15)
        smtp.starttls.assert_called_once_with()
        smtp.login.assert_called_once_with("smtp-user", "smtp-password")
        sent_message = smtp.send_message.call_args.args[0]
        self.assertEqual(sent_message["To"], "recipient@example.test")
        self.assertEqual(sent_message["From"], "sender@example.test")
        self.assertEqual(sent_message["Subject"], "Subject")
        plain_part = sent_message.get_body(preferencelist=("plain",))
        self.assertEqual(plain_part.get_content().strip(), "Message body")
        html_part = sent_message.get_body(preferencelist=("html",))
        self.assertIn("<p>HTML body</p>", html_part.get_content())

    @patch("shared.utils.settings.SMTP_HOST", None)
    @patch("shared.utils.settings.SMTP_FROM_EMAIL", "sender@example.test")
    @patch("shared.utils.smtplib.SMTP")
    def test_requires_host_and_sender_configuration(self, smtp_factory):
        with self.assertRaisesRegex(RuntimeError, "SMTP_HOST and SMTP_FROM_EMAIL"):
            EmailUtils.send_email("recipient@example.test", "Subject", "Message body")

        smtp_factory.assert_not_called()


if __name__ == "__main__":
    unittest.main()