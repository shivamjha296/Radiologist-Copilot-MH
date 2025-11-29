# 📱 WhatsApp Integration Setup Guide

## Overview
This guide helps you set up WhatsApp integration so medical reports are automatically sent to patients' phone numbers, and they can ask questions via WhatsApp chat with AI-powered responses.

---

## 🎯 Features

✅ **Automatic Report Delivery**
- Reports sent directly to patient's WhatsApp
- Formatted with patient details and findings
- Instant delivery when report is ready

✅ **AI-Powered Chat Support**
- 24/7 patient question answering
- Context-aware responses based on their report
- Medical terminology explained clearly
- Conversation history maintained

✅ **Multi-AI Support**
- Google Gemini AI (recommended)
- OpenAI GPT-3.5/4
- Fallback rule-based responses

---

## 📋 Prerequisites

### 1. Twilio Account (Free Trial Available)
- Sign up at: https://www.twilio.com/try-twilio
- Free trial includes $15 credit
- WhatsApp sandbox available instantly

### 2. Database
- MySQL (recommended) or SQLite
- Updated schema with phone number fields

### 3. Optional: AI API Keys
- **Google Gemini** (free tier): https://makersuite.google.com/app/apikey
- **OpenAI** (paid): https://platform.openai.com/api-keys

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```powershell
cd backend
pip install twilio google-generativeai openai flask
```

### Step 2: Configure Twilio

