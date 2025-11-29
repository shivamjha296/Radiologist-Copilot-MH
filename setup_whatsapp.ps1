# 📱 WhatsApp Integration - Quick Start Script

Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "📱 Radiologist Copilot - WhatsApp Integration Setup"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.template" ".env"
    Write-Host "✅ Created .env file. Please edit it with your credentials." -ForegroundColor Green
    Write-Host ""
}

# Check Python
Write-Host "🐍 Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.9+." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing WhatsApp dependencies..."
Write-Host "   - twilio (WhatsApp API)"
Write-Host "   - google-generativeai (AI responses)"
Write-Host "   - flask (Webhook server)"
Write-Host ""

$install = Read-Host "Install now? (Y/n)"
if ($install -ne "n" -and $install -ne "N") {
    python -m pip install twilio google-generativeai openai flask
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "🔧 Configuration Checklist"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""

Write-Host "1. ✏️  Edit .env file and add:"
Write-Host "   - TWILIO_ACCOUNT_SID"
Write-Host "   - TWILIO_AUTH_TOKEN"
Write-Host "   - TWILIO_WHATSAPP_NUMBER"
Write-Host "   - GEMINI_API_KEY (optional, for better AI)"
Write-Host ""

Write-Host "2. 🗄️  Update database schema:"
Write-Host "   Run: mysql -u root -p medical_ner < backend/schema_update.sql"
Write-Host "   Or manually execute SQL from WHATSAPP_SETUP.md"
Write-Host ""

Write-Host "3. 🚀 Start webhook server:"
Write-Host "   cd backend"
Write-Host "   python webhook_server.py"
Write-Host ""

Write-Host "4. 🌐 Expose with ngrok:"
Write-Host "   ngrok http 5000"
Write-Host "   Then configure Twilio webhook with the ngrok URL"
Write-Host ""

Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "📚 Documentation"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""
Write-Host "📖 Full setup guide: WHATSAPP_SETUP.md"
Write-Host "🔗 Twilio Console: https://console.twilio.com"
Write-Host "🔑 Get Gemini API: https://makersuite.google.com/app/apikey"
Write-Host ""

Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "🧪 Quick Test"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""

$test = Read-Host "Test WhatsApp service configuration? (Y/n)"
if ($test -ne "n" -and $test -ne "N") {
    Write-Host ""
    Write-Host "Testing configuration..." -ForegroundColor Cyan
    python -c "from backend.whatsapp_service import get_twilio_client; print('✅ Twilio configured!') if get_twilio_client() else print('❌ Twilio not configured')"
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure .env with your Twilio credentials"
Write-Host "2. Update database schema"
Write-Host "3. Start webhook server: python backend/webhook_server.py"
Write-Host "4. Run ngrok: ngrok http 5000"
Write-Host "5. Configure Twilio webhook URL"
Write-Host ""
Write-Host "📱 Reports will then be auto-sent to patients via WhatsApp!"
Write-Host ""
