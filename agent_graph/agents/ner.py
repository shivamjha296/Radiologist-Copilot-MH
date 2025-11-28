from agent_graph.state import AgentState
from agent_graph.tools.ner_tools import NERManager, extract_ner_entities

def ner_agent(state: AgentState) -> AgentState:
    print("--- NER Agent ---")
    current_report = state.get("current_report")
    
    if not current_report:
        return {"error": "No report to analyze for NER."}
    
    try:
        manager = NERManager()
        pipeline = manager.load_pipeline()
        
        entities = extract_ner_entities(current_report, pipeline)
        
        # Format entities for display/storage
        entities_summary = ", ".join([f"{e['text']} ({e['label']})" for e in entities])
        print(f"Extracted Entities: {entities_summary}")
        
        return {"pathologies": {"ner_entities": entities}}
        
    except Exception as e:
        print(f"NER Agent Error: {e}")
        return {"error": str(e)}
