import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

# Import our agent graph
from agent_graph.graph import create_graph
from agent_graph.tools.feedback_tools import save_feedback_data

app = FastAPI(title="Radiologist Copilot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount reports directory to serve PDFs and images
os.makedirs("reports", exist_ok=True)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

# Initialize the graph
agent_app = create_graph()

class FeedbackRequest(BaseModel):
    thread_id: str
    action: str  # 'approve' or 'edit'
    new_report: Optional[str] = None

@app.post("/api/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    try:
        # Generate a unique thread ID for this session
        thread_id = str(uuid.uuid4())
        
        # Save the uploaded file
        file_ext = file.filename.split(".")[-1]
        file_path = f"reports/upload_{thread_id}.{file_ext}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Absolute path for the agent
        abs_file_path = os.path.abspath(file_path)
        
        # Initial state
        initial_state = {
            "patient_id": thread_id[:8], # Use part of UUID as mock patient ID
            "xray_image_path": abs_file_path
        }
        
        config = {"configurable": {"thread_id": thread_id}}
        
        print(f"Starting analysis for thread {thread_id}...")
        
        # Run until interrupt (Human Review)
        # We assume the graph pauses at 'interrupt_before=["pdf_generator"]'
        # We need to iterate through the stream until it stops
        
        events = []
        for event in agent_app.stream(initial_state, config=config):
            events.append(event)
            
        # Get the current state (should be paused)
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
            # Save feedback if changed
            if request.new_report != current_report:
                image_path = state.values.get("xray_image_path")
                patient_id = state.values.get("patient_id")
                save_feedback_data(image_path, current_report, request.new_report, patient_id)
            
            # Update state with new report
            agent_app.update_state(config, {"current_report": request.new_report})
            print(f"Report updated for thread {request.thread_id}")
            
        # Resume workflow
        print(f"Resuming workflow for thread {request.thread_id}...")
        final_state = {}
        for event in agent_app.stream(None, config=config):
            for key, value in event.items():
                if key == "pdf_generator":
                    final_state = value
        
        # Retrieve final paths from the last state update or by checking the state again
        # The event loop above might yield partial updates. Let's check the final state.
        final_state_snapshot = agent_app.get_state(config)
        pdf_path = final_state_snapshot.values.get("pdf_path")
        viz_path = final_state_snapshot.values.get("visualization_path")
        
        # Convert absolute paths to relative URLs for serving
        pdf_url = None
        viz_url = None
        
        if pdf_path:
            # Assuming pdf_path is absolute, make it relative to 'reports' mount
            # Our agents save to d:/MUMBAI_HACKS/reports/...
            # We need to serve it via /reports/...
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
