from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ingestion, quiz, student, admin, profile
from app.database.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Adaptive Quiz Learning Platform",
    description="A comprehensive quiz learning platform with AI-powered adaptive difficulty",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingestion.router, prefix="/api/v1", tags=["ingestion"])
app.include_router(quiz.router, prefix="/api/v1", tags=["quiz"])
app.include_router(student.router, prefix="/api/v1", tags=["student"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])
app.include_router(profile.router, prefix="/api/v1", tags=["profile"])

@app.get("/")
async def root():
    return {"message": "AI Adaptive Quiz Learning Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
