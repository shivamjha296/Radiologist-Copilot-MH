"""
Migration script to CLEAR all data and add phone_number fields
⚠️ WARNING: This will DELETE ALL existing data from patients, scans, and reports tables

Run this script to clean database and add phone fields:
    python backend/migrate_clean_and_add_phones.py
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_clean_and_add_phones():
    """Clear all data and add phone number columns"""
    
    # Get database URL and fix Render format
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        sys.exit(1)
    
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    print(f"🔗 Connecting to database...")
    
    # Create engine with SSL for Render
    engine = create_engine(
        DATABASE_URL,
        echo=True,  # Show SQL commands
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10,
        } if "render.com" in DATABASE_URL else {}
    )
    
    try:
        with engine.begin() as conn:
            print("\n📋 Starting clean migration...\n")
            
            # Step 1: Delete all existing data (CASCADE will handle foreign keys)
            print("⚠️  Step 1: Deleting all existing data...")
            print("   ⏳ Deleting reports...")
            result = conn.execute(text("DELETE FROM reports;"))
            print(f"   ✓ Deleted {result.rowcount} reports")
            
            print("   ⏳ Deleting patient_documents...")
            result = conn.execute(text("DELETE FROM patient_documents;"))
            print(f"   ✓ Deleted {result.rowcount} documents")
            
            print("   ⏳ Deleting scans...")
            result = conn.execute(text("DELETE FROM scans;"))
            print(f"   ✓ Deleted {result.rowcount} scans")
            
            print("   ⏳ Deleting patients...")
            result = conn.execute(text("DELETE FROM patients;"))
            print(f"   ✓ Deleted {result.rowcount} patients\n")
            
            # Step 2: Add phone_number to patients if not exists
            print("✅ Step 2: Adding phone_number to patients table...")
            result = conn.execute(text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'patients' 
                    AND column_name = 'phone_number'
                );
                """
            ))
            phone_exists = result.scalar()
            
            if phone_exists:
                print("   ℹ️  phone_number already exists - skipping\n")
            else:
                conn.execute(text(
                    "ALTER TABLE patients ADD COLUMN phone_number VARCHAR(20);"
                ))
                print("   ✓ phone_number column added to patients\n")
            
            # Step 3: Add radiologist_phone to reports if not exists
            print("✅ Step 3: Adding radiologist_phone to reports table...")
            result = conn.execute(text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'reports' 
                    AND column_name = 'radiologist_phone'
                );
                """
            ))
            radiologist_phone_exists = result.scalar()
            
            if radiologist_phone_exists:
                print("   ℹ️  radiologist_phone already exists - skipping\n")
            else:
                conn.execute(text(
                    "ALTER TABLE reports ADD COLUMN radiologist_phone VARCHAR(20);"
                ))
                print("   ✓ radiologist_phone column added to reports\n")
            
            # Step 4: Create indexes
            print("✅ Step 4: Creating indexes...")
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);"
            ))
            print("   ✓ Index created on patients.phone_number")
            
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_reports_radiologist_phone ON reports(radiologist_phone);"
            ))
            print("   ✓ Index created on reports.radiologist_phone\n")
            
            # Step 5: Reset sequences
            print("✅ Step 5: Resetting ID sequences...")
            conn.execute(text("ALTER SEQUENCE patients_id_seq RESTART WITH 1;"))
            conn.execute(text("ALTER SEQUENCE scans_id_seq RESTART WITH 1;"))
            conn.execute(text("ALTER SEQUENCE reports_id_seq RESTART WITH 1;"))
            conn.execute(text("ALTER SEQUENCE patient_documents_id_seq RESTART WITH 1;"))
            print("   ✓ All sequences reset to start from 1\n")
            
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\n📊 Summary:")
        print("  • All existing data DELETED from all tables")
        print("  • patients.phone_number (VARCHAR(20)) added/verified")
        print("  • reports.radiologist_phone (VARCHAR(20)) added/verified")
        print("  • Indexes created for phone searches")
        print("  • ID sequences reset to 1")
        print("\n✨ Database is now clean with phone number fields!")
        print("   You can start fresh with new patients and reports.\n")
        
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        sys.exit(1)
    
    finally:
        engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("  ⚠️  DATA DELETION + PHONE MIGRATION SCRIPT")
    print("=" * 60)
    print("\n🚨 WARNING: THIS WILL DELETE ALL DATA! 🚨\n")
    print("This script will:")
    print("  1. DELETE all records from reports table")
    print("  2. DELETE all records from patient_documents table")
    print("  3. DELETE all records from scans table")
    print("  4. DELETE all records from patients table")
    print("  5. Add phone_number to patients")
    print("  6. Add radiologist_phone to reports")
    print("  7. Reset all ID sequences to 1")
    print("\n⚠️  THIS ACTION CANNOT BE UNDONE!")
    print("   All patient data, scans, and reports will be permanently deleted.\n")
    
    response = input("Type 'DELETE ALL DATA' to continue: ").strip()
    
    if response == 'DELETE ALL DATA':
        confirm = input("\nAre you absolutely sure? Type 'yes' to proceed: ").strip().lower()
        if confirm == 'yes':
            print("\n🔥 Starting data deletion and migration...\n")
            migrate_clean_and_add_phones()
        else:
            print("\n❌ Migration cancelled")
            sys.exit(0)
    else:
        print("\n❌ Migration cancelled - incorrect confirmation phrase")
        sys.exit(0)
