from agent_graph.state import AgentState
from agent_graph.real_database import fetch_patient_history, get_patient_details

def retriever_agent(state: AgentState) -> AgentState:
    print("--- Retriever Agent ---")
    patient_id = state.get("patient_id")
    
    if not patient_id:
        return {"error": "No patient ID provided"}
    
    try:
        # Fetch details and history
        details = get_patient_details(patient_id)
        history = fetch_patient_history(patient_id)
        
        summary = f"Patient: {details['name']} (Age: {details['age']}, Gender: {details['gender']})\nHistory: {history}"
        
        return {"patient_history": summary}
        
    except Exception as e:
        print(f"Retriever Error: {e}")
        return {"error": str(e)}
