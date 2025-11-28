from agent_graph.state import AgentState
from agent_graph.tools.llm_tools import compare_reports

def comparator_agent(state: AgentState) -> AgentState:
    print("--- Comparator Agent ---")
    current_report = state.get("current_report")
    patient_history = state.get("patient_history")
    
    if not current_report or not patient_history:
        print("Skipping comparison: missing report or history.")
        return {"comparison_result": "Comparison skipped due to missing data."}
    
    try:
        comparison = compare_reports(current_report, patient_history)
        return {"comparison_result": comparison}
        
    except Exception as e:
        print(f"Comparator Error: {e}")
        return {"error": str(e)}
