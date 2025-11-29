"""
MySQL Database Module for WhatsApp Integration
Separate from main PostgreSQL database to avoid conflicts
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL configuration for WhatsApp features
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'database': os.getenv('MYSQL_DATABASE', 'medical_ner')
}


def get_db_connection():
    """Create and return MySQL database connection for WhatsApp features."""
    return mysql.connector.connect(**DB_CONFIG)


def mark_report_sent_whatsapp(report_id):
    """Mark a report as sent via WhatsApp."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE reports 
            SET sent_via_whatsapp = TRUE 
            WHERE id = %s
        """, (report_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Error marking report as sent: {e}')
        return False


def get_patient_by_phone(phone_number):
    """Get patient information by phone number."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, r.report_content, r.id as report_id
            FROM patients p
            LEFT JOIN reports r ON p.id = r.patient_id
            WHERE p.phone_number = %s
            ORDER BY r.created_at DESC
            LIMIT 1
        """, (phone_number,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f'Error fetching patient: {e}')
        return None


def get_report_by_id(report_id):
    """Get report details by report ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, p.name, p.age, p.gender, p.phone_number
            FROM reports r
            JOIN patients p ON r.patient_id = p.id
            WHERE r.id = %s
        """, (report_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f'Error fetching report: {e}')
        return None


def create_chat_history_table():
    """Create table to store WhatsApp chat history."""
    conn = get_db_connection()
    cursor = conn.cursor()
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
    conn.commit()
    cursor.close()
    conn.close()


def save_chat_message(phone_number, patient_id, message_from, message_text):
    """Save a chat message to database."""
    try:
        create_chat_history_table()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO whatsapp_chats (phone_number, patient_id, message_from, message_text)
            VALUES (%s, %s, %s, %s)
        """, (phone_number, patient_id, message_from, message_text))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f'Error saving chat message: {e}')
        return False


def get_chat_history(phone_number, limit=10):
    """Get recent chat history for a phone number."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT message_from, message_text, created_at
            FROM whatsapp_chats
            WHERE phone_number = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (phone_number, limit))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return list(reversed(results))
    except Exception as e:
        print(f'Error fetching chat history: {e}')
        return []


def store_to_mysql(patient_name, age, gender, findings, phone_number=None, report_content=None):
    """
    Store patient and report data to MySQL database (for WhatsApp integration).
    
    Args:
        patient_name: Name of the patient
        age: Patient age
        gender: Patient gender
        findings: Medical findings/report
        phone_number: Optional phone number for WhatsApp
        report_content: Optional full report content
        
    Returns:
        tuple: (patient_id, report_id)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert or update patient
        if phone_number:
            cursor.execute("""
                INSERT INTO patients (name, age, gender, phone_number)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                name = VALUES(name), age = VALUES(age), gender = VALUES(gender)
            """, (patient_name, age, gender, phone_number))
        else:
            cursor.execute("""
                INSERT INTO patients (name, age, gender)
                VALUES (%s, %s, %s)
            """, (patient_name, age, gender))
        
        patient_id = cursor.lastrowid
        
        # Insert report
        cursor.execute("""
            INSERT INTO reports (patient_id, findings, report_content, sent_via_whatsapp)
            VALUES (%s, %s, %s, FALSE)
        """, (patient_id, findings, report_content))
        
        report_id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return (patient_id, report_id)
    except Exception as e:
        print(f'Error storing to MySQL: {e}')
        return (None, None)


if __name__ == "__main__":
    print("WhatsApp MySQL Database Module")
    print("=" * 50)
    try:
        conn = get_db_connection()
        print("✅ MySQL Connection successful!")
        conn.close()
    except Exception as e:
        print(f"❌ MySQL Connection failed: {e}")
        print("\nMake sure to:")
        print("1. Set MYSQL_PASSWORD in .env file")
        print("2. MySQL server is running")
        print("3. Database 'medical_ner' exists")
