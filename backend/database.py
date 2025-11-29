"""
Database connection and session management
PostgreSQL with pgvector extension for semantic search
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Load environment variables from parent directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Database connection string from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:radpass@localhost:5432/radiology_db")

# Fix Render database URL (postgres:// → postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with connection pooling and SSL support
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    connect_args={
        "sslmode": "require",  # Require SSL for external connections
        "connect_timeout": 10,
    } if "render.com" in DATABASE_URL else {}
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


def init_db():
    """
    Initialize the database with pgvector extension and create all tables
    Call this on application startup to ensure database is ready
    
    Steps:
    1. Enable pgvector extension (if not already enabled)
    2. Create all tables from SQLAlchemy models
    
    Usage:
        from database import init_db
        init_db()
    """
    from models import Base  # Import here to avoid circular dependency
    
    try:
        # Step A: Enable pgvector extension
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            print("✅ pgvector extension enabled")
        
        # Step B: Create all tables from models
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created/updated successfully")
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise