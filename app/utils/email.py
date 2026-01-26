import httpx
import logging
from typing import Optional
from urllib.parse import quote
from ..config import settings

logger = logging.getLogger(__name__)

async def send_verification_email(email: str, code: str):
    """
    Send a verification email with a 6-digit code using Mailtrap API.
    """
    if not settings.mailtrap_api_key:
        logger.warning("Mailtrap API key not set. Skipping email sending.")
        return False

    url = "https://send.api.mailtrap.io/api/send"
    
    headers = {
        "Authorization": f"Bearer {settings.mailtrap_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "from": {"email": settings.mailtrap_sender_email, "name": "OstrichAi"},
        "to": [{"email": email}],
        "subject": "Verify your email - OstrichAi",
        "text": f"Your verification code is: {code}. It will expire in 10 minutes.",
        "category": "Email Verification"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            logger.info(f"Verification email sent to {email}")
            return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        # Log the response body if available for debugging
        if hasattr(e, 'response') and e.response is not None:
             logger.error(f"Mailtrap error response: {e.response.text}")
        return False

async def send_password_reset_email(email: str, code: str, reset_url: Optional[str] = None):
    """
    Send a password reset email with a 6-digit code.
    """
    if not settings.mailtrap_api_key:
        logger.warning("Mailtrap API key not set. Skipping email sending.")
        return False

    if not reset_url and settings.vite_app_url:
        base_url = settings.vite_app_url.rstrip("/")
        reset_url = f"{base_url}/reset-password?email={quote(email)}&code={quote(code)}"

    url = "https://send.api.mailtrap.io/api/send"

    headers = {
        "Authorization": f"Bearer {settings.mailtrap_api_key}",
        "Content-Type": "application/json",
    }

    reset_link_line = f"\nReset link: {reset_url}" if reset_url else ""
    payload = {
        "from": {"email": settings.mailtrap_sender_email, "name": "OstrichAi"},
        "to": [{"email": email}],
        "subject": "Reset your password - OstrichAi",
        "text": f"Your password reset code is: {code}. It will expire in 10 minutes.{reset_link_line}",
        "category": "Password Reset"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            logger.info(f"Password reset email sent to {email}")
            return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Mailtrap error response: {e.response.text}")
        return False
