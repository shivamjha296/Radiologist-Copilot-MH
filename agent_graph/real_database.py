import sys
import os
from pathlib import Path
from sqlalchemy import desc

# Imports from backend (assuming running from repo root)
try:
    from backend.database import get_db_session
    from backend.models import Patient, Scan, Report
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    raise e

def get_patient_details(patient_id: str) -> dict:
    """
    Fetch patient details from the database.
    """
    session = get_db_session()
    try:
        # Try finding by ID first (if integer), then MRN
        patient = None
        if patient_id.isdigit():
             patient = session.query(Patient).filter(Patient.id == int(patient_id)).first()
        
        if not patient:
            patient = session.query(Patient).filter(Patient.mrn == patient_id).first()

        if patient:
            return {
                "id": str(patient.id),
                "mrn": patient.mrn,
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender
            }
        else:
            # Fallback if patient doesn't exist (e.g. new upload with random ID)
            return {
                "id": patient_id,
                "name": "New Patient",
                "age": 30, # Default/Placeholder
                "gender": "Unknown"
            }
    except Exception as e:
        print(f"Error fetching patient details: {e}")
        return {
            "id": patient_id,
            "name": "Error Fetching Patient",
            "age": 0,
            "gender": "Unknown"
        }
    finally:
        session.close()

def fetch_patient_history(patient_id: str) -> str:
    """
    Fetch patient history (past reports) from the database.
    """
    session = get_db_session()
    try:
        patient = None
        if patient_id.isdigit():
             patient = session.query(Patient).filter(Patient.id == int(patient_id)).first()
        if not patient:
            patient = session.query(Patient).filter(Patient.mrn == patient_id).first()

        if not patient:
            return "No previous medical history available (New Patient)."

        # Fetch recent reports
        reports = session.query(Report).join(Scan).filter(Scan.patient_id == patient.id).order_by(desc(Scan.scan_date)).limit(3).all()
        
        if not reports:
            return "No previous reports found."
            
        history_text = ""
        for r in reports:
            date_str = r.scan.scan_date.strftime('%Y-%m-%d')
            history_text += f"Date: {date_str}\nFindings: {r.impression}\n\n"
            
        return history_text
    except Exception as e:
        print(f"Error fetching history: {e}")
        return "Error fetching history."
    finally:
        session.close()

def store_report(patient_id: str, report_text: str, scan_path: str):
    """
    Store the generated report and scan metadata.
    """
    session = get_db_session()
    try:
        # 1. Find or Create Patient
        patient = None
        if patient_id.isdigit():
             patient = session.query(Patient).filter(Patient.id == int(patient_id)).first()
        
        if not patient:
             patient = session.query(Patient).filter(Patient.mrn == patient_id).first()
             
        if not patient:
            # Create new patient
            # In a real app, we'd probably want more details, but for this flow we create a placeholder
            patient = Patient(
                mrn=patient_id[:50], 
                name="New Patient", 
                age=30, 
                gender="Unknown"
            )
            session.add(patient)
            session.flush() # Get ID
            
        # 2. Create Scan record
        scan = Scan(
            patient_id=patient.id,
            file_path=scan_path,
            body_part="CHEST", # Default
            view_position="PA", # Default
            modality="DX"
        )
        session.add(scan)
        session.flush()
        
        # 3. Create Report record
        # Extract impression if possible
        impression = "See full report."
        if "Impression" in report_text:
            parts = report_text.split("Impression")
            if len(parts) > 1:
                # Take the part after "Impression"
                impression = parts[1].split("\n\n")[0].strip(": \n")
        elif "IMPRESSION" in report_text:
             parts = report_text.split("IMPRESSION")
             if len(parts) > 1:
                impression = parts[1].split("\n\n")[0].strip(": \n")
        
        report = Report(
            scan_id=scan.id,
            radiologist_name="AI Copilot",
            full_text=report_text,
            impression=impression[:5000] # Truncate if needed
        )
        session.add(report)
        session.commit()
        print(f"Report stored successfully for patient {patient.id}")
        return True
        
    except Exception as e:
        session.rollback()
        print(f"Error storing report: {e}")
        return False
    finally:
        session.close()
