import os
import shutil
import uuid
import json
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

# Import our agent graph
from agent_graph.graph import create_graph
from agent_graph.tools.feedback_tools import save_feedback_data

app = FastAPI(title="Radiologist Copilot API")

# Database imports
from backend.database import get_db
from backend.models import Patient, Scan, Report
from backend.storage import upload_to_cloud, upload_local_file
from sqlalchemy.orm import Session, joinedload
from fastapi import Depends

# Import tools for report finalization
from agent_graph.tools.pdf_tools import generate_pdf_report
from agent_graph.tools.ner_tools import NERManager, extract_ner_entities
from agent_graph.tools.llm_tools import answer_text_question

# Pydantic models for Patient
class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str = "Unknown"
    diagnosis: Optional[str] = ""
    status: str = "Active"
    assignedTo: Optional[str] = ""
    mrn: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    diagnosis: Optional[str] = None
    status: Optional[str] = None
    assignedTo: Optional[str] = None

@app.get("/api/patients")
def get_patients(db: Session = Depends(get_db)):
    # Eager load scans to check status
    patients = db.query(Patient).options(joinedload(Patient.scans)).all()
    
    result = []
    for p in patients:
        # Determine scan status
        # Determine scan status
        scan_status = "None"
        report_id = None
        if p.scans:
            # Sort scans by ID (newest first) to avoid timezone issues
            sorted_scans = sorted(p.scans, key=lambda s: s.id, reverse=True)
            
            # Find the latest scan that has a report
            found_report = False
            for scan in sorted_scans:
                report = db.query(Report).filter(Report.scan_id == scan.id).first()
                if report:
                    scan_status = "Ready"
                    report_id = report.id
                    found_report = True
                    break
            
            # If no report found but scans exist, check if the latest one is recent (Processing)
            if not found_report:
                scan_status = "Processing"

        result.append({
            "id": str(p.mrn), # Using MRN as ID for frontend
            "name": p.name,
            "age": p.age,
            "diagnosis": "Unknown", # Placeholder
            "status": "Active", # Placeholder
            "assignedTo": "Unassigned", # Placeholder
            "lastVisit": p.created_at.strftime("%b %d, %Y"),
            "scanStatus": scan_status,
            "reportId": report_id
        })
    return result

