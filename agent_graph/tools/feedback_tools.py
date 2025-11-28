import json
import os
import datetime

FEEDBACK_FILE = "d:/MUMBAI_HACKS/training_data/feedback.jsonl"

def save_feedback_data(image_path, ai_report, human_report, patient_id):
    """
    Saves the feedback data (AI draft vs Human final) to a JSONL file.
    """
    try:
        os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
        
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "patient_id": patient_id,
            "image_path": image_path,
            "ai_draft": ai_report,
            "human_final": human_report
        }
        
        with open(FEEDBACK_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
            
        print(f"Feedback data saved to {FEEDBACK_FILE}")
        return True
    except Exception as e:
        print(f"Error saving feedback data: {e}")
        return False
