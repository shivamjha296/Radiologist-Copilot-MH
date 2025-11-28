"""
One-Click Database Initialization Script
========================================
ETL Pipeline for Radiology Database Setup:
1. Wait for PostgreSQL to be ready (retry with exponential backoff)
2. Enable pgvector extension
3. Create all tables from SQLAlchemy models
4. Seed with sample medical data

Usage:
    python init_db.py
"""
import sys
import time
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

# Add backend to path for imports
sys.path.insert(0, 'backend')

from backend.database import engine, get_db_session
from backend.models import Base, Patient, Scan, Report


def wait_for_db(max_retries: int = 15, retry_interval: int = 2) -> bool:
    """
    Wait for PostgreSQL to be ready with retry logic
    
    Args:
        max_retries: Maximum number of connection attempts
        retry_interval: Seconds to wait between retries
    
    Returns:
        True if connection successful, False otherwise
    """
    print("🔄 Waiting for PostgreSQL to be ready...")
    
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                print(f"✅ PostgreSQL is ready! (Attempt {attempt}/{max_retries})")
                return True
        except OperationalError as e:
            if attempt < max_retries:
                print(f"⏳ Connection attempt {attempt}/{max_retries} failed. Retrying in {retry_interval}s...")
                time.sleep(retry_interval)
            else:
                print(f"❌ Failed to connect to PostgreSQL after {max_retries} attempts.")
                print(f"   Error: {e}")
                return False
    
    return False


def enable_vector_extension():
    """Enable pgvector extension for vector embeddings"""
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            print("✅ pgvector extension enabled")
    except Exception as e:
        print(f"❌ Failed to enable pgvector extension: {e}")
        raise


def create_tables():
    """Create all database tables from SQLAlchemy models"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully")
        print(f"   Tables: {', '.join(Base.metadata.tables.keys())}")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        raise


def seed_sample_data():
    """Insert sample medical data for testing"""
    db = get_db_session()
    
    try:
        # Check if data already exists
        existing_patient = db.query(Patient).filter_by(mrn="MRN555").first()
        if existing_patient:
            print("ℹ️  Sample data already exists. Skipping seed.")
            return
        
        print("🌱 Seeding sample data...")
        
        # Create sample patient
        patient = Patient(
            mrn="MRN555",
            name="Yash M. Patel",
            age=21,
            gender="Male",
            created_at=datetime.utcnow()
        )
        db.add(patient)
        db.flush()  # Get patient.id before creating scan
        
        # Create sample scan
        scan = Scan(
            patient_id=patient.id,
            file_path="/uploads/chest_xrays/yash_patel_20231115_pa.dcm",
            body_part="CHEST",
            view_position="PA",
            modality="DX",
            scan_date=datetime.utcnow()
        )
        db.add(scan)
        db.flush()  # Get scan.id before creating report
        
        # Create sample report with NER tags and dummy embedding
        report = Report(
            scan_id=scan.id,
            radiologist_name="Dr. Anjali Sharma, MD",
            full_text=(
                "CHEST X-RAY (PA VIEW)\n\n"
                "CLINICAL HISTORY: 21-year-old male presenting with mild cough for 3 days. "
                "No fever, no shortness of breath.\n\n"
                "FINDINGS:\n"
                "- Heart: Normal size and contour. Cardiothoracic ratio within normal limits.\n"
                "- Lungs: Clear bilaterally. No infiltrates, effusions, or pneumothorax.\n"
                "- Mediastinum: Normal width. No lymphadenopathy.\n"
                "- Bones: No acute fractures or destructive lesions.\n\n"
                "IMPRESSION:\n"
                "No acute cardiopulmonary abnormality. Lungs are clear with no signs of infection."
            ),
            impression="No acute cardiopulmonary abnormality. Lungs are clear with no signs of infection.",
            ner_tags=[
                {"entity": "Heart", "label": "Anatomy", "status": "Normal"},
                {"entity": "Lungs", "label": "Anatomy", "status": "Clear"},
                {"entity": "Cardiothoracic ratio", "label": "Measurement", "status": "Normal"},
                {"entity": "No infiltrates", "label": "Finding", "status": "Negative"},
                {"entity": "No pneumothorax", "label": "Finding", "status": "Negative"}
            ],
            embedding=[0.1] * 1536  # Dummy OpenAI embedding (1536 dimensions)
        )
        db.add(report)
        
        # Commit all changes
        db.commit()
        
        print("✅ Database initialized and seeded with sample data:")
        print(f"   👤 Patient: {patient.name} (MRN: {patient.mrn})")
        print(f"   🏥 Scan: {scan.body_part} X-Ray ({scan.view_position} view)")
        print(f"   📄 Report: {len(report.full_text)} characters")
        print(f"   🏷️  NER Tags: {len(report.ner_tags)} entities extracted")
        print(f"   🧠 Embedding: {len(report.embedding)}-dimensional vector")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to seed data: {e}")
        raise
    finally:
        db.close()


def main():
    """Main initialization pipeline"""
    print("=" * 60)
    print("🏥 RADIOLOGY DATABASE INITIALIZATION")
    print("=" * 60)
    
    # Step 1: Wait for database
    if not wait_for_db():
        print("\n❌ Initialization failed: Could not connect to database")
        print("   Make sure Docker containers are running:")
        print("   docker-compose up -d")
        sys.exit(1)
    
    # Step 2: Enable vector extension
    print("\n" + "=" * 60)
    enable_vector_extension()
    
    # Step 3: Create tables
    print("\n" + "=" * 60)
    create_tables()
    
    # Step 4: Seed sample data
    print("\n" + "=" * 60)
    seed_sample_data()
    
    print("\n" + "=" * 60)
    print("🎉 DATABASE READY FOR USE!")
    print("=" * 60)
    print("\n📊 Access pgAdmin at: http://localhost:5050")
    print("   Email: admin@admin.com")
    print("   Password: admin")
    print("\n🔌 Database Connection:")
    print("   Host: localhost:5432")
    print("   Database: radiology_db")
    print("   Username: admin")
    print("   Password: radpass")
    print("\n💡 Next Steps:")
    print("   1. Connect pgAdmin to the database")
    print("   2. Explore the 'patients', 'scans', and 'reports' tables")
    print("   3. Start building your FastAPI endpoints!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
