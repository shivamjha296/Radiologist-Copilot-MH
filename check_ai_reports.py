import requests
import json
from backend.database import get_db_session
from backend.models import Report, Scan, Patient

def check_ai_reports():
    db = get_db_session()
    try:
        # Check for reports by AI Agent
        reports = db.query(Report).filter(Report.radiologist_name == "AI Agent").all()
        print(f"Found {len(reports)} AI reports.")
        
        for r in reports:
            print(f"ID: {r.id}, Status: {r.status}, Scan ID: {r.scan_id}")
            if r.scan:
                print(f"  Patient: {r.scan.patient.name} ({r.scan.patient.mrn})")
            else:
                print("  No Scan linked!")
                
        # Check total reports
        total = db.query(Report).count()
        print(f"Total Reports in DB: {total}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_ai_reports()
