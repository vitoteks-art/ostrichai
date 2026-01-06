from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost/ostrichai"

    # JWT
    secret_key: str = "your-secret-key-here"  # Default fallback
    supabase_jwt_secret: str = "" # Add explicitly to read from env
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

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
    facebook_app_secret: str = ""
    vite_linkedin_client_id: str = ""
    linkedin_client_secret: str = ""

    # AI / Other
    vite_kie_api_key: str = ""
    vite_imgbb_api_key: str = ""
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()