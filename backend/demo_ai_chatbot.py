"""
AI CHATBOT DEMO - Interactive Testing
Shows how the AI answers patient questions based on their medical report
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Mock patient data for demo
SAMPLE_PATIENT_DATA = {
    'id': 1,
    'name': 'Demo Patient',
    'age': 45,
    'gender': 'Male',
    'phone_number': '+919004206802',
    'report_content': """
    X-RAY CHEST PA VIEW
    
    CLINICAL INDICATION: Cough and fever for 3 days
    
    FINDINGS:
    • Right lower lobe shows patchy infiltrates
    • Mild bronchial wall thickening noted
    • No pleural effusion
    • Heart size within normal limits
    • Bony thorax unremarkable
    
    IMPRESSION:
    Right lower lobe pneumonia
    
    RECOMMENDATION:
    Antibiotic therapy as per clinical correlation
    Follow-up X-ray after treatment completion
    """
}

SAMPLE_CHAT_HISTORY = [
    {'message_from': 'ai', 'message_text': 'Your report has been sent. How can I help?'},
    {'message_from': 'patient', 'message_text': 'What is pneumonia?'},
    {'message_from': 'ai', 'message_text': 'Pneumonia is an infection of the lungs...'},
]


def demo_ai_chatbot():
    """Interactive demo of AI chatbot capabilities."""
    
    print("\n" + "="*70)
    print("🤖 AI MEDICAL CHATBOT - INTERACTIVE DEMO")
    print("="*70)
    
    print(f"\n📋 Patient Context Loaded:")
    print(f"   Name: {SAMPLE_PATIENT_DATA['name']}")
    print(f"   Diagnosis: Right lower lobe pneumonia")
    print(f"   Report includes findings, impressions, and recommendations")
    
    print("\n" + "-"*70)
    print("💬 CONVERSATION SIMULATION")
    print("-"*70)
    
    # Sample questions patients might ask
    sample_questions = [
        "What does right lower lobe pneumonia mean?",
        "Is this condition serious?",
        "What treatment will I need?",
        "Can I go to work?",
        "What foods should I avoid?",
        "When will I feel better?",
        "Do I need to get admitted to hospital?",
    ]
    
    print("\n📝 Common patient questions the AI can answer:\n")
    for i, q in enumerate(sample_questions, 1):
        print(f"   {i}. {q}")
    
    print("\n" + "-"*70)
    print("🧪 TEST THE AI CHATBOT")
    print("-"*70)
    
    # Check if API keys are available
    gemini_key = os.getenv('GEMINI_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')
    
    print("\n🔑 AI Provider Status:")
    if gemini_key and gemini_key != 'your_gemini_api_key_here':
        print("   ✅ Google Gemini API: ACTIVE (Best quality)")
        ai_provider = "Gemini"
    elif openai_key and openai_key != 'your_openai_key_here':
        print("   ✅ OpenAI GPT: ACTIVE (High quality)")
        ai_provider = "OpenAI"
    else:
        print("   ⚙️ Rule-Based AI: ACTIVE (No API key needed)")
        print("   💡 For better responses, add GEMINI_API_KEY to .env")
        ai_provider = "Rule-based"
    
    print(f"\n   Current Provider: {ai_provider}")
    
    print("\n" + "-"*70)
    
    while True:
        print("\n❓ Ask a question (or 'quit' to exit, 'examples' to see sample questions):")
        user_question = input("   You: ").strip()
        
        if user_question.lower() == 'quit':
            print("\n👋 Demo ended. Thanks for testing!")
            break
        
        if user_question.lower() == 'examples':
            print("\n📝 Example questions:\n")
            for i, q in enumerate(sample_questions, 1):
                print(f"   {i}. {q}")
            continue
        
        if not user_question:
            continue
        
        print("\n   🤖 AI is thinking...\n")
        
        try:
            # Import the actual AI function
            from whatsapp_service import generate_ai_response
            
            # Generate response using real AI
            response = generate_ai_response(
                patient_data=SAMPLE_PATIENT_DATA,
                user_question=user_question,
                chat_history=SAMPLE_CHAT_HISTORY
            )
            
            print(f"   AI Assistant: {response}\n")
            print("-"*70)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            print("\n   Using fallback response...")
            
            # Show fallback response
            from whatsapp_service import generate_fallback_response
            response = generate_fallback_response(user_question, SAMPLE_PATIENT_DATA)
            print(f"   AI Assistant: {response}\n")
            print("-"*70)


def show_gemini_setup():
    """Show how to get free Gemini API key."""
    print("\n" + "="*70)
    print("🌟 GET FREE GOOGLE GEMINI API KEY")
    print("="*70)
    
    print("""
