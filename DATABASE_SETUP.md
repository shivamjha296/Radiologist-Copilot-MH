# 🚀 One-Click Database Setup Guide

## Overview
This guide sets up a production-ready PostgreSQL database with pgvector extension for the Radiologist's Copilot project.

## 📦 What Gets Created

### Database Infrastructure
- **PostgreSQL 16** with pgvector extension (for AI embeddings)
- **pgAdmin 4** web interface for database management
- **Persistent storage** using Docker volumes

### Database Schema
1. **patients** - Patient demographics (MRN, name, age, gender)
2. **scans** - Medical imaging metadata (DICOM paths, body parts, views)
3. **reports** - Radiology reports with NER tags and vector embeddings

### Sample Data
- 1 patient: Yash M. Patel (21M, MRN555)
- 1 chest X-ray scan (PA view)
- 1 complete radiology report with 5 NER entities
- 1536-dimensional vector embedding for semantic search

---

## ⚡ Quick Start (3 Commands)

### 1️⃣ Start Docker Containers
```powershell
docker-compose up -d
```
**Wait 5-10 seconds for PostgreSQL to initialize**

### 2️⃣ Install Python Dependencies
```powershell
pip install sqlalchemy psycopg2-binary pgvector pydantic
```

### 3️⃣ Initialize Database
```powershell
python init_db.py
```

**Expected Output:**
```
🔄 Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready! (Attempt 2/15)
✅ pgvector extension enabled
✅ All tables created successfully
✅ Database initialized and seeded with sample data:
   👤 Patient: Yash M. Patel (MRN: MRN555)
   🏥 Scan: CHEST X-Ray (PA view)
   📄 Report: 635 characters
   🏷️  NER Tags: 5 entities extracted
   🧠 Embedding: 1536-dimensional vector
```

---

## 🔍 Verify Installation

### Option A: Using pgAdmin (GUI)
1. Open browser: http://localhost:5050
2. Login:
   - **Email:** admin@admin.com
   - **Password:** admin
3. Add New Server:
   - **Name:** Radiology DB
   - **Host:** db (or localhost if not working, use `host.docker.internal` on Windows)
   - **Port:** 5432
   - **Database:** radiology_db
   - **Username:** admin
   - **Password:** radpass
4. Navigate to: **Servers → Radiology DB → Databases → radiology_db → Schemas → public → Tables**

### Option B: Using Python
```python
from backend.database import get_db_session
from backend.models import Patient, Scan, Report

db = get_db_session()
try:
    # Query patient
    patient = db.query(Patient).filter_by(mrn="MRN555").first()
    print(f"Patient: {patient.name}, Age: {patient.age}")
    
    # Query scan
    scan = patient.scans[0]
    print(f"Scan: {scan.body_part} - {scan.view_position}")
    
    # Query report with vector search
    report = db.query(Report).filter_by(scan_id=scan.id).first()
    print(f"Report by: {report.radiologist_name}")
    print(f"NER Entities: {len(report.ner_tags)}")
    print(f"Embedding dimensions: {len(report.embedding)}")
finally:
    db.close()
```

### Option C: Direct SQL Query
```powershell
docker exec -it radiology_postgres psql -U admin -d radiology_db -c "SELECT p.name, s.body_part, r.radiologist_name FROM patients p JOIN scans s ON p.id = s.patient_id JOIN reports r ON s.id = r.scan_id;"
```

---

## 📊 Database Schema Details

### Table: `patients`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment primary key |
| mrn | VARCHAR(50) | Medical Record Number (unique) |
| name | VARCHAR(200) | Patient full name |
| age | INTEGER | Age in years |
| gender | VARCHAR(20) | Male/Female/Other |
| created_at | TIMESTAMP | Record creation time |

### Table: `scans`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment primary key |
| patient_id | INTEGER (FK) | Links to patients.id |
| file_path | VARCHAR(500) | Path to DICOM/image file |
| body_part | VARCHAR(100) | CHEST, ABDOMEN, HEAD, etc. |
| view_position | VARCHAR(50) | PA, AP, LATERAL, etc. |
| modality | VARCHAR(10) | DX (Digital Radiography) |
| scan_date | TIMESTAMP | When scan was performed |

### Table: `reports`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment primary key |
| scan_id | INTEGER (FK) | Links to scans.id |
| radiologist_name | VARCHAR(200) | Reporting radiologist |
| full_text | TEXT | Complete radiology report |
| impression | TEXT | Summary/conclusion |
| ner_tags | JSONB | Medical entities (anatomy, findings) |
| embedding | VECTOR(1536) | OpenAI embedding for semantic search |

---

## 🛠️ Troubleshooting

### Issue: "Could not connect to database"
**Solution:**
```powershell
# Check if containers are running
docker ps

# Restart containers
docker-compose down
docker-compose up -d

# Wait 10 seconds, then retry
python init_db.py
```

### Issue: "Port 5432 already in use"
**Solution:** Another PostgreSQL instance is running
```powershell
# Option 1: Stop existing PostgreSQL
net stop postgresql-x64-14  # Adjust version number

# Option 2: Change port in docker-compose.yml
# Replace "5432:5432" with "5433:5432"
```

### Issue: pgAdmin connection refused
**Solution:** Use `host.docker.internal` instead of `localhost` when adding server in pgAdmin

### Issue: "Module 'pgvector' not found"
**Solution:**
```powershell
pip install pgvector
```

---

## 🧹 Clean Up / Reset Database

### Reset Everything (Fresh Start)
```powershell
# Stop and remove containers + volumes
docker-compose down -v

# Restart
docker-compose up -d

# Re-initialize
python init_db.py
```

### Clear Sample Data Only
```python
from backend.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("TRUNCATE TABLE reports, scans, patients RESTART IDENTITY CASCADE;"))
    conn.commit()
    print("✅ All data cleared")
```

---

## 🔐 Security Notes

⚠️ **Default credentials are for DEVELOPMENT ONLY**

For production:
1. Change passwords in `docker-compose.yml`
2. Update `backend/database.py` connection string
3. Use environment variables:
```python
import os
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:radpass@localhost:5432/radiology_db")
```

---

## 🎯 Next Steps

1. ✅ Database is ready
2. **Build FastAPI endpoints** (`backend/routers/`)
3. **Connect CheXNet model** for X-ray analysis
4. **Implement vector search** for report similarity
5. **Add more sample patients** from `Reports/` folder

---

## 📚 Additional Resources

- **pgvector docs:** https://github.com/pgvector/pgvector
- **SQLAlchemy 2.0:** https://docs.sqlalchemy.org/en/20/
- **Pydantic V2:** https://docs.pydantic.dev/2.0/
- **Docker Compose:** https://docs.docker.com/compose/

---

## 🤝 Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs db`
2. Verify Python version: `python --version` (requires 3.9+)
3. Ensure Docker Desktop is running

**Database is now ready for your AI agent development! 🎉**
