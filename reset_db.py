from backend.database import engine
from backend.models import Base, Patient, Scan, Report, PatientDocument

def reset_database():
    print("Resetting database...")
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped.")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("All tables recreated with new schema.")

if __name__ == "__main__":
    reset_database()
