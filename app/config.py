from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator
import json

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost/ostrichai"

    # JWT
    secret_key: str = "your-secret-key-here"  # Default fallback
    supabase_jwt_secret: str = "" # Add explicitly to read from env
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: Union[List[str], str] = [
        "https://app.getostrichai.com",
        "http://app.getostrichai.com",
        "http://localhost:3000",
        "http://localhost:5173"
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

    # Email
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""

    # Supabase
    vite_supabase_url: str = ""
    vite_supabase_anon_key: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    vite_google_redirect_url: str = ""

    # Cloudinary
    vite_cloudinary_cloud_name: str = ""
    vite_cloudinary_upload_preset: str = ""
    vite_cloudinary_api_key: str = ""
    vite_cloudinary_api_secret: str = ""

    # Social Media
    vite_facebook_app_id: str = ""
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    vite_linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    instagram_app_id: str = ""
    instagram_app_secret: str = ""

    # AI / Other
    vite_kie_api_key: str = ""
    vite_imgbb_api_key: str = ""
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()