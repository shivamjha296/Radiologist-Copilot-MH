from sqlalchemy import inspect
from backend.database import engine
from backend.models import Patient, Scan, Report, PatientDocument

def inspect_database():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Found tables: {tables}")
    
    for table_name in tables:
        print(f"\nTable: {table_name}")
        columns = inspector.get_columns(table_name)
        for column in columns:
            print(f"  - {column['name']} ({column['type']})")

if __name__ == "__main__":
    inspect_database()
