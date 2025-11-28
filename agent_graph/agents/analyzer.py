from agent_graph.state import AgentState
from agent_graph.tools.model_tools import ModelManager, predict_pathologies, generate_clip_report
from PIL import Image
import os

def analyzer_agent(state: AgentState) -> AgentState:
    print("--- Analyzer Agent ---")
    image_path = state.get("xray_image_path")
    
    if not image_path or not os.path.exists(image_path):
        return {"error": f"Image not found at {image_path}"}
    
    try:
        image = Image.open(image_path).convert('RGB')
        
        # Load models
        manager = ModelManager()
        chexnet = manager.load_chexnet()
        preprocess, clip_model, tokenizer = manager.load_clip()
        
        # Predict pathologies
        pathologies = predict_pathologies(image, chexnet)
        
        # Generate text report
        # Using a default set of labels for now, similar to what might be in cap.py or standard chest x-ray labels
        candidate_labels = [
            "normal chest x-ray", "pneumonia", "pleural effusion", "atelectasis", 
            "cardiomegaly", "pulmonary edema", "fracture", "nodule"
        ]
        report = generate_clip_report(image, preprocess, clip_model, tokenizer, candidate_labels)
        
        # Enhance report with ChexNet findings
        detected = [p for p, d in pathologies.items() if d['detected']]
        if detected:
            report += f"\n\n**ChexNet Detections:** {', '.join(detected)}"
        else:
            report += "\n\n**ChexNet Detections:** No significant pathologies detected."
            
        return {
            "current_report": report,
            "pathologies": pathologies
        }
        
    except Exception as e:
        print(f"Analyzer Error: {e}")
        return {"error": str(e)}
