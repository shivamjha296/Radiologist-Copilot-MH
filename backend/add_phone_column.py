"""
Migration script to add phone column to patients table
Run this to update existing database with phone field for Twilio notifications
"""
from sqlalchemy import text
from database import engine

def add_phone_column():
    """Add phone column to patients table"""
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='patients' AND column_name='phone'
            """))
            
            if result.fetchone():
                print("✓ Phone column already exists in patients table")
                return
            
            # Add phone column
            conn.execute(text("""
                ALTER TABLE patients 
                ADD COLUMN phone VARCHAR(20) 
                COMMENT 'Phone number for Twilio notifications'
            """))
            conn.commit()
            print("✓ Successfully added phone column to patients table")
            
    except Exception as e:
        print(f"✗ Error adding phone column: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Adding phone column to patients table")
    print("=" * 60)
    add_phone_column()
    print("=" * 60)
    print("Migration complete!")
    print("=" * 60)
