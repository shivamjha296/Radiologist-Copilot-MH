from agent_graph.state import AgentState
from agent_graph.tools.model_tools import ModelManager, preprocess_image_for_chexnet, CHEXNET_LABELS
from agent_graph.tools.viz_tools import GradCAM, analyze_pathology_regions, create_labeled_overlay_visualization, generate_region_report
from PIL import Image
import cv2
import numpy as np
import os

def visualizer_agent(state: AgentState) -> AgentState:
    print("--- Visualizer Agent ---")
    image_path = state.get("xray_image_path")
    pathologies = state.get("pathologies")
    
    if not image_path or not pathologies:
        return {"error": "Missing image or pathologies for visualization."}
    
    try:
        image = Image.open(image_path).convert('RGB')
        img_array = np.array(image)
        original_size = img_array.shape[:2][::-1] # (width, height)
        
        # Load model and GradCAM
        manager = ModelManager()
        model = manager.load_chexnet()
        target_layer = manager.get_chexnet_target_layer()
        grad_cam = GradCAM(model, target_layer)
        
        # Generate segmentation maps for detected pathologies
        image_tensor = preprocess_image_for_chexnet(image)
        segmentation_maps = {}
        
        for pathology, data in pathologies.items():
            if data['detected']:
                class_idx = CHEXNET_LABELS.index(pathology)
                cam = grad_cam.generate_cam(image_tensor, class_idx)
                cam_resized = cv2.resize(cam, original_size)
                segmentation_maps[pathology] = cam_resized
        
        if not segmentation_maps:
            print("No pathologies detected for visualization.")
            return {"visualization_report": "No significant pathologies to visualize."}

        # Analyze regions
        region_analysis = analyze_pathology_regions(segmentation_maps, img_array.shape[:2])
        
        # Create overlay
        overlay_image = create_labeled_overlay_visualization(image, segmentation_maps, region_analysis)
        
        # Save overlay
        output_dir = "d:/MUMBAI_HACKS/reports/visualizations"
        os.makedirs(output_dir, exist_ok=True)
        patient_id = state.get("patient_id", "unknown")
        overlay_path = os.path.join(output_dir, f"overlay_{patient_id}.png")
        
        if overlay_image:
            overlay_image.save(overlay_path)
            print(f"Overlay saved to {overlay_path}")
        
        # Generate region report
        region_report = generate_region_report(region_analysis)
        
        # Append region report to current report
        current_report = state.get("current_report", "")
        updated_report = current_report + "\n\n" + region_report
        
        return {
            "current_report": updated_report,
            "visualization_path": overlay_path
        }
        
    except Exception as e:
        print(f"Visualizer Agent Error: {e}")
        return {"error": str(e)}
