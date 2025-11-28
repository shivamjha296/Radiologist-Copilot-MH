from agent_graph.state import AgentState
from agent_graph.tools.pdf_tools import generate_pdf_report
from agent_graph.real_database import get_patient_details, store_report
import os

def pdf_agent(state: AgentState) -> AgentState:
    print("--- PDF Generator Agent ---")
    patient_id = state.get("patient_id")
    current_report = state.get("current_report")
    xray_path = state.get("xray_image_path")
    
    if not patient_id or not current_report:
        return {"error": "Missing data for PDF generation."}
    
    try:
        details = get_patient_details(patient_id)
        
        output_dir = "d:/MUMBAI_HACKS/reports"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"report_{patient_id}.pdf")
        
        generate_pdf_report(details, current_report, output_path)
        
        print(f"PDF generated at: {output_path}")
        
        # Store in database
        if xray_path:
             store_report(patient_id, current_report, xray_path)
             
        return {"pdf_path": output_path}
        
    except Exception as e:
        print(f"PDF Agent Error: {e}")
        return {"error": str(e)}
