import torch
import numpy as np
import cv2
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from skimage import measure, morphology
import io
from PIL import Image

# Anatomical Regions
ANATOMICAL_REGIONS = {
    'upper_left_lung': {'coords': (0, 0, 0.45, 0.6), 'label': 'Upper Left Lung'},
    'lower_left_lung': {'coords': (0, 0.4, 0.45, 1.0), 'label': 'Lower Left Lung'},
    'upper_right_lung': {'coords': (0.55, 0, 1.0, 0.6), 'label': 'Upper Right Lung'},
    'lower_right_lung': {'coords': (0.55, 0.4, 1.0, 1.0), 'label': 'Lower Right Lung'},
    'heart': {'coords': (0.35, 0.3, 0.65, 0.8), 'label': 'Cardiac Region'},
    'mediastinum': {'coords': (0.4, 0.1, 0.6, 0.9), 'label': 'Mediastinum'},
    'left_costophrenic': {'coords': (0.1, 0.75, 0.4, 0.95), 'label': 'Left Costophrenic Angle'},
    'right_costophrenic': {'coords': (0.6, 0.75, 0.9, 0.95), 'label': 'Right Costophrenic Angle'}
}

class GradCAM:
    """Gradient-weighted Class Activation Mapping for model interpretability"""
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_backward_hook(self.save_gradient)
        
    def save_activation(self, module, input, output):
        self.activations = output.detach()
        
    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()
        
    def generate_cam(self, input_image, class_idx):
        self.model.zero_grad()
        output = self.model(input_image)
        output[0, class_idx].backward(retain_graph=True)

        gradients = self.gradients[0]
        activations = self.activations[0]

        weights = torch.mean(gradients, dim=[1, 2])
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32, device=activations.device)

        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = torch.relu(cam)
        if torch.max(cam) > 0:
            cam = cam / torch.max(cam)

        return cam.cpu().numpy()

def find_activation_regions(cam_map, threshold=0.3, min_area=100):
    binary_map = cam_map > threshold
    binary_map = morphology.remove_small_objects(binary_map, min_size=min_area)
    binary_map = morphology.binary_closing(binary_map, morphology.disk(5))
    
    labeled_regions = measure.label(binary_map)
    regions = measure.regionprops(labeled_regions, intensity_image=cam_map)
    
    return regions, labeled_regions

def get_anatomical_region(centroid, image_shape):
    y, x = centroid
    h, w = image_shape
    norm_x = x / w
    norm_y = y / h
    
    for region_name, region_info in ANATOMICAL_REGIONS.items():
        x1, y1, x2, y2 = region_info['coords']
        if x1 <= norm_x <= x2 and y1 <= norm_y <= y2:
            return region_info['label']
    
    return "Unspecified Region"

def analyze_pathology_regions(segmentation_maps, image_shape, activation_threshold=0.3):
    region_analysis = {}
    
    for pathology, seg_map in segmentation_maps.items():
        regions, labeled_regions = find_activation_regions(seg_map, activation_threshold)
        
        pathology_regions = []
        for i, region in enumerate(regions):
            centroid = region.centroid
            anatomical_location = get_anatomical_region(centroid, image_shape)
            
            region_info = {
                'region_id': i + 1,
                'anatomical_location': anatomical_location,
                'centroid': centroid,
                'area': region.area,
                'max_intensity': region.max_intensity,
                'mean_intensity': region.mean_intensity,
                'bbox': region.bbox
            }
            pathology_regions.append(region_info)
        
        region_analysis[pathology] = {
            'regions': pathology_regions,
            'labeled_map': labeled_regions
        }
    
    return region_analysis

def create_labeled_overlay_visualization(image, segmentation_maps, region_analysis, alpha=0.4):
    try:
        img_array = np.array(image)
        num_pathologies = len(segmentation_maps)
        
        if num_pathologies == 0:
            return None
            
        fig, axes = plt.subplots(2, min(num_pathologies, 3), figsize=(18, 12))
        
        if num_pathologies == 1:
            axes = axes.reshape(2, 1)
        elif num_pathologies == 2:
            axes = axes.reshape(2, 2)
            
        colors = ['Reds', 'Blues', 'Greens', 'Purples', 'Oranges']
        bbox_colors = ['red', 'blue', 'green', 'purple', 'orange']
        
        for idx, (pathology, seg_map) in enumerate(segmentation_maps.items()):
            if idx >= 3:
                break
                
            col_idx = idx % 3
            
            # Top row
            ax_top = axes[0, col_idx] if num_pathologies > 1 else axes[0, 0]
            ax_top.imshow(img_array, cmap='gray')
            ax_top.imshow(seg_map, cmap=colors[idx % len(colors)], alpha=alpha, vmin=0, vmax=1)
            ax_top.set_title(f'{pathology} - Segmentation Map', fontsize=12, fontweight='bold')
            ax_top.axis('off')
            
            # Bottom row
            ax_bottom = axes[1, col_idx] if num_pathologies > 1 else axes[1, 0]
            ax_bottom.imshow(img_array, cmap='gray')
            ax_bottom.imshow(seg_map, cmap=colors[idx % len(colors)], alpha=alpha, vmin=0, vmax=1)
            
            if pathology in region_analysis:
                regions = region_analysis[pathology]['regions']
                for region in regions:
                    min_row, min_col, max_row, max_col = region['bbox']
                    rect = Rectangle((min_col, min_row), max_col - min_col, max_row - min_row,
                                   linewidth=2, edgecolor=bbox_colors[idx % len(bbox_colors)], 
                                   facecolor='none', alpha=0.8)
                    ax_bottom.add_patch(rect)
                    
                    centroid_y, centroid_x = region['centroid']
                    label_text = f"Region {region['region_id']}\n{region['anatomical_location']}\nIntensity: {region['max_intensity']:.2f}"
                    
                    ax_bottom.annotate(label_text, 
                                     xy=(centroid_x, centroid_y),
                                     xytext=(10, 10), textcoords='offset points',
                                     bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8),
                                     fontsize=8, ha='left', va='bottom',
                                     arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0'))
            
            ax_bottom.set_title(f'{pathology} - Labeled Regions', fontsize=12, fontweight='bold')
            ax_bottom.axis('off')
        
        # Hide unused
        for idx in range(num_pathologies, 3):
            if num_pathologies < 3:
                axes[0, idx].axis('off')
                axes[1, idx].axis('off')
        
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        overlay_image = Image.open(buf)
        plt.close()
        
        return overlay_image
    
    except Exception as e:
        print(f"Error creating labeled overlay visualization: {e}")
        return None

