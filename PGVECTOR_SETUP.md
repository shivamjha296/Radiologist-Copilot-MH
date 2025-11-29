# pgvector Integration Guide

## ✅ What's Enabled

Your PostgreSQL database now supports:
- **Vector embeddings** (1536 dimensions) for semantic search
- **JSONB** for efficient NER tag storage and querying
- **Fast similarity search** with IVFFlat indexing

## 📋 Files Updated

### 1. `backend/models.py`
**Changes:**
- ✅ Enabled `from pgvector.sqlalchemy import Vector`
- ✅ Added `from sqlalchemy.dialects.postgresql import JSONB`
- ✅ Changed `ner_tags` from `JSON` → `JSONB`
- ✅ Uncommented `embedding: Vector(1536)` column

**Report Model:**
```python
class Report(Base):
    # ... other fields ...
    ner_tags: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(1536), nullable=True)
```

### 2. `backend/database.py`
**Changes:**
- ✅ Added `init_db()` function to enable vector extension
- ✅ Fixed Render URL format (`postgres://` → `postgresql://`)
- ✅ Auto-creates tables and enables extension on startup

**New Function:**
```python
def init_db():
    """Initialize database with pgvector extension"""
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    Base.metadata.create_all(bind=engine)
```

### 3. `backend/requirements.txt`
**Status:** ✅ Already contains `pgvector>=0.2.4` (no changes needed)

## 🚀 Quick Start

### Step 1: Run Migration Script
```powershell
cd c:\College_projects\MumbaiHacks\Radiologist-Copilot-MH
python backend/migrate_pgvector.py
```

This will:
- Verify pgvector extension is enabled
- Convert existing `ner_tags` JSON → JSONB
- Add `embedding` vector(1536) column
- Create performance indexes (IVFFlat + GIN)

### Step 2: Update Your Backend Startup
Add `init_db()` call to your FastAPI app:

**In `backend/main.py` (or wherever you start the app):**
```python
from database import init_db

@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    init_db()
    print("✅ Database initialized with pgvector support")
```

### Step 3: Restart Backend Server
```powershell
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## 💡 Usage Examples

### Storing Vector Embeddings
```python
from sqlalchemy.orm import Session
from models import Report

def save_report_with_embedding(db: Session, scan_id: int, text: str, embedding: list[float]):
    """Save report with 1536-dimensional embedding"""
    report = Report(
        scan_id=scan_id,
        radiologist_name="Dr. AI Assistant",
        full_text=text,
        impression="...",
        ner_tags={"diseases": ["pneumonia"], "anatomy": ["lung"]},  # JSONB
        embedding=embedding  # 1536-dimensional vector
    )
    db.add(report)
    db.commit()
    return report
```

### Semantic Similarity Search
```python
from sqlalchemy import select, func
from models import Report

def find_similar_reports(db: Session, query_embedding: list[float], limit: int = 5):
    """Find reports with similar embeddings using cosine similarity"""
    stmt = (
        select(Report)
        .order_by(Report.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()
```

### Querying JSONB NER Tags
```python
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import JSONB

def find_reports_with_disease(db: Session, disease: str):
    """Query reports by NER tags (efficient JSONB search)"""
    stmt = (
        select(Report)
        .where(Report.ner_tags['diseases'].astext.contains(disease))
    )
    return db.execute(stmt).scalars().all()
```

## 🔍 Verify Installation

### Check Extension Status
```python
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM pg_extension WHERE extname = 'vector';"))
    print(result.fetchone())  # Should show vector extension
```

### Check Column Types
```python
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reports' 
        AND column_name IN ('ner_tags', 'embedding');
    """))
    for row in result:
        print(f"{row[0]}: {row[1]}")
    # Should show: ner_tags: jsonb, embedding: USER-DEFINED (vector)
```

## 📊 Performance Features

### IVFFlat Index (Vector Similarity)
- **Purpose:** Fast approximate nearest neighbor search
- **Index:** `idx_reports_embedding` on `embedding` column
- **Algorithm:** IVFFlat with 100 lists
- **Distance:** Cosine similarity (`vector_cosine_ops`)

### GIN Index (JSONB Queries)
- **Purpose:** Efficient JSONB containment queries
- **Index:** `idx_reports_ner_tags` on `ner_tags` column
- **Use Cases:** Search by disease, anatomy, findings in NER tags

## 🛠️ Troubleshooting

### Issue: "extension vector does not exist"
**Solution:** Run migration script to enable extension:
```powershell
python backend/migrate_pgvector.py
```

### Issue: "column embedding does not exist"
**Solution:** Migration script will add the column automatically

### Issue: Import error "No module named pgvector"
**Solution:** Install dependencies:
```powershell
pip install -r backend/requirements.txt
```

### Issue: "operator does not exist: vector <=> vector"
**Solution:** pgvector extension not enabled - run migration script

## 📚 Additional Resources

- **pgvector GitHub:** https://github.com/pgvector/pgvector
- **SQLAlchemy pgvector:** https://github.com/pgvector/pgvector-python
- **Vector Index Types:** IVFFlat (fast, approximate) vs HNSW (slower, accurate)
- **Distance Metrics:** Cosine, L2 (Euclidean), Inner Product

## ⚡ Next Steps

1. ✅ Run migration: `python backend/migrate_pgvector.py`
2. ✅ Add `init_db()` to backend startup
3. ✅ Restart backend server
4. 🔄 Generate embeddings for existing reports (optional)
5. 🔄 Implement semantic search endpoints

---
**Status:** Ready to use 1536-dimensional vector embeddings for semantic similarity search! 🎉
