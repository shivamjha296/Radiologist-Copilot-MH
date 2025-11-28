"""
FastAPI Backend for Radiologist's Copilot
Remote File Storage with Cloudinary Integration
"""
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from dotenv import load_dotenv

# Import database and models
from database import get_db, engine
from models import Base, Patient, Scan, PatientDocument, Report
from storage import upload_to_cloud, delete_from_cloud, get_cloudinary_status

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Radiologist's Copilot API",
    description="AI-powered medical imaging analysis with remote file storage",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Health Check Endpoints
# ============================================

@app.get("/")
async def root():
    """Root endpoint - API status"""
    return {
        "message": "Radiologist's Copilot API",
        "status": "online",
        "version": "2.0.0",
        "features": ["X-ray Analysis", "PDF Reports", "Cloudinary Storage"]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    cloudinary_status = get_cloudinary_status()
    return {
        "status": "healthy",
        "database": "connected",
        "cloudinary": "configured" if cloudinary_status["configured"] else "not configured"
    }


# ============================================
# Patient Management Endpoints
# ============================================

@app.post("/patients", response_model=dict)
async def create_patient(
    mrn: str = Form(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Create a new patient record.
    
    Args:
        mrn: Medical Record Number (unique)
        name: Patient full name
        age: Patient age
        gender: Patient gender
    
    Returns:
        dict: Created patient data
    """
    # Check if MRN already exists
    existing = db.query(Patient).filter(Patient.mrn == mrn).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Patient with MRN {mrn} already exists")
    
    # Create new patient
    patient = Patient(mrn=mrn, name=name, age=age, gender=gender)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "mrn": patient.mrn,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "created_at": patient.created_at.isoformat()
    }


@app.get("/patients", response_model=List[dict])
async def get_all_patients(db: Session = Depends(get_db)):
    """
    Retrieve all patients with their scan and document counts.
    
    Returns:
        List[dict]: List of all patients
    """
    patients = db.query(Patient).all()
    
    result = []
    for patient in patients:
        result.append({
            "id": patient.id,
            "mrn": patient.mrn,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "created_at": patient.created_at.isoformat(),
            "scans_count": len(patient.scans),
            "documents_count": len(patient.documents)
        })
    
    return result


@app.get("/patients/{patient_id}", response_model=dict)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific patient with all scans and documents.
    
    Args:
        patient_id: Patient ID
    
    Returns:
        dict: Patient data with scans and documents
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    return {
        "id": patient.id,
        "mrn": patient.mrn,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "created_at": patient.created_at.isoformat(),
        "scans": [
            {
                "id": scan.id,
                "file_url": scan.file_url,
                "body_part": scan.body_part,
                "view_position": scan.view_position,
                "modality": scan.modality,
                "scan_date": scan.scan_date.isoformat()
            }
            for scan in patient.scans
        ],
        "documents": [
            {
                "id": doc.id,
                "document_name": doc.document_name,
                "document_type": doc.document_type,
                "file_url": doc.file_url,
                "uploaded_at": doc.uploaded_at.isoformat()
            }
            for doc in patient.documents
        ]
    }


# ============================================
# X-ray Scan Upload Endpoint (Cloudinary)
# ============================================

@app.post("/patients/{patient_id}/upload/scan", response_model=dict)
async def upload_scan(
    patient_id: int,
    file: UploadFile = File(..., description="X-ray image file (PNG, JPG, DICOM)"),
    body_part: str = Form(..., description="Body part scanned (e.g., CHEST, ABDOMEN)"),
    view_position: str = Form(default="PA", description="View position (e.g., PA, AP, LATERAL)"),
    modality: str = Form(default="DX", description="Modality (default: DX - Digital Radiography)"),
    db: Session = Depends(get_db)
):
    """
    Upload X-ray scan to Cloudinary and link to patient.
    
    Args:
        patient_id: Patient ID
        file: X-ray image file (UploadFile)
        body_part: Body part scanned (CHEST, ABDOMEN, HEAD, etc.)
        view_position: View position (PA, AP, LATERAL, etc.)
        modality: Imaging modality (DX, CT, MRI, etc.)
    
    Returns:
        dict: Created scan record with Cloudinary URL
    
    Example:
        POST /patients/1/upload/scan
        Form-data:
            file: chest_xray.jpg
            body_part: CHEST
            view_position: PA
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    # Validate file type
    allowed_extensions = ["png", "jpg", "jpeg", "dcm", "dicom"]
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Upload to Cloudinary (xrays folder, image resource type)
        file_url = upload_to_cloud(file, folder="xrays", resource_type="image")
        
        # Create scan record in database
        scan = Scan(
            patient_id=patient_id,
            file_url=file_url,
            body_part=body_part.upper(),
            view_position=view_position.upper(),
            modality=modality.upper()
        )
        
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        return {
            "message": "X-ray scan uploaded successfully",
            "scan": {
                "id": scan.id,
                "patient_id": scan.patient_id,
                "file_url": scan.file_url,
                "body_part": scan.body_part,
                "view_position": scan.view_position,
                "modality": scan.modality,
                "scan_date": scan.scan_date.isoformat()
            },
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "mrn": patient.mrn
            }
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ============================================
# PDF Document Upload Endpoint (Cloudinary)
# ============================================

@app.post("/patients/{patient_id}/upload/document", response_model=dict)
async def upload_document(
    patient_id: int,
    file: UploadFile = File(..., description="PDF document file"),
    document_name: str = Form(..., description="Document name (e.g., 'Blood Work 2023')"),
    document_type: str = Form(default="PDF", description="Document type (PDF, LAB, REPORT, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Upload PDF document to Cloudinary and link to patient.
    
    Args:
        patient_id: Patient ID
        file: PDF document file (UploadFile)
        document_name: Descriptive name for the document
        document_type: Type of document (PDF, LAB, REPORT, etc.)
    
    Returns:
        dict: Created document record with Cloudinary URL
    
    Example:
        POST /patients/1/upload/document
        Form-data:
            file: blood_work_2023.pdf
            document_name: Blood Work 2023
            document_type: LAB
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    # Validate file type (PDFs only for now)
    allowed_extensions = ["pdf"]
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Upload to Cloudinary (reports folder, raw resource type for PDFs)
        file_url = upload_to_cloud(file, folder="reports", resource_type="raw")
        
        # Create document record in database
        document = PatientDocument(
            patient_id=patient_id,
            document_name=document_name,
            document_type=document_type.upper(),
            file_url=file_url
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {
            "message": "Document uploaded successfully",
            "document": {
                "id": document.id,
                "patient_id": document.patient_id,
                "document_name": document.document_name,
                "document_type": document.document_type,
                "file_url": document.file_url,
                "uploaded_at": document.uploaded_at.isoformat()
            },
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "mrn": patient.mrn
            }
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ============================================
# Delete Endpoints
# ============================================

@app.delete("/scans/{scan_id}")
async def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    """
    Delete a scan record and its file from Cloudinary.
    
    Args:
        scan_id: Scan ID
    
    Returns:
        dict: Deletion confirmation
    """
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    
    # Delete from Cloudinary
    delete_from_cloud(scan.file_url, resource_type="image")
    
    # Delete from database
    db.delete(scan)
    db.commit()
    
    return {"message": f"Scan {scan_id} deleted successfully"}


@app.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """
    Delete a document record and its file from Cloudinary.
    
    Args:
        document_id: Document ID
    
    Returns:
        dict: Deletion confirmation
    """
    document = db.query(PatientDocument).filter(PatientDocument.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
    
    # Delete from Cloudinary
    delete_from_cloud(document.file_url, resource_type="raw")
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": f"Document {document_id} deleted successfully"}


# ============================================
# Run the application
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