@app.post("/api/patients")
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    # Generate MRN if not provided
    mrn = patient.mrn or f"NSSH.{uuid.uuid4().int % 10000000}"
    
    db_patient = Patient(
        mrn=mrn,
        name=patient.name,
        age=patient.age,
        gender=patient.gender
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    return {
        "id": db_patient.mrn,
        "name": db_patient.name,
        "age": db_patient.age,
        "status": "Active",
        "lastVisit": db_patient.created_at.strftime("%b %d, %Y"),
        "scanStatus": "None"
    }

@app.put("/api/patients/{patient_id}")
def update_patient(patient_id: str, patient: PatientUpdate, db: Session = Depends(get_db)):
    db_patient = db.query(Patient).filter(Patient.mrn == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if patient.name:
        db_patient.name = patient.name
    if patient.age:
        db_patient.age = patient.age
        
    db.commit()
    return {"status": "success", "message": "Patient updated"}

@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    db_patient = db.query(Patient).filter(Patient.mrn == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(db_patient)
    db.commit()
    return {"status": "success", "message": "Patient deleted"}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount reports directory to serve PDFs and images
os.makedirs("reports", exist_ok=True)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

@app.get("/api/placeholder/{width}/{height}")
def get_placeholder(width: int, height: int):
    return RedirectResponse(f"https://placehold.co/{width}x{height}")

# Initialize the graph
agent_app = create_graph()

def analyze_scan_background(scan_id: int, file_path: str, patient_mrn: str, db: Session):
    """
    Background task to run the agent on the uploaded scan.
    """
    print(f"Starting background analysis for scan {scan_id}...")
    try:
        # Create a new session for the background task if needed, 
        # but here we might need to be careful with session handling in background tasks.
        # Better to create a fresh session.
        from backend.database import SessionLocal
        db_bg = SessionLocal()

        thread_id = str(uuid.uuid4())
        abs_file_path = os.path.abspath(file_path)
        
        initial_state = {
            "patient_id": patient_mrn,
            "xray_image_path": abs_file_path
        }
        
        config = {"configurable": {"thread_id": thread_id}}
        
        # Run the agent
        final_report_text = "Analysis failed or no report generated."
        
        # We need to stream/invoke until completion. 
        # Since we want to run it fully, we iterate through the stream.
        # Note: The graph might have interrupts. For this background task, 
        # we assume we want to reach the 'pdf_generator' or a final state.
        # If the graph requires human-in-the-loop, this might pause.
        # For now, let's assume it runs to a point where we have a report.
        
        current_report = ""
        
        for event in agent_app.stream(initial_state, config=config):
            # We can log progress here if we want
            pass
            
        # Get final state
        state = agent_app.get_state(config)
        if state.values:
            current_report = state.values.get("current_report", "")
            
        if not current_report:
            current_report = "No report generated by the agent."

        # Create Report entry in DB
        # We need to find the scan again in this session
        scan = db_bg.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            report = Report(
                scan_id=scan.id,
                radiologist_name="AI Agent", # Placeholder
                full_text=current_report,
                impression=current_report, # You might want to parse this out if possible
                patient_history=state.values.get("patient_history"),
                comparison_findings=state.values.get("comparison_result"),
                ner_tags={"visualization_path": state.values.get("visualization_path")}
            )
            db_bg.add(report)
            db_bg.commit()
            print(f"Report saved for scan {scan_id}")
        
        db_bg.close()
        
    except Exception as e:
        print(f"Error in background analysis: {e}")

@app.post("/api/scans")
async def upload_scan(
    background_tasks: BackgroundTasks,
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    body_part: str = Form("CHEST"),
    db: Session = Depends(get_db)
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.mrn == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Save file
    file_ext = file.filename.split(".")[-1]
    filename = f"scan_{patient_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = f"reports/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Upload to Cloudinary
    try:
        # Reset file pointer for Cloudinary upload
        file.file.seek(0)
        cloudinary_url = upload_to_cloud(file, folder="xrays", resource_type="image")
    except Exception as e:
        print(f"Cloudinary upload failed: {e}")
        # Fallback to local URL if upload fails
        cloudinary_url = f"/reports/{filename}"

    scan = Scan(
        patient_id=patient.id,
        file_url=cloudinary_url,
        body_part=body_part,
        view_position="PA", # Default
        modality="DX"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Trigger background analysis
    background_tasks.add_task(analyze_scan_background, scan.id, file_path, patient.mrn, db)
    
    return {
        "status": "success", 
        "scan_id": scan.id,
        "message": "Scan uploaded and analysis started"
    }

@app.get("/api/scans")
def get_scans(db: Session = Depends(get_db)):
    scans = db.query(Scan).options(joinedload(Scan.patient)).order_by(Scan.id.desc()).all()
    result = []
    for s in scans:
        result.append({
            "id": s.id,
            "patientName": s.patient.name,
            "patientId": s.patient.mrn,
            "bodyPart": s.body_part,
            "modality": s.modality,
            "date": s.scan_date.strftime("%b %d, %Y"),
            "time": s.scan_date.strftime("%H:%M"),
            "file_url": s.file_url
        })
    return result

class FeedbackRequest(BaseModel):
    thread_id: str
    action: str  # 'approve' or 'edit'
    new_report: Optional[str] = None

@app.post("/api/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    # Deprecated or used for direct demo without patient context
    try:
        thread_id = str(uuid.uuid4())
        file_ext = file.filename.split(".")[-1]
        file_path = f"reports/upload_{thread_id}.{file_ext}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        abs_file_path = os.path.abspath(file_path)
        
        initial_state = {
            "patient_id": thread_id[:8],
            "xray_image_path": abs_file_path
        }
        
        config = {"configurable": {"thread_id": thread_id}}
        
        print(f"Starting analysis for thread {thread_id}...")
        
        events = []
        for event in agent_app.stream(initial_state, config=config):
            events.append(event)
            
        state = agent_app.get_state(config)
        current_report = state.values.get("current_report", "No report generated.")
        
        return {
            "thread_id": thread_id,
            "status": "review_required",
            "current_report": current_report,
            "image_url": f"/reports/upload_{thread_id}.{file_ext}"
        }
        
    except Exception as e:
        print(f"Error in analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        state = agent_app.get_state(config)
        
        if not state.values:
            raise HTTPException(status_code=404, detail="Session not found or expired")
            
        current_report = state.values.get("current_report")
        
        if request.action == "edit" and request.new_report:
            if request.new_report != current_report:
                image_path = state.values.get("xray_image_path")
                patient_id = state.values.get("patient_id")
                save_feedback_data(image_path, current_report, request.new_report, patient_id)
            
            agent_app.update_state(config, {"current_report": request.new_report})
            print(f"Report updated for thread {request.thread_id}")
            
        print(f"Resuming workflow for thread {request.thread_id}...")
        final_state = {}
        for event in agent_app.stream(None, config=config):
            for key, value in event.items():
                if key == "pdf_generator":
                    final_state = value
        
        final_state_snapshot = agent_app.get_state(config)
        pdf_path = final_state_snapshot.values.get("pdf_path")
        viz_path = final_state_snapshot.values.get("visualization_path")
        
        pdf_url = None
        viz_url = None
        
        if pdf_path:
            filename = os.path.basename(pdf_path)
            pdf_url = f"/reports/{filename}"
            
        if viz_path:
            filename = os.path.basename(viz_path)
            viz_url = f"/reports/visualizations/{filename}"

        return {
            "status": "completed",
            "pdf_url": pdf_url,
            "visualization_url": viz_url
        }

    except Exception as e:
        print(f"Error in feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
def get_reports(db: Session = Depends(get_db)):
    # Fetch all reports with related scan and patient data
    reports = db.query(Report).options(
        joinedload(Report.scan).joinedload(Scan.patient)
    ).all()
    
    result = []
    for r in reports:
        result.append({
            "id": r.id,
            "patientName": r.scan.patient.name,
            "patientId": r.scan.patient.mrn,
            "date": r.scan.scan_date.strftime("%b %d, %Y"),
            "time": r.scan.scan_date.strftime("%H:%M"),
            "diagnosis": "See Findings", # Placeholder or extract from impression
            "findings": r.impression[:100] + "..." if len(r.impression) > 100 else r.impression,
            "full_text": r.full_text,
            "patient_history": r.patient_history,
            "comparison_findings": r.comparison_findings,
            "confidence": 95, # Placeholder
            "status": r.status or "Draft",
            "radiologist": r.radiologist_name,
            "pdf_url": r.pdf_url
        })
    return result

@app.get("/api/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).options(
        joinedload(Report.scan).joinedload(Scan.patient)
    ).filter(Report.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {
        "id": report.id,
        "patientName": report.scan.patient.name,
        "patientId": report.scan.patient.mrn,
        "date": report.scan.scan_date.strftime("%b %d, %Y"),
        "time": report.scan.scan_date.strftime("%H:%M"),
        "diagnosis": "See Findings",
        "findings": report.impression,
        "full_text": report.full_text,
        "patient_history": report.patient_history,
        "comparison_findings": report.comparison_findings,
        "confidence": 95,
        "status": report.status or "Draft",
        "radiologist": report.radiologist_name,
        "pdf_url": report.pdf_url,
        "ner_tags": report.ner_tags,
        "scan": {
            "file_url": report.scan.file_url,
            "body_part": report.scan.body_part
        }
    }

class ReportUpdate(BaseModel):
    full_text: Optional[str] = None
    impression: Optional[str] = None
    status: Optional[str] = None

@app.put("/api/reports/{report_id}")
def update_report(report_id: int, report_update: ReportUpdate, db: Session = Depends(get_db)):
    report = db.query(Report).options(joinedload(Report.scan).joinedload(Scan.patient)).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report_update.full_text:
        report.full_text = report_update.full_text
    
    if report_update.impression:
        report.impression = report_update.impression
        
    if report_update.status:
        report.status = report_update.status
        
        # If finalizing, generate PDF and extract NER
        if report_update.status == "Final":
            try:
                # 1. Extract NER
                print(f"Extracting NER for report {report_id}...")
                ner_manager = NERManager()
                ner_pipeline = ner_manager.load_pipeline()
                entities = extract_ner_entities(report.full_text, ner_pipeline)
                report.ner_tags = entities
                
                # 2. Generate PDF
                print(f"Generating PDF for report {report_id}...")
                pdf_filename = f"report_{report.scan.patient.mrn}_{report_id}.pdf"
                pdf_path = f"reports/{pdf_filename}"
                
                patient_details = {
                    "name": report.scan.patient.name,
                    "id": report.scan.patient.mrn,
                    "age": report.scan.patient.age,
                    "gender": report.scan.patient.gender
                }
                
                # Combine full text and impression for PDF
                pdf_content = f"# Clinical Indication\n{report.scan.body_part} X-ray\n\n# Findings\n{report.full_text}\n\n# Impression\n{report.impression}"
                
                generate_pdf_report(patient_details, pdf_content, pdf_path)
                
                # 3. Upload PDF to Cloudinary
                print(f"Uploading PDF to Cloudinary...")
                try:
                    pdf_url = upload_local_file(pdf_path, folder="reports", resource_type="raw")
                except Exception as e:
                    print(f"Cloudinary upload failed: {e}")
                    # Fallback to local URL if upload fails
                    pdf_url = f"/reports/{pdf_filename}"
                    
                report.pdf_url = pdf_url
                print(f"Report finalized. PDF URL: {pdf_url}")
                
            except Exception as e:
                print(f"Error finalizing report: {e}")
                # Don't fail the request, but log error. Status will still be Final.
                # Maybe revert status?
                # report.status = "Draft"
                # raise HTTPException(status_code=500, detail=f"Finalization failed: {e}")
                pass
        
    db.commit()
    db.refresh(report)
    
    return {"status": "success", "message": "Report updated", "pdf_url": report.pdf_url}

class ChatRequest(BaseModel):
    report_id: int
    question: str

@app.post("/api/chat")
def chat_with_report(request: ChatRequest, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == request.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Construct context from report
    context = f"Findings: {report.full_text}\nImpression: {report.impression}\nPatient History: {report.patient_history}"
    
    # Get answer from LLM
    answer = answer_text_question(context, request.question)
    
    return {"answer": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
