"""
COMPLETE AI CHATBOT SETUP GUIDE
Step-by-step instructions to get context-aware AI working
"""

print("""
╔════════════════════════════════════════════════════════════════════╗
║       🤖 AI CHATBOT SETUP - COMPLETE CONFIGURATION GUIDE          ║
╔════════════════════════════════════════════════════════════════════╝

The AI chatbot is ALREADY BUILT! You just need to connect it to your database
so it can read patient reports and provide context-aware answers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CURRENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ WhatsApp integration code: COMPLETE
✅ AI chatbot code: COMPLETE
✅ Twilio credentials: CONFIGURED
✅ WhatsApp sandbox: CONNECTED
✅ Can send reports: WORKING (you received test report!)

⚠️  Database connection: NOT CONFIGURED
⚠️  AI context: CANNOT READ REPORTS (missing DB password)
⚠️  Database schema: NEEDS UPDATE (missing new fields)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 STEP 1: UPDATE YOUR .env FILE (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The .env file is OPEN in your editor right now.

1. Find this line:
   MYSQL_PASSWORD=your_password_here

2. Replace with your actual MySQL password:
   MYSQL_PASSWORD=YourActualPassword123

3. (Optional but HIGHLY recommended) Get FREE Gemini API key:
   
   a) Visit: https://aistudio.google.com/apikey
   
   b) Click "Create API Key"
   
   c) Copy the key and add to .env:
      GEMINI_API_KEY=AIzaSy...your_key_here
   
   ⭐ This gives you MUCH better AI responses (FREE tier: 60 req/min)

4. Save the .env file (Ctrl+S)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  STEP 2: UPDATE DATABASE SCHEMA (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The AI needs new fields in your database to work properly.

Option A - Using MySQL Workbench (RECOMMENDED):
────────────────────────────────────────────────
1. Open MySQL Workbench

2. Connect to your 'medical_ner' database

3. Go to Query tab

4. Copy and run this SQL:

   -- Add phone number to patients table
   ALTER TABLE patients 
   ADD COLUMN phone_number VARCHAR(20) AFTER gender;

   -- Add report content and WhatsApp status to reports table
   ALTER TABLE reports 
   ADD COLUMN report_content TEXT,
   ADD COLUMN sent_via_whatsapp BOOLEAN DEFAULT FALSE;

   -- Create chat history table
   CREATE TABLE IF NOT EXISTS whatsapp_chats (
       id INT AUTO_INCREMENT PRIMARY KEY,
       phone_number VARCHAR(20),
       patient_id INT,
       message_from VARCHAR(10),
       message_text TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
   );

5. Click Execute (⚡ icon)

6. Verify - you should see:
   ✅ 3 queries executed successfully


Option B - Using phpMyAdmin:
─────────────────────────────
1. Open phpMyAdmin in browser
2. Select 'medical_ner' database
3. Click SQL tab
4. Paste the SQL above
5. Click Go

Option C - Using Command Line (if mysql installed):
────────────────────────────────────────────────────
1. Open PowerShell
2. Run: mysql -u root -p medical_ner
3. Enter your password
4. Paste the SQL above
5. Type: exit


⚠️  IMPORTANT: You MUST complete this step or the AI won't work!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 STEP 3: TEST DATABASE CONNECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After updating .env and database, run this command:

   cd backend
   python -c "from database import get_db_connection; conn = get_db_connection(); print('✅ Database connected!'); conn.close()"

Expected output:
   ✅ Database connected!

If you see an error:
   ❌ Check MYSQL_PASSWORD in .env is correct
   ❌ Ensure MySQL service is running
   ❌ Verify database 'medical_ner' exists

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STEP 4: ADD SAMPLE PATIENT DATA (for testing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run this to create a test patient with report (uses YOUR phone number):

   cd backend
   python test_create_patient.py

This will:
   ✅ Create a sample patient in database
   ✅ Add a complete medical report
   ✅ Link it to your WhatsApp number (+919004206802)
   ✅ Allow AI to read report when you ask questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 STEP 5: START THE WEBHOOK SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This server receives messages from WhatsApp and triggers AI responses:

   cd backend
   python webhook_server.py

You should see:
   ✅ WhatsApp Webhook Server Started!
   ✅ Listening on: http://localhost:5000
   ✅ Ready to receive messages

Keep this terminal window open!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 STEP 6: EXPOSE WEBHOOK WITH NGROK (in new terminal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ngrok creates a public URL so Twilio can reach your local server:

1. Download ngrok: https://ngrok.com/download

2. Open NEW PowerShell terminal

3. Run: ngrok http 5000

4. You'll see output like:
   Forwarding: https://abc123.ngrok.io -> http://localhost:5000

5. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

Keep this terminal open too!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  STEP 7: CONFIGURE TWILIO WEBHOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tell Twilio where to send incoming WhatsApp messages:

1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

2. Scroll to "Sandbox Configuration"

3. Find "WHEN A MESSAGE COMES IN" field

4. Enter: https://abc123.ngrok.io/webhook/whatsapp
   (Replace abc123 with your ngrok URL)

5. Click Save

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 STEP 8: TEST THE COMPLETE SYSTEM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open WhatsApp on your phone

2. Send a message to: +1 415 523 8886
   
   Try: "What does my report say?"
   Or: "Is pneumonia serious?"
   Or: "What treatment do I need?"

3. Within seconds, the AI should reply with:
   ✅ Context from YOUR medical report
   ✅ Personalized answer to your question
   ✅ Relevant medical advice

4. Watch your terminal - you'll see:
   📥 Incoming message received
   🤖 AI generating response
   📤 Response sent to WhatsApp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 HOW THE COMPLETE FLOW WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Patient X-ray analyzed → Report generated
2. Stored in MySQL with phone_number + report_content
3. whatsapp_service.py sends report to patient's WhatsApp ✅
4. Patient receives report on phone ✅
5. Patient asks: "What does pneumonia mean?"
6. Twilio forwards message to your webhook (via ngrok)
7. webhook_server.py receives message
8. Fetches patient data + report from database
9. generate_ai_response() creates answer using Gemini AI
10. Response sent back to patient's WhatsApp ✅
11. Conversation saved to whatsapp_chats table

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 QUICK TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Start with Steps 1-3 to get database working
✅ Get Gemini API key for MUCH better AI responses (it's FREE!)
✅ Test database connection before proceeding
✅ Keep webhook server and ngrok running in separate terminals
✅ Ngrok URL changes each time you restart (free tier)
✅ For production, use paid ngrok or deploy to cloud server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to start? Begin with STEP 1 (update .env file) - it's already open!

""")
