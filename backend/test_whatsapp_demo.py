"""
Quick Demo: How WhatsApp Report Sending Works
This demonstrates the complete flow without needing a running webhook server
"""

from twilio.rest import Client
import os
from dotenv import load_dotenv

# Load your credentials
load_dotenv()

def send_demo_report():
    """
    This function shows EXACTLY what happens when a report is sent
    """
    
    print("\n" + "="*60)
    print("📱 WHATSAPP REPORT SENDING DEMO")
    print("="*60)
    
    # Step 1: Get Twilio credentials from .env
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    twilio_whatsapp = os.getenv('TWILIO_WHATSAPP_NUMBER')
    
    print("\n✅ Step 1: Loaded Twilio credentials")
    print(f"   Account SID: {account_sid[:10]}...")
    print(f"   WhatsApp Number: {twilio_whatsapp}")
    
    # Step 2: Create Twilio client
    client = Client(account_sid, auth_token)
    print("\n✅ Step 2: Connected to Twilio")
    
    # Step 3: Prepare sample report (this is what your system generates)
    sample_report = """
🏥 *Medical Report Ready*

👤 *Patient:* Demo Patient
📅 *Age:* 45 | *Gender:* Male
🆔 *Report ID:* DEMO-001

📋 *X-Ray Analysis Results:*

*Findings:*
• Chest X-ray shows clear lung fields
• No signs of pleural effusion
• Heart size within normal limits
• No acute abnormalities detected

*Impression:*
Normal chest radiograph. No immediate concerns.

*Recommendation:*
Continue routine follow-up as scheduled.

---
✅ *Status:* Report reviewed and approved
📞 *Questions?* Reply to this message anytime!
    """.strip()
    
    print("\n✅ Step 3: Prepared report message")
    print(f"\n{'-'*60}")
    print("📄 REPORT CONTENT:")
    print(f"{'-'*60}")
    print(sample_report)
    print(f"{'-'*60}")
    
    # Step 4: Get recipient's phone number (YOUR number from sandbox)
    print("\n\n📱 Step 4: Who should receive this report?")
    print("   (Enter the phone number that you used to join the sandbox)")
    print("   Format: +91XXXXXXXXXX (with country code)")
    
    recipient = input("\n   Your WhatsApp number: ").strip()
    
    if not recipient.startswith('+'):
        recipient = '+91' + recipient.lstrip('0')  # Assume India if no code
    
    print(f"\n✅ Will send to: {recipient}")
    
    # Step 5: Send the message
    print("\n📤 Step 5: Sending report via WhatsApp...")
    
    try:
        message = client.messages.create(
            from_=twilio_whatsapp,
            body=sample_report,
            to=f'whatsapp:{recipient}'
        )
        
        print("\n" + "="*60)
        print("🎉 SUCCESS! REPORT SENT!")
        print("="*60)
        print(f"✅ Message SID: {message.sid}")
        print(f"✅ Status: {message.status}")
        print(f"✅ Sent to: {recipient}")
        print("\n📱 Check your WhatsApp now - you should see the report!")
        print("\n💬 TRY THIS: Reply with a question like:")
        print("   'What does this report mean?'")
        print("   'Do I need any follow-up?'")
        print("\n   (Note: AI responses need webhook server running)")
        
    except Exception as e:
        print("\n❌ ERROR sending message:")
        print(f"   {str(e)}")
        print("\n🔍 Troubleshooting:")
        print("   1. Make sure your number is still connected to sandbox")
        print("   2. Check if your Auth Token in .env is correct")
        print("   3. Ensure the phone number format is: +91XXXXXXXXXX")

if __name__ == "__main__":
    try:
        send_demo_report()
    except KeyboardInterrupt:
        print("\n\n❌ Demo cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
