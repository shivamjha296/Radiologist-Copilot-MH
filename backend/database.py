"""
Database connection and session management
PostgreSQL with pgvector extension for semantic search
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Database connection string
DATABASE_URL = "postgresql://admin:radpass@localhost:5432/radiology_db"

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function for FastAPI endpoints
    Provides a database session and ensures cleanup
    
    Usage:
        @app.get("/patients")
        def get_patients(db: Session = Depends(get_db)):
            return db.query(Patient).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """
    Direct session creation for scripts and CLI tools
    Remember to close the session after use
    
    Usage:
        db = get_db_session()
        try:
            patients = db.query(Patient).all()
        finally:
            db.close()
    """
    return SessionLocal()