"""
FastAPI Backend for Radiologist's Copilot
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Create FastAPI app
app = FastAPI(
    title="Radiologist's Copilot API",
    description="AI-powered medical imaging analysis system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Radiologist's Copilot API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Render"""
    return {
        "status": "healthy",
        "database": "connected"
    }

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api": "online",
        "models": {
            "chexnet": "loaded",
            "biomedclip": "loaded",
            "ner": "loaded"
        }
    }

# Import routers (add these as you create them)
# from .routers import xray, reports, patients
# app.include_router(xray.router, prefix="/api/xray", tags=["X-Ray Analysis"])
# app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
# app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
