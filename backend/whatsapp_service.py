"""
WhatsApp Integration Service using Twilio
Sends medical reports to patients and handles AI-powered Q&A chatbot
Uses PostgreSQL database
"""
import os
from twilio.rest import Client
from dotenv import load_dotenv
from database_postgres import (
    get_patient_by_phone, 
    get_report_by_id, 
    mark_report_sent_whatsapp,
    save_chat_message,
    get_chat_history,
    init_whatsapp_tables
)

# Load environment variables
load_dotenv()

# Initialize WhatsApp tables on import
try:
    init_whatsapp_tables()
except Exception as e:
    print(f"⚠️ Warning: Could not initialize WhatsApp tables: {e}")

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')

# Initialize Twilio client (lazy loading)
_twilio_client = None

def get_twilio_client():
    """Get or create Twilio client instance."""
    global _twilio_client
    if _twilio_client is None:
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
            raise ValueError("Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file")
        _twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    return _twilio_client


def format_phone_number(phone):
    """Format phone number for WhatsApp (E.164 format)."""
    # Remove any non-digit characters
    phone = ''.join(filter(str.isdigit, phone))
    
    # Add country code if not present (assuming India +91)
    if not phone.startswith('91') and len(phone) == 10:
        phone = '91' + phone
    
    return f'whatsapp:+{phone}'


def send_whatsapp_message(to_number, message_body):
    """Send a WhatsApp message using Twilio."""
    try:
        client = get_twilio_client()
        to_whatsapp = format_phone_number(to_number)
        
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=to_whatsapp
        )
        
        print(f"✅ WhatsApp message sent successfully! SID: {message.sid}")
        return True, message.sid
    
    except Exception as e:
        print(f"❌ Error sending WhatsApp message: {e}")
        return False, str(e)


def send_report_to_patient(report_id, phone_number=None):
    """
    Send medical report to patient via WhatsApp.
    
    Args:
        report_id: ID of the report to send
        phone_number: Optional phone number (if not in DB)
    
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Get report details
        report = get_report_by_id(report_id)
        
        if not report:
            return False, "Report not found"
        
        # Use phone from DB if not provided
        target_phone = phone_number or report.get('phone_number')
        
        if not target_phone:
            return False, "No phone number available for patient"
        
        # Format the report message
        patient_name = report.get('name', 'Patient')
        age = report.get('age', 'N/A')
        gender = report.get('gender', 'N/A')
        report_content = report.get('report_content', '')
        filename = report.get('filename', 'Medical Report')
        
        message_body = f"""
🏥 *Medical Report Ready*

Dear {patient_name},

Your medical report is now available.

👤 *Patient Details:*
• Name: {patient_name}
• Age: {age}
• Gender: {gender}

📋 *Report:* {filename}

{report_content if report_content else ''}

---

💬 *Have questions about your report?*
Simply reply to this message and our AI assistant will help clarify your doubts instantly!

📞 For urgent concerns, please contact your doctor immediately.

🏥 Radiologist Copilot AI
Your trusted medical imaging companion
        """.strip()
        
        # Send the message
        success, result = send_whatsapp_message(target_phone, message_body)
        
        if success:
            # Mark report as sent
            mark_report_sent_whatsapp(report_id)
            return True, f"Report sent successfully to {target_phone}"
        else:
            return False, f"Failed to send report: {result}"
    
    except Exception as e:
        return False, f"Error sending report: {str(e)}"


def generate_ai_response(patient_data, user_question, chat_history):
    """
    Generate AI response to patient's question about their medical report.
    
    Args:
        patient_data: Dict containing patient and report information
        user_question: The patient's question
        chat_history: List of previous messages
    
    Returns:
        str: AI-generated response
    """
    try:
        # Import here to avoid circular dependencies
        from transformers import pipeline
        import os
        
        # Use a lightweight model for question answering
        # You can replace this with Google Gemini or OpenAI if API keys are available
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        
        # Build context from patient data
        context = f"""
Patient Information:
- Name: {patient_data.get('name', 'Unknown')}
- Age: {patient_data.get('age', 'Unknown')}
- Gender: {patient_data.get('gender', 'Unknown')}

Medical Report:
{patient_data.get('report_content', 'No report content available')}

Recent Conversation:
"""
        
        # Add chat history for context
        for msg in chat_history[-5:]:  # Last 5 messages for context
            from_who = "Patient" if msg['message_from'] == 'patient' else "AI Assistant"
            context += f"{from_who}: {msg['message_text']}\n"
        
        context += f"\nPatient's Current Question: {user_question}\n"
        
        # Try using Google Gemini if available
        if gemini_api_key and gemini_api_key != 'your_gemini_api_key_here':
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                # Updated model name - Google changed from 'gemini-pro' to 'gemini-1.5-flash'
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                prompt = f"""You are a helpful medical AI assistant. Answer the patient's question based on their medical report.
Be clear, compassionate, and accurate. If you're unsure, advise them to consult their doctor.

{context}