def generate_region_report(region_analysis):
    report = "## Detailed Region Analysis\n\n"
    
    if not region_analysis:
        return report + "No significant regions detected.\n"
    
    for pathology, analysis in region_analysis.items():
        regions = analysis['regions']
        
        if not regions:
            report += f"### {pathology}\nNo specific regions identified.\n\n"
            continue
            
        report += f"### {pathology}\n"
        report += f"**Number of affected regions:** {len(regions)}\n\n"
        
        for i, region in enumerate(regions, 1):
            report += f"**Region {i}:**\n"
            report += f"- **Location:** {region['anatomical_location']}\n"
            report += f"- **Size:** {region['area']} pixels\n"
            report += f"- **Maximum Activation:** {region['max_intensity']:.3f}\n"
            report += f"- **Average Activation:** {region['mean_intensity']:.3f}\n"
            
            if region['max_intensity'] > 0.8:
                severity = "High confidence detection"
            elif region['max_intensity'] > 0.5:
                severity = "Moderate confidence detection"
            else:
                severity = "Low confidence detection"
            
            report += f"- **Confidence Level:** {severity}\n\n"
    
    return report
def create_overlay_image(image, segmentation_maps, region_analysis):
    """
    Creates a single overlay image with heatmap and bounding boxes, 
    matching the original image dimensions.
    """
    try:
        # Convert PIL to OpenCV format (RGB)
        img_np = np.array(image)
        
        # Create a white canvas for the overlay (since frontend uses mix-blend-multiply)
        # White becomes transparent in multiply mode
        overlay = np.ones_like(img_np) * 255
        
        if not segmentation_maps:
            return Image.fromarray(overlay)
            
        # We'll combine all pathologies
        # For simplicity in this overlay, we'll use Red for all, or cycle colors
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)] # RGB
        
        for idx, (pathology, seg_map) in enumerate(segmentation_maps.items()):
            color = colors[idx % len(colors)]
            
            # 1. Apply Heatmap
            # Normalize seg_map to 0-255
            heatmap_uint8 = (seg_map * 255).astype(np.uint8)
            
            # Create a colored heatmap
            # We want: where heatmap is high, show Color. Where low, show White.
            # In multiply mode: 
            # Result = Background * Overlay / 255
            # So Overlay should be: 255 (White) where no heat, and Color where heat.
            
            # Inverse heatmap for mixing: 0 (Heat) to 1 (No Heat)
            inv_heatmap = 1.0 - seg_map
            inv_heatmap = np.clip(inv_heatmap, 0, 1)
            
            # Create colored layer
            # R channel
            layer_r = np.ones_like(seg_map) * 255
            # If color is (255, 0, 0), then G and B should be reduced by heatmap intensity
            # R stays 255. G becomes 255 * inv_heatmap. B becomes 255 * inv_heatmap.
            
            layer = np.zeros_like(img_np)
            for c in range(3):
                # If the color component is 255, it stays 255 (white)
                # If the color component is 0, it goes down to 0 based on heatmap intensity
                # Actually, simpler:
                # Target Color at max heat: C
                # Target Color at min heat: 255
                # Pixel = C * heat + 255 * (1-heat)
                layer[:, :, c] = (color[c] * seg_map + 255 * (1 - seg_map)).astype(np.uint8)
            
            # Combine with existing overlay using min (since we are in multiply logic domain, darker wins)
            overlay = np.minimum(overlay, layer)

            # 2. Draw Bounding Boxes
            if pathology in region_analysis:
                regions = region_analysis[pathology]['regions']
                for region in regions:
                    min_row, min_col, max_row, max_col = region['bbox']
                    # Draw rectangle
                    # cv2.rectangle(img, pt1, pt2, color, thickness)
                    # Note: cv2 uses (x, y) -> (col, row)
                    cv2.rectangle(overlay, (min_col, min_row), (max_col, max_row), color, 3)
                    
                    # Add Label
                    label = f"{pathology} {region['region_id']}"
                    cv2.putText(overlay, label, (min_col, min_row - 10), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        return Image.fromarray(overlay.astype(np.uint8))
        
    except Exception as e:
        print(f"Error creating overlay image: {e}")
        return None
