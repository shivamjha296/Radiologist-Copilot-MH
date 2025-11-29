"""
Flask Webhook Server for WhatsApp Integration  
Handles incoming messages from Twilio WhatsApp
"""
from flask import Flask, request, jsonify
from twilio.twiml.messaging_response import MessagingResponse
import os
from dotenv import load_dotenv

load_dotenv()

# Import WhatsApp service (which now uses database_mysql)
try:
    from whatsapp_service import handle_incoming_whatsapp_message, send_report_to_patient
    from database_mysql import get_report_by_id
except ImportError as e:
    print(f"⚠️ Import warning: {e}")
    print("Make sure whatsapp_service.py exists and database_mysql.py is configured")

app = Flask(__name__)

@app.route('/webhook/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """Handle incoming WhatsApp messages from Twilio."""
    try:
        # Get message details from Twilio
        from_number = request.form.get('From', '')
        message_body = request.form.get('Body', '')
        
        print(f"📨 Received message from {from_number}: {message_body}")
        
        # Process the message and get AI response
        # The response is sent within handle_incoming_whatsapp_message
        success, result_msg = handle_incoming_whatsapp_message(from_number, message_body)
        
        # Return empty TwiML response (we already sent the message)
        response = MessagingResponse()
        
        if not success:
            # If there was an error, send error message
            response.message("Sorry, I encountered an error. Please try again later.")
        
        print(f"✅ {result_msg}")
        return str(response)
    
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        response = MessagingResponse()
        response.message("Sorry, something went wrong. Please try again later.")
        return str(response)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "WhatsApp Webhook Server"}, 200


@app.route('/test/send-report', methods=['POST'])
def test_send_report():
    """Test endpoint to manually send a report."""
    try:
        from whatsapp_service import send_report_to_patient
        
        report_id = request.json.get('report_id')
        phone_number = request.json.get('phone_number')
        
        if not report_id:
            return {"error": "report_id is required"}, 400
        
        success, message = send_report_to_patient(report_id, phone_number)
        
        if success:
            return {"success": True, "message": message}, 200
        else:
            return {"success": False, "error": message}, 500
    
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == '__main__':
    port = int(os.environ.get('WEBHOOK_PORT', 5000))
    print("=" * 60)
    print("🚀 WhatsApp Webhook Server Starting...")
    print("=" * 60)
    print(f"📍 Webhook URL: http://localhost:{port}/webhook/whatsapp")
    print(f"💚 Health Check: http://localhost:{port}/health")
    print(f"🧪 Test Endpoint: http://localhost:{port}/test/send-report")
    print("=" * 60)
    print("\n⚠️  For production, use ngrok or similar to expose this webhook")
    print("   Command: ngrok http 5000")
    print("   Then configure Twilio webhook with the ngrok URL")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=port)
