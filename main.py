import os
import sys
from agent_graph.graph import create_graph
from agent_graph.tools.feedback_tools import save_feedback_data

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    if len(sys.argv) < 2:
        image_path = r"D:\MUMBAI_HACKS\ijbi5318447-fig-0001b-m.jpg"
    else:
        image_path = sys.argv[1]
    patient_id = "12345"

    print(f"Starting workflow for Patient {patient_id} with image {image_path}")

    app = create_graph()
    
    initial_state = {
        "patient_id": patient_id,
        "xray_image_path": image_path
    }

    # Thread ID for persistence
    config = {"configurable": {"thread_id": "1"}}

    try:
        # Run until interrupt
        print("\n--- Running Initial Workflow ---")
        for event in app.stream(initial_state, config=config):
            for key, value in event.items():
                print(f"Node '{key}' finished.")
        
        # Check state at interrupt
        state = app.get_state(config)
        current_report = state.values.get('current_report')
        print("\n--- Workflow Paused for Human Review ---")
        print(f"Current Report Draft:\n{current_report}")
        
        # Simulate Human Edit
        print("\n[Human] Reviewing report...")
        user_input = input("Press Enter to approve, or type 'edit' to modify: ")
        
        if user_input.lower() == 'edit':
            new_report = input("Enter new report text: ")
            
            if new_report != current_report:
                print("\n--- Saving Feedback Data ---")
                save_feedback_data(image_path, current_report, new_report, patient_id)
            
            app.update_state(config, {"current_report": new_report})
            print("Report updated by human.")
        else:
            print("Report approved.")
            
        # Resume workflow
        print("\n--- Resuming Workflow ---")
        for event in app.stream(None, config=config):
             for key, value in event.items():
                print(f"Node '{key}' finished.")
                if key == "visualizer":
                    print(f"Visualization saved to: {value.get('visualization_path')}")
                if key == "pdf_generator":
                    print(f"Final PDF: {value.get('pdf_path')}")

    except Exception as e:
        print(f"Workflow Execution Failed: {e}")

if __name__ == "__main__":
    main()
