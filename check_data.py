from backend.database import get_db_session
from backend.models import Patient, Report, Scan

def check_data():
    db = get_db_session()
    try:
        patient_count = db.query(Patient).count()
        scan_count = db.query(Scan).count()
        report_count = db.query(Report).count()
        
        print(f"Patients: {patient_count}")
        print(f"Scans: {scan_count}")
        print(f"Reports: {report_count}")
        
        if patient_count > 0:
            p = db.query(Patient).first()
            print(f"Sample Patient: {p.name} ({p.mrn})")
            
    except Exception as e:
        print(f"Error checking data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
