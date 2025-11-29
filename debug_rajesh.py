from backend.database import get_db_session
from backend.models import Patient, Scan, Report
from sqlalchemy.orm import joinedload

def debug_rajesh():
    db = get_db_session()
    try:
        # Fetch Rajesh Kumar
        # Note: Name might be case sensitive or partial, let's search
        patient = db.query(Patient).filter(Patient.name.ilike("%Rajesh Kumar%")).first()
        
        if not patient:
            print("Patient Rajesh Kumar not found!")
            return

        print(f"Patient: {patient.name} (ID: {patient.mrn})")
        
        # Reload with scans
        patient = db.query(Patient).filter(Patient.id == patient.id).options(joinedload(Patient.scans)).first()
        
        print(f"Scans count: {len(patient.scans)}")
        
        if patient.scans:
            sorted_scans = sorted(patient.scans, key=lambda s: s.scan_date, reverse=True)
            
            with open("debug_output.txt", "w") as f:
                f.write("All Scans (Newest First):\n")
                for s in sorted_scans:
                    r = db.query(Report).filter(Report.scan_id == s.id).first()
                    status = f"Report {r.id} ({r.status})" if r else "NO REPORT"
                    f.write(f"Scan {s.id} | {s.scan_date} | {status}\n")
            print("Output written to debug_output.txt")
                
        else:
            print("No scans found for patient.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_rajesh()
