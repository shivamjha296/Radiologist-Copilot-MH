"""
Complete WhatsApp Integration Example
Demonstrates the full workflow from report generation to patient chat
"""

from whatsapp_service import (
    send_report_to_patient,
    send_welcome_message,
    handle_incoming_whatsapp_message
)
from database import store_to_mysql, get_patient_by_phone, get_chat_history

# ========================================
# EXAMPLE 1: Complete Patient Workflow
# ========================================

def example_complete_workflow():
    """
    Demonstrates the complete patient workflow:
    1. Generate report
    2. Store in database  
    3. Send via WhatsApp
    4. Patient asks questions
    5. AI responds
    """
    
    print("=" * 70)
    print("EXAMPLE 1: Complete Patient Workflow")
    print("=" * 70)
    
    # Step 1: Patient details from PDF or form
    patient_details = {
        'name': 'John Doe',
        'age': '45',
        'gender': 'Male',
        'phone_number': '+919876543210'  # Patient's WhatsApp number
    }
    
    # Step 2: Medical entities extracted from report
    medical_entities = [
        {'text': 'pneumonia', 'label': 'Disease_disorder', 'confidence': 0.95},
        {'text': 'chest X-ray', 'label': 'Diagnostic_procedure', 'confidence': 0.98},
        {'text': 'lower right lung', 'label': 'Biological_structure', 'confidence': 0.87}
    ]
    
    # Step 3: Full report content
    report_content = """
    RADIOLOGY REPORT
    
    Patient: John Doe
    Age: 45 | Gender: Male
    Study: Chest X-Ray PA View
    Date: November 29, 2025
    
    FINDINGS:
    - Opacity noted in the lower right lung field
    - Consistent with pneumonia
    - No pleural effusion
    - Heart size within normal limits
    
    IMPRESSION:
    Right lower lobe pneumonia
    
    RECOMMENDATIONS:
    - Antibiotic therapy
    - Follow-up X-ray in 2 weeks
    - Clinical correlation advised
    """
    
    # Step 4: Store to database
    print("\n📊 Storing report to database...")
    patient_id, report_id = store_to_mysql(
        patient=patient_details,
        entities=medical_entities,
        filename="Chest_Xray_John_Doe_Nov2025.pdf",
        report_content=report_content
    )
    print(f"✅ Stored - Patient ID: {patient_id}, Report ID: {report_id}")
    
    # Step 5: Send welcome message
    print(f"\n📱 Sending welcome message to {patient_details['phone_number']}...")
    success, result = send_welcome_message(
        patient_details['phone_number'],
        patient_details['name']
    )
    print(f"{'✅' if success else '❌'} Welcome message: {result}")
    
    # Step 6: Send report via WhatsApp
    print(f"\n📤 Sending report via WhatsApp...")
    success, message = send_report_to_patient(report_id)
    print(f"{'✅' if success else '❌'} {message}")
    
    print("\n" + "=" * 70)
    print("Patient will now receive:")
    print("1. Welcome message on WhatsApp")
    print("2. Complete medical report")
    print("3. Instructions to ask questions")
    print("=" * 70)


# ========================================
# EXAMPLE 2: Patient Asks Questions
# ========================================

