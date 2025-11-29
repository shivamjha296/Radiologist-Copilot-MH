from backend.database import get_db_session
from backend.models import Patient
import uuid

def seed_database():
    db = get_db_session()
    try:
        print("Seeding database with test patients...")
        
        # Check if patients already exist
        if db.query(Patient).count() > 0:
            print("Patients already exist. Skipping seed.")
            return

        patients = [
            {
                "name": "Rajesh Kumar",
                "age": 45,
                "gender": "Male",
                "mrn": "NSSH.1001"
            },
            {
                "name": "Priya Sharma",
                "age": 32,
                "gender": "Female",
                "mrn": "NSSH.1002"
            },
            {
                "name": "Amit Patel",
                "age": 58,
                "gender": "Male",
                "mrn": "NSSH.1003"
            }
        ]

        for p_data in patients:
            patient = Patient(
                mrn=p_data["mrn"],
                name=p_data["name"],
                age=p_data["age"],
                gender=p_data["gender"]
            )
            db.add(patient)
            print(f"Added patient: {patient.name}")

        db.flush() # Flush to get patient IDs

        # Add a sample scan and report for the first patient
        from backend.models import Scan, Report
        from datetime import datetime

        patient = db.query(Patient).first()
        if patient:
            scan = Scan(
                patient_id=patient.id,
                file_url="/api/placeholder/800/800", # Placeholder or a real sample if available
                body_part="CHEST",
                modality="DX",
                scan_date=datetime.now()
            )
            db.add(scan)
            db.flush()

            report = Report(
                scan_id=scan.id,
                radiologist_name="Dr. Anjali Desai",
                full_text="**Findings:**\nThe lungs are clear. No pleural effusion or pneumothorax is seen. The heart size is normal. The mediastinal contours are unremarkable. The bony thorax is intact.\n\n**Impression:**\nNormal chest X-ray.",
                impression="Normal chest X-ray.",
                patient_history="45-year-old male with cough.",
                comparison_findings="No previous studies available for comparison.",
                status="Draft"
            )
            db.add(report)
            print(f"Added sample report for patient: {patient.name}")

        # Add a scan WITHOUT report for the second patient (Priya)
        patient2 = db.query(Patient).filter(Patient.name == "Priya Sharma").first()
        if patient2:
            scan2 = Scan(
                patient_id=patient2.id,
                file_url="/api/placeholder/800/800",
                body_part="CHEST",
                modality="DX",
                scan_date=datetime.now()
            )
            db.add(scan2)
            print(f"Added sample scan (no report) for patient: {patient2.name}")

        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
