import requests
import json

def answer_text_question(context, question):
    """
    Answers a user's question based on the generated report (context) using MedGemma via LM Studio.
    """
    if not context or not question:
        return "Cannot answer without a report context and a question."
    
    url = "http://localhost:1234/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    system_instruction = "You are an experienced radiologist. Analyze the provided X-ray report and answer questions based solely on the information within the report, providing clear and concise medical insights."
    
    payload = {
        "model": "medgemma-4b-it",
        "messages": [
            {
                "role": "system",
                "content": system_instruction
            },
            {
                "role": "user",
                "content": f"Context: {context}\nQuestion: {question}"
            }
        ],
        "temperature": 0.7,
        "max_tokens": -1,
        "stream": False
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']

    except requests.exceptions.RequestException as e:
        print(f"Error communicating with LM Studio: {e}")
        return "Error: Could not connect to LLM provider (LM Studio). Please ensure it is running on port 1234."
    except Exception as e:
        print(f"An error occurred during question answering: {e}")
        return "Sorry, I could not answer the question."

def compare_reports(current_report: str, history: str) -> str:
    """
    Compares current report with patient history using MedGemma.
    """
    context = f"Patient History: {history}\n\nCurrent X-Ray Report: {current_report}"
    question = "Compare the current report with the patient history. Highlight any improvements, deteriorations, or new findings. Provide a detailed analysis as an experienced radiologist."
    
    return answer_text_question(context, question)
