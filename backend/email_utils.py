import os
import resend
from typing import List

resend.api_key = os.getenv("RESEND_API_KEY")

def send_email(to_email: str, subject: str, html_content: str):
    try:
        params = {
            "from": "Bitzantine <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        email = resend.Emails.send(params)
        return email
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