def example_patient_questions():
    """
    Simulates patient asking questions about their report
    """
    
    print("\n\n" + "=" * 70)
    print("EXAMPLE 2: Patient Q&A via WhatsApp")
    print("=" * 70)
    
    patient_phone = "+919876543210"
    
    # Simulate incoming messages
    questions = [
        "What is pneumonia?",
        "Is this serious?",
        "What treatment do I need?",
        "When should I come for follow-up?"
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n--- Question {i} ---")
        print(f"👤 Patient: {question}")
        
        # Handle the question (this would normally come from Twilio webhook)
        success, response = handle_incoming_whatsapp_message(
            from_number=f"whatsapp:{patient_phone}",
            message_text=question
        )
        
        print(f"{'✅' if success else '❌'} AI Response sent!")
        
        # Show what the AI would have responded
        patient_data = get_patient_by_phone(patient_phone.replace('+', ''))
        if patient_data:
            chat = get_chat_history(patient_phone.replace('+', ''), limit=1)
            if chat:
                print(f"🤖 AI: {chat[-1]['message_text'][:200]}...")
    
    print("\n" + "=" * 70)


# ========================================
# EXAMPLE 3: Testing Without Database
# ========================================

def example_test_mode():
    """
    Test WhatsApp functionality without database
    (useful for initial setup testing)
    """
    
    print("\n\n" + "=" * 70)
    print("EXAMPLE 3: Test Mode (No Database)")
    print("=" * 70)
    
    from whatsapp_service import send_whatsapp_message
    
    test_phone = "+919876543210"
    test_message = """
🧪 TEST MESSAGE

This is a test message from Radiologist Copilot AI.

If you receive this, WhatsApp integration is working!

✅ Twilio configured correctly
✅ Phone number format valid
✅ Messages can be sent

You can now integrate with your medical reports system.
    """
    
    print(f"📤 Sending test message to {test_phone}...")
    success, result = send_whatsapp_message(test_phone, test_message)
    
    if success:
        print(f"✅ Success! Message SID: {result}")
        print("   Check your WhatsApp to confirm delivery")
    else:
        print(f"❌ Failed: {result}")
        print("   Check your Twilio credentials in .env")
    
    print("=" * 70)


# ========================================
# EXAMPLE 4: Batch Send Reports
# ========================================

def example_batch_send():
    """
    Send multiple reports to different patients
    """
    
    print("\n\n" + "=" * 70)
    print("EXAMPLE 4: Batch Send Reports")
    print("=" * 70)
    
    # List of reports to send
    reports_to_send = [
        {'report_id': 1, 'patient_name': 'John Doe'},
        {'report_id': 2, 'patient_name': 'Jane Smith'},
        {'report_id': 3, 'patient_name': 'Robert Johnson'},
    ]
    
    results = []
    
    for report in reports_to_send:
        print(f"\n📤 Sending report for {report['patient_name']}...")
        success, message = send_report_to_patient(report['report_id'])
        
        results.append({
            'patient': report['patient_name'],
            'success': success,
            'message': message
        })
        
        print(f"   {'✅' if success else '❌'} {message}")
    
    # Summary
    print("\n" + "-" * 70)
    print("SUMMARY:")
    success_count = sum(1 for r in results if r['success'])
    print(f"✅ Successful: {success_count}/{len(results)}")
    print(f"❌ Failed: {len(results) - success_count}/{len(results)}")
    print("=" * 70)


# ========================================
# EXAMPLE 5: Custom AI Prompt
# ========================================

def example_custom_ai_response():
    """
    Demonstrates how to customize AI responses
    """
    
    print("\n\n" + "=" * 70)
    print("EXAMPLE 5: Custom AI Response Configuration")
    print("=" * 70)
    
    print("""
To customize AI responses, edit whatsapp_service.py:

def generate_ai_response(patient_data, user_question, chat_history):
    # Example: Make responses more friendly
    prompt = f'''
    You are a friendly medical AI assistant named "MediBot".
    
    Patient Info:
    - Name: {patient_data['name']}
    - Report: {patient_data['report_content']}
    
    Guidelines:
    1. Use simple, non-technical language
    2. Be empathetic and reassuring
    3. Always remind them to consult their doctor
    4. Keep responses under 200 words
    
    Patient's Question: {user_question}
    
    Your friendly response:
    '''
    
    # Then use Gemini or OpenAI with this custom prompt
    """)
    
    print("=" * 70)


# ========================================
# MAIN EXECUTION
# ========================================

if __name__ == "__main__":
    print("\n")
    print("█" * 70)
    print("█  RADIOLOGIST COPILOT - WHATSAPP INTEGRATION EXAMPLES  █")
    print("█" * 70)
    
    print("\n⚠️  Prerequisites:")
    print("   - Twilio account configured in .env")
    print("   - Database schema updated")
    print("   - Webhook server running (for Example 2)")
    print("\n")
    
    examples = {
        '1': ('Complete Patient Workflow', example_complete_workflow),
        '2': ('Patient Q&A Simulation', example_patient_questions),
        '3': ('Test Mode (No Database)', example_test_mode),
        '4': ('Batch Send Reports', example_batch_send),
        '5': ('Custom AI Responses', example_custom_ai_response),
    }
    
    print("Select an example to run:")
    for key, (name, _) in examples.items():
        print(f"  {key}. {name}")
    print("  A. Run all examples")
    print("  Q. Quit")
    
    choice = input("\nYour choice: ").strip().upper()
    
    if choice == 'Q':
        print("\n👋 Goodbye!")
    elif choice == 'A':
        for name, func in examples.values():
            try:
                func()
            except Exception as e:
                print(f"❌ Error in {name}: {e}")
    elif choice in examples:
        name, func = examples[choice]
        try:
            func()
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("❌ Invalid choice")
    
    print("\n" + "█" * 70)
    print("█  END OF EXAMPLES  █")
    print("█" * 70)
    print("\n📚 For more info, see: WHATSAPP_SETUP.md")
    print("🔗 Twilio Console: https://console.twilio.com\n")