1. **Get Twilio Credentials**
   - Login to [Twilio Console](https://console.twilio.com/)
   - Copy your **Account SID** and **Auth Token**

2. **Join WhatsApp Sandbox** (for testing)
   - Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - Send the code to the sandbox number from your WhatsApp
   - Example: `join <your-sandbox-code>`

3. **Update `.env` file**

```bash
# Copy template
cp .env.template .env

# Edit .env and add:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional AI APIs
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
```

### Step 3: Update Database Schema

Run this SQL to add phone number support:

```sql
ALTER TABLE patients 
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE reports 
ADD COLUMN report_content TEXT,
ADD COLUMN sent_via_whatsapp BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20),
    patient_id INT,
    message_from VARCHAR(10),
    message_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

### Step 4: Start Webhook Server

```powershell
cd backend
python webhook_server.py
```

Server starts on: http://localhost:5000

### Step 5: Expose Webhook with ngrok

```powershell
# Install ngrok: https://ngrok.com/download
ngrok http 5000
```

Copy the HTTPS URL (e.g., `https://abcd1234.ngrok.io`)

### Step 6: Configure Twilio Webhook

1. Go to [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox)
2. Under "When a message comes in":
   - Paste: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`
   - Method: POST
3. Click "Save"

---

## 💻 Usage

### Sending Reports to Patients

```python
from whatsapp_service import send_report_to_patient

# Send report by ID (phone number from DB)
success, message = send_report_to_patient(
    report_id=123
)

# Send to specific phone number
success, message = send_report_to_patient(
    report_id=123,
    phone_number="+919876543210"
)
```

### Testing with API

```powershell
# Test endpoint
curl -X POST http://localhost:5000/test/send-report `
  -H "Content-Type: application/json" `
  -d '{"report_id": 1, "phone_number": "+919876543210"}'
```

### Patient Workflow

1. **Doctor uploads report** with patient's phone number
2. **Report auto-sent** to WhatsApp immediately
3. **Patient receives** formatted report on WhatsApp
4. **Patient asks questions** by replying to the message
5. **AI responds** with context-aware answers
6. **Conversation saved** in database for reference

---

## 📱 Phone Number Format

Supported formats:
- `+919876543210` (E.164 format - recommended)
- `9876543210` (auto-converts to +91 India)
- `+14155238886` (US format)

The system automatically formats to WhatsApp-compatible format: `whatsapp:+<country_code><number>`

---

## 🤖 AI Response Configuration

### Priority Order:
1. **Google Gemini** (if `GEMINI_API_KEY` set)
2. **OpenAI GPT** (if `OPENAI_API_KEY` set)
3. **Fallback Rules** (always available)

### Customizing AI Behavior

Edit `whatsapp_service.py`:

```python
def generate_ai_response(patient_data, user_question, chat_history):
    # Customize prompt here
    prompt = f"""You are a helpful medical AI assistant.
    Be clear, compassionate, and accurate...
    """
```

---

## 🔒 Security Best Practices

1. **Validate Twilio Requests**
   ```python
   from twilio.request_validator import RequestValidator
   # Add validation to webhook
   ```

2. **Use HTTPS** (required by Twilio)
   - ngrok provides HTTPS by default
   - For production: use proper SSL certificates

3. **Environment Variables**
   - Never commit `.env` to git
   - Use `.env.template` for reference

4. **Rate Limiting**
   - Implement rate limits on webhook
   - Monitor Twilio usage

---

## 📊 Monitoring & Debugging

### Check Webhook Logs

```powershell
# Webhook server logs
python webhook_server.py
```

### Twilio Console
- View message logs: https://console.twilio.com/us1/monitor/logs/messages
- Check webhook errors
- Monitor usage and costs

### Database Logs

```sql
-- Check sent reports
SELECT * FROM reports WHERE sent_via_whatsapp = TRUE;

-- View chat history
SELECT * FROM whatsapp_chats ORDER BY created_at DESC LIMIT 50;

-- Patient with most messages
SELECT phone_number, COUNT(*) as msg_count 
FROM whatsapp_chats 
GROUP BY phone_number 
ORDER BY msg_count DESC;
```

---

## 🐛 Troubleshooting

### Messages Not Sending

1. **Check Twilio credentials** in `.env`
2. **Verify phone number format**
3. **Confirm Twilio balance** (trial credit remaining)
4. **Check ngrok is running** and webhook URL is correct

### AI Not Responding

1. **Verify API keys** (Gemini or OpenAI)
2. **Check API quota** (Gemini has daily limits)
3. **Review logs** for errors
4. **Test fallback responses** (should always work)

### Webhook Errors

1. **Check ngrok connection**: visit `http://localhost:4040`
2. **Verify Flask server** is running
3. **Test with curl**: 
   ```powershell
   curl http://localhost:5000/health
   ```

---

## 💰 Cost Estimation

### Twilio WhatsApp (as of 2024)
- **Free Trial**: $15 credit
- **WhatsApp Messages**:
  - Outbound (Business-initiated): ~$0.005-0.02 per message
  - Inbound (User-initiated): Free
- **Estimated**: ~500-1000 reports on free trial

### AI APIs
- **Google Gemini**: Free tier (60 requests/min)
- **OpenAI GPT-3.5**: ~$0.002 per conversation
- **Fallback**: Free (rule-based)

---

## 🚀 Production Deployment

### 1. Replace ngrok with Production Server
- Deploy Flask app to cloud (Heroku, AWS, Azure)
- Use proper domain with SSL
- Set webhook URL in Twilio

### 2. Upgrade Twilio Account
- Add payment method
- Request WhatsApp Business API access (optional)
- Get dedicated WhatsApp number

### 3. Scale Considerations
- Use message queues (RabbitMQ, Celery)
- Implement caching (Redis)
- Add monitoring (Sentry, DataDog)

---

## 📚 Example Conversation

**System → Patient:**
```
🏥 Medical Report Ready

Dear John Doe,
Your medical report is now available.

👤 Patient Details:
• Name: John Doe
• Age: 45
• Gender: Male

📋 Report: Chest_X-Ray_Nov_2025.pdf

Findings: No acute abnormalities detected...

💬 Have questions about your report?
Simply reply to this message!
```

**Patient → System:**
```
What does "no acute abnormalities" mean?
```

**AI → Patient:**
```
"No acute abnormalities" is good news! It means:

✅ No immediate or urgent concerns detected
✅ No signs of active infection or injury  
✅ Lungs and heart appear normal in the X-ray

This indicates your chest X-ray looks healthy. However:
• Continue routine checkups
• Inform your doctor of any symptoms
• Follow their recommendations

Have more questions? Feel free to ask!
```

---

## 📞 Support

**Issues?**
- Check logs in webhook server
- Review Twilio message logs
- Test with `/health` and `/test/send-report` endpoints

**Need Help?**
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Gemini AI: https://ai.google.dev/docs
- Project Issues: Create GitHub issue

---

## ✅ Checklist

- [ ] Twilio account created
- [ ] WhatsApp sandbox activated
- [ ] `.env` file configured
- [ ] Database schema updated
- [ ] Dependencies installed
- [ ] Webhook server running
- [ ] ngrok exposing webhook
- [ ] Twilio webhook URL configured
- [ ] Test message sent successfully
- [ ] Patient can ask questions

---

**🎉 You're all set! Reports will now be sent to patients via WhatsApp with AI chat support.**
