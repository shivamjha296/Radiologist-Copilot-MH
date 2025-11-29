"""
Migration script to add phone_number fields to patients and reports tables

Run this script to add phone number columns:
    python backend/migrate_add_phone_numbers.py
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_add_phone_numbers():
    """Execute database migration to add phone number columns"""
    
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
            print("\n📋 Starting phone number migration...\n")
            
            # Step 1: Check if patients table exists
            print("✅ Step 1: Checking patients table...")
            result = conn.execute(text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'patients'
                );
                """
            ))
            patients_exists = result.scalar()
            
            if not patients_exists:
                print("   ⚠️  Patients table doesn't exist yet - will be created by init_db()")
            else:
                print("   ✓ Patients table found\n")
                
                # Check if phone_number column already exists in patients
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
                    print("✅ Step 2: phone_number already exists in patients table - skipping\n")
                else:
                    print("✅ Step 2: Adding phone_number column to patients table...")
                    conn.execute(text(
                        """
                        ALTER TABLE patients 
                        ADD COLUMN phone_number VARCHAR(20);
                        """
                    ))
                    print("   ✓ phone_number column added to patients\n")
            
            # Step 3: Check if reports table exists
            print("✅ Step 3: Checking reports table...")
            result = conn.execute(text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'reports'
                );
                """
            ))
            reports_exists = result.scalar()
            
            if not reports_exists:
                print("   ⚠️  Reports table doesn't exist yet - will be created by init_db()")
            else:
                print("   ✓ Reports table found\n")
                
                # Check if radiologist_phone column already exists in reports
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
                    print("✅ Step 4: radiologist_phone already exists in reports table - skipping\n")
                else:
                    print("✅ Step 4: Adding radiologist_phone column to reports table...")
                    conn.execute(text(
                        """
                        ALTER TABLE reports 
                        ADD COLUMN radiologist_phone VARCHAR(20);
                        """
                    ))
                    print("   ✓ radiologist_phone column added to reports\n")
            
            # Step 5: Create indexes for phone number searches (optional but recommended)
            print("✅ Step 5: Creating indexes for phone number columns...")
            if patients_exists:
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);"
                ))
                print("   ✓ Index created on patients.phone_number")
            
            if reports_exists:
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_reports_radiologist_phone ON reports(radiologist_phone);"
                ))
                print("   ✓ Index created on reports.radiologist_phone\n")
            
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nDatabase updated with:")
        print("  • patients.phone_number (VARCHAR(20), nullable)")
        print("  • reports.radiologist_phone (VARCHAR(20), nullable)")
        print("  • Indexes for efficient phone number searches")
        print("\nNext steps:")
        print("  1. Update API endpoints to handle phone numbers")
        print("  2. Update frontend forms to collect phone numbers")
        print("  3. Restart your backend server")
        print("  4. Test patient/radiologist creation with phone numbers")
        
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        sys.exit(1)
    
    finally:
        engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("  PHONE NUMBER MIGRATION SCRIPT")
    print("=" * 60)
    print("\nThis script will:")
    print("  1. Add phone_number to patients table")
    print("  2. Add radiologist_phone to reports table")
    print("  3. Create indexes for phone searches")
    print("\n⚠️  WARNING: This will modify the database schema!")
    print("   Existing data will be preserved (columns are nullable).\n")
    
    response = input("Continue with migration? (yes/no): ").strip().lower()
    
    if response == 'yes':
        migrate_add_phone_numbers()
    else:
        print("\n❌ Migration cancelled by user")
        sys.exit(0)
