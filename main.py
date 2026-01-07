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

app = FastAPI(
    title="OstrichAI API",
    description="Backend API for OstrichAI platform",
    version="1.0.0",
    lifespan=lifespan
)

# Debug: Print settings on startup
print("--- BACKEND STARTUP ---", flush=True)
print(f"ALLOWED_ORIGINS: {settings.allowed_origins}", flush=True)
print("-----------------------", flush=True)

# Configure CORS
# We temporarily allow all to debug the 400 error
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Credentials can't be used with "*"
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
async def cors_debug_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        method = request.headers.get("access-control-request-method")
        headers = request.headers.get("access-control-request-headers")
        print(f"DEBUG OPTIONS: Origin={origin}, Method={method}, Headers={headers}", file=sys.stderr, flush=True)
    
    response = await call_next(request)
    return response
    
# Trigger reload