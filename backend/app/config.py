from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator, Field, AliasChoices
import json

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost/ostrichai"

    # JWT
    secret_key: str = "your-secret-key-here"  # Default fallback
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: Union[List[str], str] = [
        "https://app.getostrichai.com",
        "http://app.getostrichai.com",
        "https://getostrichai.com",
        "http://getostrichai.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://72.60.215.204:5173",
        "http://72.60.215.204:5174"
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            raw_list = v
        elif isinstance(v, str):
            # Try to parse as JSON first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    raw_list = parsed
                else:
                    raw_list = [v]
            except (json.JSONDecodeError, ValueError):
                # Fallback: strip brackets and split by comma
                clean_v = v.strip().lstrip('[').rstrip(']')
                raw_list = [item.strip().strip("'").strip('"') for item in clean_v.split(",") if item.strip()]
        else:
            return v

        # Scheme expansion: Ensure both http and https are allowed for any domain provided
        expanded = set()
        for origin in raw_list:
            expanded.add(origin)
            if origin.startswith("http://"):
                expanded.add(origin.replace("http://", "https://"))
            elif origin.startswith("https://"):
                expanded.add(origin.replace("https://", "http://"))
        
        return list(expanded)

    # Payment providers
    flutterwave_secret_key: str = ""
    vite_flutterwave_public_key: str = ""
    flutterwave_secret_hash: str = ""
    paystack_secret_key: str = ""
    polar_secret_key: str = ""
    vite_polar_webhook_secret: str = ""

    # Mailtrap (API)
    mailtrap_api_key: str = ""
    mailtrap_sender_email: str = "noreply@getostrichai.com" 

    # Mailtrap (SMTP)
    smtp_server: str = "live.smtp.mailtrap.io"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@getostrichai.com" # Default sender

    vite_app_url: str = Field("", validation_alias=AliasChoices("VITE_APP_URL", "APP_URL"))

    # Google OAuth
    google_client_id: str = Field("", validation_alias=AliasChoices("GOOGLE_CLIENT_ID", "VITE_GOOGLE_CLIENT_ID"))
    google_client_secret: str = Field("", validation_alias=AliasChoices("GOOGLE_CLIENT_SECRET", "VITE_GOOGLE_CLIENT_SECRET"))
    vite_google_redirect_url: str = Field("", validation_alias=AliasChoices("VITE_GOOGLE_REDIRECT_URL", "GOOGLE_REDIRECT_URL"))

    # Cloudinary
    vite_cloudinary_cloud_name: str = ""
    vite_cloudinary_upload_preset: str = ""
    vite_cloudinary_api_key: str = ""

    # TikTok
    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""

    vite_cloudinary_api_secret: str = ""

    # Social Media
    linkedin_client_id: str = Field("", validation_alias=AliasChoices("LINKEDIN_CLIENT_ID", "VITE_LINKEDIN_CLIENT_ID"))
    linkedin_client_secret: str = Field("", validation_alias=AliasChoices("LINKEDIN_CLIENT_SECRET", "VITE_LINKEDIN_CLIENT_SECRET"))
    vite_facebook_app_id: str = ""
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    instagram_app_id: str = ""
    instagram_app_secret: str = ""

    # Twitter
    twitter_client_id: str = ""
    twitter_client_secret: str = ""
    # AI / Other
    vite_kie_api_key: str = ""
    vite_imgbb_api_key: str = ""
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