Gemini is Google's most advanced AI - FREE for personal use!

✅ Benefits:
   • 60 requests per minute (FREE tier)
   • Best medical knowledge understanding
   • More accurate than rule-based responses
   • No credit card required

📝 How to get your key:

   1. Visit: https://makersuite.google.com/app/apikey
   
   2. Click "Create API Key"
   
   3. Copy the key
   
   4. Add to .env file:
      GEMINI_API_KEY=your_actual_key_here
   
   5. Restart the chatbot

That's it! The AI will automatically use Gemini for better responses.

⏱️  Takes less than 2 minutes!
    """)


if __name__ == "__main__":
    try:
        print("\n🤖 Welcome to AI Medical Chatbot Demo!\n")
        print("Options:")
        print("   1. Test the AI chatbot interactively")
        print("   2. How to get FREE Gemini API key")
        print("   3. View sample conversation")
        
        choice = input("\nSelect option (1-3): ").strip()
        
        if choice == '1':
            demo_ai_chatbot()
        elif choice == '2':
            show_gemini_setup()
        elif choice == '3':
            print("\n" + "="*70)
            print("📱 SAMPLE WHATSAPP CONVERSATION")
            print("="*70)
            print("""
Patient: Hi, I received my report. What does it say?

AI: Hello! Your chest X-ray report shows right lower lobe pneumonia. This 
means there's an infection in the lower part of your right lung. The report 
also noted some bronchial wall thickening, which is common with respiratory 
infections.

The good news is:
• No fluid around your lungs (no pleural effusion)
• Your heart size is normal
• Your bones look healthy

Your doctor will prescribe antibiotics to treat the infection. You'll need 
a follow-up X-ray after treatment to ensure it's cleared.

---

Patient: Is this serious? Will I need to be hospitalized?

AI: Pneumonia can range from mild to severe. Based on your report alone, 
I cannot determine the severity - that depends on your symptoms, oxygen 
levels, and overall health.

Most cases of pneumonia can be treated at home with:
• Oral antibiotics
• Rest
• Plenty of fluids
• Fever management

You may need hospitalization if you have:
• Difficulty breathing
• Very high fever
• Low oxygen levels
• Underlying health conditions

⚠️ Please discuss with your doctor who can assess your complete clinical 
picture and decide the best treatment plan for you.

---

Patient: What should I do now?

AI: Here's what you should do:

✅ Immediate steps:
1. Consult your doctor as recommended in the report
2. Get prescribed antibiotics and take them as directed
3. Rest and stay hydrated
4. Monitor your temperature
5. Avoid smoking and secondhand smoke

⚠️ Seek immediate medical attention if:
• Breathing becomes difficult
• High fever persists (>103°F)
• Chest pain worsens
• You feel confused or drowsy

📋 Follow-up:
• Complete the full course of antibiotics
• Schedule follow-up X-ray after treatment
• Return if symptoms don't improve in 2-3 days

Your doctor will provide personalized guidance based on your specific case.

---

Patient: Thank you! That's very helpful.

AI: You're welcome! I'm glad I could help clarify your report. 

Remember, I'm here 24/7 if you have more questions. Feel free to ask 
anything about your report or recovery process.

Take care and get well soon! 🏥
            """)
            print("="*70)
        else:
            print("Invalid option!")
            
    except KeyboardInterrupt:
        print("\n\n👋 Demo cancelled.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