Provide a clear, concise answer (max 300 words):"""
                
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                print(f"Gemini API error: {e}")
        
        # Try using OpenAI if available
        if openai_api_key and openai_api_key != 'your_openai_key_here':
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_api_key)
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful medical AI assistant. Answer patient questions about their medical reports clearly and compassionately."},
                        {"role": "user", "content": f"{context}\n\nProvide a clear answer (max 300 words):"}
                    ],
                    max_tokens=400,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API error: {e}")
        
        # Fallback: Use local lightweight model or rule-based responses
        # This is a simple fallback for when no API keys are available
        return generate_fallback_response(user_question, patient_data)
    
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return generate_fallback_response(user_question, patient_data)


def generate_fallback_response(question, patient_data):
    """Generate a simple rule-based response when AI APIs are unavailable."""
    question_lower = question.lower()
    
    # Common medical questions and responses
    if any(word in question_lower for word in ['pneumonia', 'infection', 'lung']):
        return """Based on your report, I can see findings related to your lungs. 
        
Key points:
• Follow your doctor's prescribed treatment plan
• Take medications as directed
• Get adequate rest and hydration
• Monitor your symptoms

⚠️ Please consult your doctor for:
- Detailed interpretation
- Treatment options
- Follow-up care

For urgent symptoms (difficulty breathing, chest pain), seek immediate medical attention."""
    
    elif any(word in question_lower for word in ['normal', 'okay', 'fine', 'healthy']):
        return """I can help clarify your report findings.

Your report should indicate whether findings are within normal limits or require attention.

If you see:
✅ "Normal" or "No acute findings" - Generally good
⚠️ "Abnormal" or specific conditions - Needs doctor consultation

Please discuss the full interpretation with your doctor, who can provide personalized advice based on your complete medical history."""
    
    elif any(word in question_lower for word in ['medicine', 'medication', 'treatment', 'cure']):
        return """For treatment recommendations:

⚠️ I cannot prescribe medications or treatments.

Please:
1. Schedule a consultation with your doctor
2. Discuss your report findings
3. Get a personalized treatment plan
4. Ask about medications, dosage, and duration

Your doctor will consider your complete health history to recommend the best treatment."""
    
    elif any(word in question_lower for word in ['serious', 'dangerous', 'risk', 'worried']):
        return """I understand your concern about your health.

✅ What you should do:
1. Review findings with your doctor
2. Understand the significance of any abnormalities
3. Discuss prognosis and next steps
4. Ask questions during your consultation

Remember:
• Early detection allows for timely intervention
• Many conditions are manageable with proper care
• Your doctor is your best resource for personalized guidance

📞 If you have severe symptoms, contact your doctor immediately or visit the ER."""
    
    else:
        return f"""Thank you for your question about: "{question}"

To provide accurate medical guidance, I recommend:

1. 📋 Review your complete report with your doctor
2. 💬 Ask specific questions during your consultation
3. 📝 Keep a list of symptoms or concerns
4. 🔄 Schedule follow-up appointments as needed

Your report contains detailed findings that require professional medical interpretation in the context of your overall health.

For urgent concerns, please contact your healthcare provider directly.

💡 You can also ask me:
• About general terms in your report
• What certain findings typically mean
• When to seek follow-up care"""


def handle_incoming_whatsapp_message(from_number, message_text):
    """
    Handle incoming WhatsApp message from patient.
    
    Args:
        from_number: Patient's phone number
        message_text: The message text
    
    Returns:
        tuple: (success: bool, response_message: str)
    """
    try:
        # Clean phone number
        clean_phone = ''.join(filter(str.isdigit, from_number.replace('whatsapp:', '')))
        
        # Get patient information
        patient_data = get_patient_by_phone(clean_phone)
        
        if not patient_data:
            response = """👋 Hello! I'm the Radiologist Copilot AI Assistant.

I couldn't find your medical records in our system. 

To get your medical report and chat support:
1. Ensure your phone number is registered
2. Contact your healthcare provider
3. They will add your details to our system

If you believe this is an error, please contact support."""
            
            send_whatsapp_message(clean_phone, response)
            return True, "Welcome message sent to unregistered number"
        
        # Save patient's message to chat history
        patient_id = patient_data.get('id')
        save_chat_message(clean_phone, patient_id, 'patient', message_text)
        
        # Get chat history for context
        chat_history = get_chat_history(clean_phone, limit=10)
        
        # Generate AI response
        ai_response = generate_ai_response(patient_data, message_text, chat_history)
        
        # Save AI response to chat history
        save_chat_message(clean_phone, patient_id, 'ai', ai_response)
        
        # Send response via WhatsApp
        success, result = send_whatsapp_message(clean_phone, ai_response)
        
        if success:
            return True, "AI response sent successfully"
        else:
            return False, f"Failed to send response: {result}"
    
    except Exception as e:
        error_msg = f"Error handling message: {str(e)}"
        print(f"❌ {error_msg}")
        return False, error_msg


def send_welcome_message(phone_number, patient_name):
    """Send welcome message to new patient."""
    message = f"""👋 Welcome to Radiologist Copilot AI, {patient_name}!

You will receive your medical reports directly on WhatsApp.

💬 *How to use:*
• Your reports will be sent here automatically
• Ask questions about your report anytime
• Get instant AI-powered answers
• 24/7 support for your medical queries

📋 Simply reply with your questions like:
• "What does this finding mean?"
• "Is my report normal?"
• "What should I do next?"

🏥 We're here to help!"""
    
    return send_whatsapp_message(phone_number, message)


# Test function
if __name__ == "__main__":
    print("WhatsApp Service Module")
    print("=" * 50)
    print(f"Twilio Account SID: {TWILIO_ACCOUNT_SID[:10]}..." if TWILIO_ACCOUNT_SID else "Not configured")
    print(f"Twilio WhatsApp Number: {TWILIO_WHATSAPP_NUMBER}")
    print("\n✅ Module loaded successfully!")
