# 🚀 Quick Start Guide - Radiologist's Copilot Database

## ⚡ One-Click Setup (Recommended)

### Windows PowerShell
```powershell
# Navigate to project directory
cd C:\College_projects\MumbaiHacks\Radiologist-Copilot-MH

# Run automated setup script
.\setup.ps1
```

**Done! Everything is configured automatically.**

---

## 🛠️ Manual Setup (Alternative)

### Step 1: Start Docker Desktop
**Important:** Make sure Docker Desktop is running before proceeding.

### Step 2: Install Python Dependencies
```powershell
pip install sqlalchemy psycopg2-binary pgvector pydantic
```

### Step 3: Start Database Containers
```powershell
docker-compose up -d
```

### Step 4: Initialize Database
```powershell
# Wait 10 seconds for PostgreSQL to start, then run:
python init_db.py
```

---

## 🎯 Access Your Database

### pgAdmin Web Interface
- **URL:** http://localhost:5050
- **Email:** admin@admin.com
- **Password:** admin

### Database Credentials
- **Host:** localhost
- **Port:** 5432
- **Database:** radiology_db
- **Username:** admin
- **Password:** radpass

---

## ✅ Verify Installation

### Python Query
```python
from backend.database import get_db_session
from backend.models import Patient

db = get_db_session()
patient = db.query(Patient).first()
print(f"✅ Found patient: {patient.name}")
db.close()
```

### SQL Query
```powershell
docker exec -it radiology_postgres psql -U admin -d radiology_db -c "SELECT * FROM patients;"
```

---

## 🔄 Common Commands

### Restart Containers
```powershell
docker-compose restart
```

### Stop Containers
```powershell
docker-compose down
```

### View Logs
```powershell
docker-compose logs db
```

### Reset Database (Fresh Start)
```powershell
docker-compose down -v
docker-compose up -d
python init_db.py
```

---

## 📊 What's Included

### Database Tables
1. **patients** - Patient demographics (id, mrn, name, age, gender)
2. **scans** - Medical imaging metadata (file paths, body parts, views)
3. **reports** - Radiology reports (text, NER tags, vector embeddings)

### Sample Data
- ✅ 1 Patient: Yash M. Patel (21M, MRN555)
- ✅ 1 Chest X-Ray (PA view)
- ✅ 1 Complete Report (with NER + embedding)

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"
**Fix:** Start Docker Desktop and wait for it to fully initialize.

### "Port 5432 already in use"
**Fix:** Stop existing PostgreSQL service:
```powershell
net stop postgresql-x64-14
```

### "Module pgvector not found"
**Fix:**
```powershell
pip install pgvector
```

### Database won't start
**Fix:**
```powershell
docker-compose down -v
docker-compose up -d
# Wait 15 seconds
python init_db.py
```

---

## 📚 File Structure

```
Radiologist-Copilot-MH/
├── docker-compose.yml      # Docker configuration
├── init_db.py             # Database initialization script
├── setup.ps1              # Automated setup (Windows)
├── DATABASE_SETUP.md      # Detailed documentation
├── QUICKSTART.md          # This file
└── backend/
    ├── models.py          # SQLAlchemy ORM models
    ├── database.py        # Database connection
    └── requirements.txt   # Python dependencies
```

---

## 🎓 Next Steps

1. ✅ Database is ready
2. Open pgAdmin to explore tables
3. Read `DATABASE_SETUP.md` for advanced usage
4. Start building FastAPI endpoints
5. Connect your AI agents (CheXNet, NER, etc.)

---

## 💡 Tips

- Use `docker-compose logs -f db` to monitor PostgreSQL in real-time
- pgAdmin persists settings between restarts
- Vector embeddings support semantic search (1536 dimensions for OpenAI)
- All relationships have CASCADE delete for data integrity

---

**Need help?** Check `DATABASE_SETUP.md` for detailed troubleshooting.

**Ready to code?** Your database is initialized with sample data! 🎉
