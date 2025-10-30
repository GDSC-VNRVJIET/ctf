from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routers import auth, teams, game, admin
from middleware import rate_limit_middleware

app = FastAPI(title="CTF Platform API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "https://*.onrender.com",  # Allow all Render subdomains
        "https://ctf-platform-frontend.onrender.com",  # Specific frontend URL (update with actual URL)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(game.router, prefix="/api", tags=["game"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
def root():
    return {"message": "CTF Platform API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "CTF Platform API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
