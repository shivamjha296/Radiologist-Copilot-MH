from backend.database import get_db_session
from backend.models import Patient, Scan, Report
from sqlalchemy.orm import joinedload

def debug_get_patients():
    db = get_db_session()
    try:
        # Fetch Priya Sharma
        patient = db.query(Patient).filter(Patient.name == "Priya Sharma").options(joinedload(Patient.scans)).first()
        
        if not patient:
            print("Patient Priya Sharma not found!")
            return

        print(f"Patient: {patient.name} (ID: {patient.mrn})")
        print(f"Scans count: {len(patient.scans)}")
        
        if patient.scans:
            # Sort scans
            sorted_scans = sorted(patient.scans, key=lambda s: s.scan_date, reverse=True)
            latest_scan = sorted_scans[0]
            print(f"Latest Scan ID: {latest_scan.id}, Date: {latest_scan.scan_date}")
            
            # Check for report linked to THIS scan
            report = db.query(Report).filter(Report.scan_id == latest_scan.id).first()
            
            if report:
                print(f"Report FOUND for Latest Scan {latest_scan.id}. Report ID: {report.id}, Status: {report.status}")
            else:
                print(f"Report NOT FOUND for Latest Scan {latest_scan.id}")
                
            print("\nAll Scans:")
            for s in sorted_scans:
                r = db.query(Report).filter(Report.scan_id == s.id).first()
                status = f"Report {r.id} ({r.status})" if r else "NO Report"
                print(f"  - Scan {s.id}: {s.scan_date} -> {status}")
        else:
            print("No scans found for patient.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_get_patients()
