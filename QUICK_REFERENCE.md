# 🚀 Cloudinary Integration - Quick Reference

## Environment Setup
```bash
# .env file
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Installation
```bash
pip install -r backend/requirements.txt
python backend/migrate_cloudinary.py
python backend/main.py
```

## API Endpoints

### Upload X-ray
```bash
POST /patients/{id}/upload/scan
Form-data: file, body_part, view_position
```

### Upload PDF
```bash
POST /patients/{id}/upload/document
Form-data: file, document_name, document_type
```

### Get Patient
```bash
GET /patients/{id}
Returns: patient + scans[] + documents[]
```

## Database Schema

### Scan
- `file_url` (String) - Cloudinary HTTPS URL
- `body_part`, `view_position`, `modality`

### PatientDocument (NEW)
- `document_name`, `document_type`
- `file_url` - Cloudinary HTTPS URL

## File Organization

```
Cloudinary:
├── xrays/          (resource_type: image)
│   └── *.jpg, *.png
└── reports/        (resource_type: raw)
    └── *.pdf
```

## Testing
```bash
python backend/test_cloudinary.py
curl http://localhost:8000/health
```

## Common Commands

```bash
# Create patient
curl -X POST http://localhost:8000/patients \
  -F "mrn=MRN001" -F "name=John Doe" \
  -F "age=45" -F "gender=Male"

# Upload X-ray
curl -X POST http://localhost:8000/patients/1/upload/scan \
  -F "file=@xray.jpg" -F "body_part=CHEST"

# Upload PDF
curl -X POST http://localhost:8000/patients/1/upload/document \
  -F "file=@report.pdf" -F "document_name=Lab Results"

# Get patient with files
curl http://localhost:8000/patients/1
```

## Troubleshooting

**Cloudinary not configured:**
→ Check `.env` has all three CLOUDINARY_* variables

**Patient not found:**
→ Create patient first with POST /patients

**File upload fails:**
→ Check file type (X-ray: jpg/png/dcm, Doc: pdf)

**Database error:**
→ Run migration: `python migrate_cloudinary.py`

## Key Files
- `backend/storage.py` - Cloudinary service
- `backend/main.py` - API endpoints
- `backend/models.py` - Database models
- `backend/migrate_cloudinary.py` - Migration
- `CLOUDINARY_SETUP.md` - Full documentation
