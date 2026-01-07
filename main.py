from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.routers import auth, users, subscriptions, payments, referrals, admin, projects, social_media, campaigns

from contextlib import asynccontextmanager

# Create database tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

from app.config import settings

# Debug: Print settings on startup
print("--- BACKEND STARTUP ---", flush=True)
print(f"ALLOWED_ORIGINS (raw): {settings.allowed_origins}", flush=True)

app = FastAPI(
    title="OstrichAI API",
    description="Backend API for OstrichAI platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.allowed_origins
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

# Remove any empty strings and ensure it's a list
origins = [o for o in origins if o]
print(f"ALLOWED_ORIGINS (parsed): {origins}", flush=True)
print("-----------------------", flush=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["https://app.getostrichai.com", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(referrals.router, prefix="/api/referrals", tags=["Referrals"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(social_media.router, prefix="/api/social", tags=["Social Media"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Ad Campaigns"])

@app.get("/")
async def root():
    return {"message": "OstrichAI API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from fastapi import Request
import sys

@app.middleware("http")
async def diagnostic_logging_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        headers = request.headers.get("access-control-request-headers")
        print(f"DIAGNOSTIC OPTIONS: Origin={origin}, Headers={headers}", file=sys.stderr, flush=True)
    
    response = await call_next(request)
    
    if response.status_code == 400:
        print(f"DIAGNOSTIC 400 ERROR: {request.method} {request.url}", file=sys.stderr, flush=True)
    
    return response
    
# Trigger reload