import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from open_clip import create_model_from_pretrained, get_tokenizer
from PIL import Image
import numpy as np
import cv2

# Device configuration
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

# ChexNet Labels
CHEXNET_LABELS = [
    'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration', 'Mass', 
    'Nodule', 'Pneumonia', 'Pneumothorax', 'Consolidation', 'Edema', 
    'Emphysema', 'Fibrosis', 'Pleural_Thickening', 'Hernia'
]

class ChexNet(nn.Module):
    """ChexNet model architecture based on DenseNet121"""
    def __init__(self, num_classes=14):
        super(ChexNet, self).__init__()
        self.densenet121 = models.densenet121(pretrained=True)
        num_ftrs = self.densenet121.classifier.in_features
        self.densenet121.classifier = nn.Sequential(
            nn.Linear(num_ftrs, num_classes),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        return self.densenet121(x)

class ModelManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance.chexnet_model = None
            cls._instance.clip_model = None
            cls._instance.clip_preprocess = None
            cls._instance.clip_tokenizer = None
        return cls._instance

    def load_chexnet(self):
        if self.chexnet_model is None:
            print("Loading ChexNet model...")
            try:
                model = ChexNet(num_classes=len(CHEXNET_LABELS))
                # In a real scenario, we would load weights here:
                # model.load_state_dict(torch.load('chexnet_model.pth.tar', map_location=device))
                model.to(device)
                model.eval()
                self.chexnet_model = model
                print("ChexNet model loaded.")
            except Exception as e:
                print(f"Error loading ChexNet: {e}")
                raise e
        return self.chexnet_model

    def get_chexnet_target_layer(self):
        """Returns the target layer for GradCAM"""
        if self.chexnet_model:
            return self.chexnet_model.densenet121.features.denseblock4.denselayer16.conv2
        return None

    def load_clip(self):
        if self.clip_model is None:
            print("Loading BiomedCLIP model...")
            try:
                model, preprocess = create_model_from_pretrained('hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224')
                tokenizer = get_tokenizer('hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224')
                model.to(device)
                self.clip_model = model
                self.clip_preprocess = preprocess
                self.clip_tokenizer = tokenizer
                print("BiomedCLIP loaded.")
            except Exception as e:
                print(f"Error loading BiomedCLIP: {e}")
                raise e
        return self.clip_preprocess, self.clip_model, self.clip_tokenizer

def preprocess_image_for_chexnet(image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    if isinstance(image, np.ndarray):
        image = Image.fromarray(image)
    
    # Ensure image is RGB
    if image.mode != 'RGB':
        image = image.convert('RGB')
        
    image_tensor = transform(image).unsqueeze(0).to(device)
    return image_tensor

def predict_pathologies(image, model, threshold=0.5):
    try:
        image_tensor = preprocess_image_for_chexnet(image)
        with torch.no_grad():
            predictions = model(image_tensor)
            predictions = predictions.cpu().numpy()[0]
        results = {}
        for i, label in enumerate(CHEXNET_LABELS):
            results[label] = {
                'probability': float(predictions[i]),
                'detected': bool(predictions[i] > threshold)
            }
        return results
    except Exception as e:
        print(f"Error in pathology prediction: {e}")
        return {}

def generate_clip_report(image, preprocess, model, tokenizer, candidate_labels):
    if not image or not candidate_labels:
        return "Error: Invalid input."

    try:
        template = 'this is a photo of '
        texts = tokenizer([template + label for label in candidate_labels], context_length=256).to(device)
        
        # Ensure image is PIL
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
            
        with torch.no_grad():
            image_processed = preprocess(image).unsqueeze(0).to(device)
            image_features, text_features, logit_scale = model(image_processed, texts)
            logits = (logit_scale * image_features @ text_features.t()).detach().softmax(dim=-1)

        probs = logits.cpu().numpy()
        scores = {label: prob for label, prob in zip(candidate_labels, probs[0])}
        sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)

        report_lines = []
        for label, score in sorted_scores:
            report_lines.append(f"- **{label}:** {score:.2%}")
            
        return "\n".join(report_lines)
    except Exception as e:
        print(f"Error generating CLIP report: {e}")
        return "Failed to generate report."
