from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
import re

# NER Configuration
NER_CONFIG = {
    'confidence_threshold': 0.5,
    'max_entities': 20,
    'min_text_length': 2,
    'high_confidence_threshold': 0.8
}

class NERManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NERManager, cls).__new__(cls)
            cls._instance.pipeline = None
        return cls._instance

    def load_pipeline(self):
        if self.pipeline is None:
            print("Loading NER pipeline...")
            try:
                tokenizer = AutoTokenizer.from_pretrained("d4data/biomedical-ner-all")
                model = AutoModelForTokenClassification.from_pretrained("d4data/biomedical-ner-all")
                self.pipeline = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")
                print("NER pipeline loaded.")
            except Exception as e:
                print(f"Error loading NER pipeline: {e}")
                raise e
        return self.pipeline

def extract_ner_entities(text, ner_pipeline):
    """Process text through NER pipeline with enhanced filtering."""
    try:
        if not text or not text.strip():
            return []
            
        entities = ner_pipeline(text)
        
        filtered_entities = []
        seen_entities = set()
        
        for entity in entities:
            confidence = entity.get('score', 0)
            text_content = entity.get('word', '').strip()
            label = entity.get('entity_group', 'UNKNOWN')
            
            if confidence < NER_CONFIG['confidence_threshold']:
                continue
            
            if len(text_content) < NER_CONFIG['min_text_length']:
                continue
                
            if text_content.isdigit() or not any(c.isalpha() for c in text_content):
                continue
                
            skip_words = {
                'yes', 'no', 'male', 'female', 'work', 'employment', 'report',
                'date', 'name', 'full', 'registration', 'passport', 'residence',
                'worker', 'foreign', 'my', 'fit', 'dr', 'md'
            }
            if text_content.lower() in skip_words:
                continue
            
            if text_content.startswith('##'):
                continue
            
            if len(text_content) == 1 or text_content.lower() in ['a', 'b', 'c', 'x', 'op']:
                continue
            
            entity_key = (text_content.lower(), label)
            if entity_key in seen_entities:
                continue
            seen_entities.add(entity_key)
            
            medical_labels = {
                'Disease_disorder', 'Medication', 'Diagnostic_procedure',
                'Therapeutic_procedure', 'Biological_structure', 'Sign_symptom'
            }
            
            if label in medical_labels or confidence > NER_CONFIG['high_confidence_threshold']:
                filtered_entities.append({
                    'label': label,
                    'text': text_content,
                    'confidence': round(float(confidence), 2)
                })
        
        filtered_entities.sort(key=lambda x: x['confidence'], reverse=True)
        return filtered_entities[:NER_CONFIG['max_entities']]
        
    except Exception as e:
        print(f"NER processing failed: {str(e)}")
        return []
