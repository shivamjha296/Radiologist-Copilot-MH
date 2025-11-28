# 🌥️ Cloudinary Integration Guide

## Overview

This update adds **Remote File Storage** using Cloudinary to the Radiologist's Copilot backend. All X-ray images and PDF documents are now stored in the cloud and accessible via HTTPS URLs.

---

## 📋 What Changed?

### 1. **Database Schema Updates**

#### Modified `Scan` Model:
- **Before**: `file_path` (local file system path)
- **After**: `file_url` (Cloudinary HTTPS URL)

#### New `PatientDocument` Model:
```python
PatientDocument:
  - id (PK)
  - patient_id (FK -> patients.id)
  - document_name (e.g., "Blood Work 2023")
  - document_type (e.g., "PDF", "LAB")
  - file_url (Cloudinary HTTPS URL)
  - uploaded_at (Timestamp)
```

### 2. **New Backend Files**

| File | Purpose |
|------|---------|
| `backend/storage.py` | Cloudinary upload/delete service |
| `backend/main.py` | FastAPI endpoints for file uploads |
| `backend/migrate_cloudinary.py` | Database migration script |

### 3. **New API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/patients/{id}/upload/scan` | Upload X-ray to Cloudinary |
| `POST` | `/patients/{id}/upload/document` | Upload PDF to Cloudinary |
| `DELETE` | `/scans/{id}` | Delete scan + Cloudinary file |
| `DELETE` | `/documents/{id}` | Delete document + Cloudinary file |

---

## 🚀 Setup Instructions

### Step 1: Create Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Account Details
3. Copy these credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Step 3: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New packages added:
- `cloudinary>=1.36.0`
- `python-multipart>=0.0.6`

### Step 4: Run Database Migration

```bash
cd backend
python migrate_cloudinary.py
```

This will:
- Rename `scans.file_path` → `scans.file_url`
- Create `patient_documents` table
- Add performance indexes

**Rollback (if needed):**
```bash
python migrate_cloudinary.py rollback
```

### Step 5: Start Backend Server

```bash
cd backend
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📡 API Usage Examples

### 1. Upload X-ray Scan

**Request:**
```bash
curl -X POST "http://localhost:8000/patients/1/upload/scan" \
  -F "file=@chest_xray.jpg" \
  -F "body_part=CHEST" \
  -F "view_position=PA"
```

**Response:**
```json
{
  "message": "X-ray scan uploaded successfully",
  "scan": {
    "id": 5,
    "patient_id": 1,
    "file_url": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/xrays/chest_xray.jpg",
    "body_part": "CHEST",
    "view_position": "PA",
    "modality": "DX",
    "scan_date": "2025-11-29T10:30:00"
  },
  "patient": {
    "id": 1,
    "name": "John Doe",
    "mrn": "MRN001"
  }
}
```

### 2. Upload PDF Document

**Request:**
```bash
curl -X POST "http://localhost:8000/patients/1/upload/document" \
  -F "file=@blood_test_2023.pdf" \
  -F "document_name=Blood Work 2023" \
  -F "document_type=LAB"
```

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": 3,
    "patient_id": 1,
    "document_name": "Blood Work 2023",
    "document_type": "LAB",
    "file_url": "https://res.cloudinary.com/your_cloud/raw/upload/v1234567890/reports/blood_test_2023.pdf",
    "uploaded_at": "2025-11-29T10:35:00"
  },
  "patient": {
    "id": 1,
    "name": "John Doe",
    "mrn": "MRN001"
  }
}
```

### 3. Get Patient with Files

**Request:**
```bash
curl -X GET "http://localhost:8000/patients/1"
```

**Response:**
```json
{
  "id": 1,
  "mrn": "MRN001",
  "name": "John Doe",
  "age": 45,
  "gender": "Male",
  "created_at": "2025-11-20T08:00:00",
  "scans": [
    {
      "id": 5,
      "file_url": "https://res.cloudinary.com/.../xrays/chest_xray.jpg",
      "body_part": "CHEST",
      "view_position": "PA",
      "modality": "DX",
      "scan_date": "2025-11-29T10:30:00"
    }
  ],
  "documents": [
    {
      "id": 3,
      "document_name": "Blood Work 2023",
      "document_type": "LAB",
      "file_url": "https://res.cloudinary.com/.../reports/blood_test_2023.pdf",
      "uploaded_at": "2025-11-29T10:35:00"
    }
  ]
}
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ Upload File
         ↓
┌─────────────────────────────────┐
│   Backend (FastAPI)             │
│                                 │
│  1. Receive UploadFile          │
│  2. Call storage.upload_to_cloud│
│  3. Get Cloudinary URL          │
│  4. Save to PostgreSQL          │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌──────────────┐
│Cloudinary│ │PostgreSQL DB │
│ Storage  │ │(file_url)    │
└─────────┘ └──────────────┘
```

---

## 🔒 Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Keep API secrets private** - Don't share Cloudinary credentials
3. **Use environment variables** - Production should use secure secret management
4. **Validate file types** - Backend only accepts allowed extensions
5. **HTTPS only** - Cloudinary URLs use secure HTTPS protocol

---

## 📊 Cloudinary Folders Structure

```
your_cloudinary_cloud/
├── xrays/          # X-ray images (resource_type: image)
│   ├── chest_xray_001.jpg
│   ├── abdomen_scan_002.png
│   └── ...
│
└── reports/        # PDF documents (resource_type: raw)
    ├── blood_work_2023.pdf
    ├── mri_report_2024.pdf
    └── ...
```

---

## 🧪 Testing

### Test Cloudinary Configuration

```bash
curl http://localhost:8000/health
```

Response should show:
```json
{
  "status": "healthy",
  "database": "connected",
  "cloudinary": "configured"
}
```

### Test File Upload (with curl)

```bash
# Upload X-ray
curl -X POST "http://localhost:8000/patients/1/upload/scan" \
  -F "file=@test_xray.jpg" \
  -F "body_part=CHEST"

# Upload PDF
curl -X POST "http://localhost:8000/patients/1/upload/document" \
  -F "file=@test_report.pdf" \
  -F "document_name=Test Report"
```

---

## 🐛 Troubleshooting

### Error: "Cloudinary credentials not configured"

**Solution:** Check your `.env` file has all three variables:
```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Error: "Patient not found"

**Solution:** Create a patient first:
```bash
curl -X POST "http://localhost:8000/patients" \
  -F "mrn=MRN001" \
  -F "name=John Doe" \
  -F "age=45" \
  -F "gender=Male"
```

### Error: "Invalid file type"

**Solution:** Check allowed extensions:
- X-rays: `png, jpg, jpeg, dcm, dicom`
- Documents: `pdf`

### Migration fails with "column already exists"

**Solution:** The migration is idempotent. If `file_url` already exists, it will skip the rename step.

---

## 🎯 Benefits

✅ **Cloud Storage** - Files accessible from anywhere  
✅ **URL-based Access** - Share links with teammates/judges  
✅ **Scalability** - Cloudinary handles CDN and optimization  
✅ **Database Integration** - URLs linked to patients  
✅ **Automatic Optimization** - Cloudinary compresses images  
✅ **Backup & Security** - Cloud-based redundancy  

---

## 📚 Additional Resources

- [Cloudinary Python SDK](https://cloudinary.com/documentation/python_integration)
- [FastAPI File Uploads](https://fastapi.tiangolo.com/tutorial/request-files/)
- [SQLAlchemy Relationships](https://docs.sqlalchemy.org/en/20/orm/relationship_api.html)

---

**Last Updated:** November 29, 2025  
**Version:** 2.0.0  
**Status:** Production Ready
