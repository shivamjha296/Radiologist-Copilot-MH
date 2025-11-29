# 🚀 DEPLOYMENT CHECKLIST - Phone Number Fields

## ✅ Local Changes (COMPLETED)
- ✅ Added `phone_number` to Patient model (VARCHAR(20), nullable)
- ✅ Added `radiologist_phone` to Report model (VARCHAR(20), nullable)  
- ✅ Created migration script (`migrate_add_phone_numbers.py`)
- ✅ Ran migration locally - SUCCESS
- ✅ Verified database columns created
- ✅ Committed changes to Git (commit: 77fe96d)
- ✅ Pushed to GitHub main branch

## 🔄 Production Deployment (TO DO)

### Step 1: Monitor Render Auto-Deployment
1. Visit: https://dashboard.render.com
2. Navigate to your **backend web service**
3. Check **"Events"** tab for deployment status
4. Wait for status to show **"Live"** (usually 2-5 minutes)

**Expected:**
- Build starts automatically after GitHub push
- Dependencies installed from `requirements.txt`
- Service restarts with new code

### Step 2: Run Migration on Production Database

**Option A: Via Render Shell (Recommended)**
1. Go to Render Dashboard → Your Web Service
2. Click **"Shell"** tab in the top menu
3. Run the migration command:
```bash
python backend/migrate_add_phone_numbers.py
```
4. Type `yes` when prompted
5. Wait for success message

**Option B: Via Local Terminal (Alternative)**
Ensure your `.env` has production DATABASE_URL:
```powershell
python backend/migrate_add_phone_numbers.py
```

### Step 3: Verify Production API

**Test Health Endpoint:**
```powershell
curl https://your-render-app-url.onrender.com/health
```

**Test Patient Creation with Phone Number:**
```powershell
curl -X POST https://your-render-app-url.onrender.com/patients `
  -H "Content-Type: application/json" `
  -d '{
    "mrn": "TEST_PHONE_001",
    "name": "Test Patient",
    "age": 30,
    "gender": "Male",
    "phone_number": "+1-555-0199"
  }'
```

**Test Get Patient (Should Return Phone Number):**
```powershell
curl https://your-render-app-url.onrender.com/patients
```

### Step 4: Update Frontend (Optional)

If you want to collect phone numbers in the UI:

1. Update patient registration form
2. Add phone input field with validation
3. Test form submission
4. Deploy frontend changes

---

## 📊 Database Changes Applied

### Production Migration Will Add:

```sql
-- Patient phone number
ALTER TABLE patients ADD COLUMN phone_number VARCHAR(20);
CREATE INDEX idx_patients_phone ON patients(phone_number);

-- Radiologist phone number  
ALTER TABLE reports ADD COLUMN radiologist_phone VARCHAR(20);
CREATE INDEX idx_reports_radiologist_phone ON reports(radiologist_phone);
```

---

## 🔍 Verification Steps

After deployment, verify:

- [ ] Render deployment shows "Live" status
- [ ] Migration script runs without errors on production
- [ ] Health endpoint responds successfully
- [ ] Can create patient with phone_number field
- [ ] Can create report with radiologist_phone field
- [ ] GET requests return phone numbers in response
- [ ] Existing patients/reports still load correctly
- [ ] No performance degradation

---

## 🛠️ Troubleshooting

### Issue: Render deployment fails
**Solution:** 
- Check build logs in Render dashboard
- Ensure `requirements.txt` is up to date
- Verify no syntax errors in Python files

### Issue: Migration says "column already exists"
**Solution:** 
- This is safe - migration script checks for existing columns
- Column was already added, no action needed

### Issue: Can't connect to Render Shell
**Solution:**
- Use Option B (local terminal with production DATABASE_URL)
- Ensure your IP is whitelisted in Render (if applicable)

### Issue: Phone number not appearing in API responses
**Solution:**
- Ensure migration ran successfully
- Check if API serializers include phone_number field
- Restart backend service in Render

---

## ⚡ Quick Commands Summary

```powershell
# 1. Check Render deployment status (web browser)
# Visit: https://dashboard.render.com

# 2. Run production migration (Render Shell)
python backend/migrate_add_phone_numbers.py

# 3. Test production API
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/patients

# 4. If issues, check logs (Render Dashboard)
# Navigate to: Service → Logs tab
```

---

## 📝 Notes

- Phone numbers are **nullable** (optional) - won't break existing data
- Indexes created for efficient phone number searches
- Format: VARCHAR(20) supports international formats like `+1-555-0100`
- Migration is **idempotent** - safe to run multiple times

---

## ✅ Final Checklist

- [ ] Render shows successful deployment
- [ ] Production migration completed
- [ ] API endpoints tested
- [ ] Phone numbers appearing in responses
- [ ] No errors in production logs
- [ ] Frontend updated (if needed)

**Status:** Local deployment complete ✅ | Production pending ⏳

---

**Next Action:** Go to https://dashboard.render.com and run migration in Shell!
