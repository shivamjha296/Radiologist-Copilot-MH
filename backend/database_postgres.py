"""
PostgreSQL Database Module for WhatsApp Integration
Uses SQLAlchemy and the existing database session
"""
import os
from dotenv import load_dotenv
from database import get_db, engine
from models import Patient, Scan, Report, Base
from sqlalchemy import text, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

load_dotenv()


class WhatsAppChat(Base):
    """WhatsApp chat history table"""
    __tablename__ = "whatsapp_chats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(20))
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    message_from = Column(String(10))  # 'patient' or 'ai'
    message_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<WhatsAppChat(id={self.id}, from={self.message_from})>"


def init_whatsapp_tables():
    """Create WhatsApp-specific tables in PostgreSQL."""
    try:
        # Add phone_number column to patients table if it doesn't exist
        with engine.connect() as conn:
            # Check if phone_number column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='patients' AND column_name='phone_number'
            """))
            
            if not result.fetchone():
                conn.execute(text("""
                    ALTER TABLE patients 
                    ADD COLUMN phone_number VARCHAR(20)
                """))
                conn.commit()
                print("✅ Added phone_number column to patients table")
        
        # Create whatsapp_chats table
        Base.metadata.create_all(engine, tables=[WhatsAppChat.__table__])
        print("✅ WhatsApp chat history table ready")
        
        return True
    except Exception as e:
        print(f"❌ Error initializing WhatsApp tables: {e}")
        return False


def get_patient_by_phone(phone_number):
    """Get patient information by phone number from PostgreSQL."""
    try:
        db = next(get_db())
        
        # Query patient with their most recent scan and report
        patient = db.query(Patient).filter(
            Patient.phone_number == phone_number
        ).first()
        
        if not patient:
            return None
        
        # Get most recent scan and report
        scan = db.query(Scan).filter(
            Scan.patient_id == patient.id
        ).order_by(Scan.scan_date.desc()).first()
        
        report = None
        if scan:
            report = db.query(Report).filter(
                Report.scan_id == scan.id
            ).order_by(Report.id.desc()).first()
        
        # Format data for WhatsApp service
        result = {
            'id': patient.id,
            'name': patient.name,
            'age': patient.age,
            'gender': patient.gender,
            'phone_number': patient.phone_number,
            'report_content': report.full_text if report else '',
            'report_id': report.id if report else None
        }
        
        db.close()
        return result
        
    except Exception as e:
        print(f'Error fetching patient: {e}')
        return None


def get_report_by_id(report_id):
    """Get report details by report ID from PostgreSQL."""
    try:
        db = next(get_db())
        
        report = db.query(Report).filter(Report.id == report_id).first()
        
        if not report:
            return None
        
        scan = db.query(Scan).filter(Scan.id == report.scan_id).first()
        patient = db.query(Patient).filter(Patient.id == scan.patient_id).first() if scan else None
        
        result = {
            'id': report.id,
            'name': patient.name if patient else 'Unknown',
            'age': patient.age if patient else 0,
            'gender': patient.gender if patient else 'Unknown',
            'phone_number': patient.phone_number if patient else None,
            'report_content': report.full_text,
            'filename': f"{scan.body_part}_{scan.view_position}" if scan else "Report",
            'impression': report.impression
        }
        
        db.close()
        return result
        
    except Exception as e:
        print(f'Error fetching report: {e}')
        return None


def mark_report_sent_whatsapp(report_id):
    """Mark a report as sent via WhatsApp (add metadata if needed)."""
    try:
        db = next(get_db())
        
        # You could add a sent_via_whatsapp column or just log it
        # For now, we'll just return success
        # If you want to track it, add a column to Report model
        
        db.close()
        return True
    except Exception as e:
        print(f'Error marking report as sent: {e}')
        return False


def save_chat_message(phone_number, patient_id, message_from, message_text):
    """Save a chat message to PostgreSQL."""
    try:
        db = next(get_db())
        
        chat = WhatsAppChat(
            phone_number=phone_number,
            patient_id=patient_id,
            message_from=message_from,
            message_text=message_text
        )
        
        db.add(chat)
        db.commit()
        db.close()
        
        return True
    except Exception as e:
        print(f'Error saving chat message: {e}')
        return False


def get_chat_history(phone_number, limit=10):
    """Get recent chat history for a phone number from PostgreSQL."""
    try:
        db = next(get_db())
        
        chats = db.query(WhatsAppChat).filter(
            WhatsAppChat.phone_number == phone_number
        ).order_by(WhatsAppChat.created_at.desc()).limit(limit).all()
        
        results = [
            {
                'message_from': chat.message_from,
                'message_text': chat.message_text,
                'created_at': chat.created_at
            }
            for chat in reversed(chats)
        ]
        
        db.close()
        return results
        
    except Exception as e:
        print(f'Error fetching chat history: {e}')
        return []


def store_patient_with_report(patient_name, age, gender, report_text, phone_number=None):
    """
    Store patient and report data to PostgreSQL database.
    
    Args:
        patient_name: Name of the patient
        age: Patient age
        gender: Patient gender
        report_text: Full medical report text
        phone_number: Optional phone number for WhatsApp
        
    Returns:
        tuple: (patient_id, report_id)
    """
    try:
        db = next(get_db())
        
        # Generate unique MRN
        mrn = f"MRN{datetime.utcnow().timestamp()}"
        
        # Create patient
        patient = Patient(
            mrn=mrn,
            name=patient_name,
            age=age,
            gender=gender,
            phone_number=phone_number
        )
        db.add(patient)
        db.flush()  # Get patient ID
        
        # Create scan
        scan = Scan(
            patient_id=patient.id,
            file_path="whatsapp_report",
            body_part="GENERAL",
            view_position="PA",
            modality="DX"
        )
        db.add(scan)
        db.flush()  # Get scan ID
        
        # Create report
        report = Report(
            scan_id=scan.id,
            radiologist_name="WhatsApp Bot",
            full_text=report_text,
            impression=report_text[:500]  # First 500 chars as impression
        )
        db.add(report)
        db.commit()
        
        patient_id = patient.id
        report_id = report.id
        
        db.close()
        
        return (patient_id, report_id)
        
    except Exception as e:
        print(f'Error storing to PostgreSQL: {e}')
        return (None, None)


if __name__ == "__main__":
    print("PostgreSQL WhatsApp Database Module")
    print("=" * 50)
    try:
        # Initialize tables
        init_whatsapp_tables()
        
        # Test connection
        db = next(get_db())
        print("✅ PostgreSQL Connection successful!")
        db.close()
        
        print("\nDatabase ready for WhatsApp integration!")
        
    except Exception as e:
        print(f"❌ PostgreSQL Connection failed: {e}")
        print("\nMake sure:")
        print("1. DATABASE_URL is set in .env file")
        print("2. PostgreSQL server is accessible")
        print("3. Database 'radiology_db' exists")
