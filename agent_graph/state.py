from typing import TypedDict, Any, List, Optional

class AgentState(TypedDict):
    patient_id: str
    xray_image_path: str
    current_report: Optional[str]
    patient_history: Optional[str]
    comparison_result: Optional[str]
    pathologies: Optional[dict]
    visualization_path: Optional[str]
    error: Optional[str]
