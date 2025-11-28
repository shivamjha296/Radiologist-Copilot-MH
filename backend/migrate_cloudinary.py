"""
Database Migration Script: Add Cloudinary Support
Migrates from file_path to file_url and adds patient_documents table
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def migrate_database():
    """
    Execute migration SQL commands to update database schema
    """
    with engine.begin() as conn:
        print("Starting database migration...")
        
        # Step 1: Create patient_documents table
        print("Creating patient_documents table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS patient_documents (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                document_name VARCHAR(200) NOT NULL,
                document_type VARCHAR(50) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Step 2: Add index on patient_id for better query performance
        print("Adding index on patient_documents.patient_id...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id 
            ON patient_documents(patient_id);
        """))
        
        # Step 3: Check if file_path column exists in scans table
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='scans' AND column_name='file_path';
        """))
        
        has_file_path = result.fetchone() is not None
        
        if has_file_path:
            print("Renaming scans.file_path to file_url...")
            # Rename column from file_path to file_url
            conn.execute(text("""
                ALTER TABLE scans 
                RENAME COLUMN file_path TO file_url;
            """))
            
            # Update column comment
            conn.execute(text("""
                COMMENT ON COLUMN scans.file_url IS 
                'Cloudinary HTTPS URL for X-ray image';
            """))
        else:
            print("scans.file_url already exists, skipping rename...")
        
        # Step 4: Make view_position have default value
        print("Updating scans.view_position default...")
        conn.execute(text("""
            ALTER TABLE scans 
            ALTER COLUMN view_position SET DEFAULT 'PA';
        """))
        
        print("✅ Migration completed successfully!")
        print("\nNew schema:")
        print("  - scans.file_path → scans.file_url")
        print("  - patient_documents table created")
        print("  - Indexes added for performance")


def rollback_migration():
    """
    Rollback migration (rename file_url back to file_path)
    """
    with engine.begin() as conn:
        print("Rolling back migration...")
        
        # Rename column back
        conn.execute(text("""
            ALTER TABLE scans 
            RENAME COLUMN file_url TO file_path;
        """))
        
        # Drop patient_documents table (careful!)
        conn.execute(text("""
            DROP TABLE IF EXISTS patient_documents CASCADE;
        """))
        
        print("✅ Rollback completed!")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        confirm = input("⚠️  Are you sure you want to rollback? This will delete patient_documents table! (yes/no): ")
        if confirm.lower() == "yes":
            rollback_migration()
        else:
            print("Rollback cancelled.")
    else:
        migrate_database()
