"""
Database Setup and Schema Update Script
This will update your MySQL database with WhatsApp integration fields
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def setup_database():
    """Update database schema for WhatsApp integration."""
    
    print("\n" + "="*70)
    print("🗄️  DATABASE SCHEMA UPDATE FOR WHATSAPP INTEGRATION")
    print("="*70)
    
    # Get MySQL password
    mysql_password = os.getenv('MYSQL_PASSWORD')
    
    if mysql_password == 'your_password_here':
        print("\n❌ ERROR: MySQL password not configured!")
        print("\nPlease update your .env file:")
        print("   MYSQL_PASSWORD=YourActualPassword")
        print("\nThen run this script again.")
        return False
    
    print("\n📋 Configuration:")
    print(f"   Host: {os.getenv('MYSQL_HOST')}")
    print(f"   User: {os.getenv('MYSQL_USER')}")
    print(f"   Database: {os.getenv('MYSQL_DATABASE')}")
    
    try:
        # Connect to MySQL
        print("\n🔌 Connecting to MySQL...")
        conn = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST'),
            user=os.getenv('MYSQL_USER'),
            password=mysql_password,
            database=os.getenv('MYSQL_DATABASE')
        )
        cursor = conn.cursor()
        print("✅ Connected successfully!")
        
        # Check if tables exist
        print("\n📊 Checking existing tables...")
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        print(f"   Found tables: {', '.join(tables)}")
        
        if 'patients' not in tables or 'reports' not in tables:
            print("\n⚠️  WARNING: Base tables (patients, reports) not found!")
            print("   Creating base tables first...")
            
            # Create patients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    age INT,
                    gender VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("   ✅ Created 'patients' table")
            
            # Create reports table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    patient_id INT,
                    filename VARCHAR(255),
                    findings TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
                )
            """)
            print("   ✅ Created 'reports' table")
            conn.commit()
        
        # Add WhatsApp fields
        print("\n🔧 Adding WhatsApp integration fields...")
        
        # Add phone_number to patients table
        try:
            cursor.execute("""
                ALTER TABLE patients 
                ADD COLUMN phone_number VARCHAR(20) AFTER gender
            """)
            print("   ✅ Added 'phone_number' to patients table")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("   ℹ️  'phone_number' already exists in patients table")
            else:
                raise
        
        # Add report_content to reports table
        try:
            cursor.execute("""
                ALTER TABLE reports 
                ADD COLUMN report_content TEXT
            """)
            print("   ✅ Added 'report_content' to reports table")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("   ℹ️  'report_content' already exists in reports table")
            else:
                raise
        
        # Add sent_via_whatsapp to reports table
        try:
            cursor.execute("""
                ALTER TABLE reports 
                ADD COLUMN sent_via_whatsapp BOOLEAN DEFAULT FALSE
            """)
            print("   ✅ Added 'sent_via_whatsapp' to reports table")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("   ℹ️  'sent_via_whatsapp' already exists in reports table")
            else:
                raise
        
        # Create whatsapp_chats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS whatsapp_chats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phone_number VARCHAR(20),
                patient_id INT,
                message_from VARCHAR(10),
                message_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)
        print("   ✅ Created 'whatsapp_chats' table")
        
        conn.commit()
        
        # Verify schema
        print("\n📋 Final Schema Verification:")
        cursor.execute("DESCRIBE patients")
        print("\n   Patients table columns:")
        for col in cursor.fetchall():
            print(f"      - {col[0]} ({col[1]})")
        
        cursor.execute("DESCRIBE reports")
        print("\n   Reports table columns:")
        for col in cursor.fetchall():
            print(f"      - {col[0]} ({col[1]})")
        
        cursor.execute("DESCRIBE whatsapp_chats")
        print("\n   WhatsApp Chats table columns:")
        for col in cursor.fetchall():
            print(f"      - {col[0]} ({col[1]})")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*70)
        print("✅ DATABASE SCHEMA UPDATE COMPLETE!")
        print("="*70)
        print("\nYour database is now ready for WhatsApp integration!")
        print("\n📋 Next steps:")
        print("   1. Webhook server is already running (keep it running)")
        print("   2. Download ngrok: https://ngrok.com/download")
        print("   3. Run: ngrok http 5000")
        print("   4. Configure Twilio webhook with ngrok URL")
        print("   5. Test by sending WhatsApp message!")
        
        return True
        
    except mysql.connector.Error as e:
        print(f"\n❌ MySQL Error: {e}")
        print("\n🔍 Troubleshooting:")
        print("   1. Check if MySQL server is running")
        print("   2. Verify password in .env file")
        print("   3. Ensure database 'medical_ner' exists")
        print("   4. Check MySQL user permissions")
        return False
    
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    try:
        setup_database()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
