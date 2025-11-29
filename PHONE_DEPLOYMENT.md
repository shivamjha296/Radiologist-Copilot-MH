# Phone Number Field Addition - Deployment Guide

## ✅ Changes Made

### 1. Updated `backend/models.py`

**Patient Model:**
```python
phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True,
                                                      comment="Patient contact number")
```

**Report Model:**
```python
radiologist_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True,
                                                           comment="Radiologist contact number")
```

### 2. Created Migration Script
- **File:** `backend/migrate_add_phone_numbers.py`
- **Purpose:** Add phone number columns to existing database
- **Features:** 
  - Adds `phone_number` to patients table
  - Adds `radiologist_phone` to reports table
  - Creates indexes for efficient searches
  - Safe for existing data (nullable columns)

---

## 🚀 Deployment Steps

### **Step 1: Run Migration Locally (Test)**
```powershell
cd c:\College_projects\MumbaiHacks\Radiologist-Copilot-MH
python backend/migrate_add_phone_numbers.py
```

When prompted, type `yes` to continue.

**Expected Output:**
```
✅ phone_number column added to patients
✅ radiologist_phone column added to reports
✅ Indexes created
✅ MIGRATION COMPLETED SUCCESSFULLY!
```

### **Step 2: Test Locally**
Start backend server:
```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Test patient creation with phone number:
```python
# Example API call (use Postman/cURL)
POST http://localhost:8000/patients
{
  "mrn": "MRN123456",
  "name": "John Doe",
  "age": 45,
  "gender": "Male",
  "phone_number": "+1-555-0100"
}
```

### **Step 3: Commit Changes to Git**
```powershell
cd c:\College_projects\MumbaiHacks\Radiologist-Copilot-MH
git add backend/models.py backend/migrate_add_phone_numbers.py PHONE_DEPLOYMENT.md
git commit -m "Add phone number fields for patients and radiologists"
git push origin main
```

### **Step 4: Deploy to Render**

#### Option A: Automatic Deployment (if enabled)
- Render will automatically detect the push and redeploy
- Monitor deployment at: https://dashboard.render.com

#### Option B: Manual Deployment
1. Go to https://dashboard.render.com
2. Select your backend service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for build to complete (~2-5 minutes)

### **Step 5: Run Migration on Production Database**

**Option A: Using Render Shell (Recommended)**
1. Go to Render Dashboard → Your Web Service
2. Click **"Shell"** tab
3. Run migration:
```bash
python backend/migrate_add_phone_numbers.py
# Type 'yes' when prompted
```

**Option B: Using Local Connection to Production DB**
```powershell
# Ensure DATABASE_URL in .env points to Render production
python backend/migrate_add_phone_numbers.py
```

### **Step 6: Verify Production Deployment**

Test health endpoint:
```powershell
curl https://your-app.onrender.com/health
```

Test with phone number:
```powershell
curl -X POST https://your-app.onrender.com/patients \
  -H "Content-Type: application/json" \
  -d '{
    "mrn": "TEST001",
    "name": "Test Patient",
    "age": 30,
    "gender": "Male",
    "phone_number": "+1-555-0123"
  }'
```

### **Step 7: Update Frontend (Optional)**

If you want to collect phone numbers in the UI, update patient forms:

**Example: `frontend/src/pages/Patients.jsx`**
```jsx
// Add phone input field
<input
  type="tel"
  name="phone_number"
  placeholder="Phone Number"
  pattern="[+]?[0-9]{1,4}[-\s]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}"
  className="w-full px-4 py-2 border rounded"
/>
```

---

## 🔍 Verification Checklist

- [ ] Migration script runs without errors locally
- [ ] Phone number field accepts valid phone formats
- [ ] Existing patients/reports still load correctly
- [ ] Git changes committed and pushed
- [ ] Render deployment successful (green status)
- [ ] Production migration executed successfully
- [ ] API endpoints return phone numbers in responses
- [ ] Frontend forms updated (if applicable)

---

## 📋 Database Schema Changes

### Before Migration
```sql
-- patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    mrn VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id),
    radiologist_name VARCHAR(200) NOT NULL,
    full_text TEXT NOT NULL,
    ...
);
```

### After Migration
```sql
-- patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    mrn VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20),  -- ✅ NEW
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_patients_phone ON patients(phone_number);  -- ✅ NEW

-- reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id),
    radiologist_name VARCHAR(200) NOT NULL,
    radiologist_phone VARCHAR(20),  -- ✅ NEW
    full_text TEXT NOT NULL,
    ...
);
CREATE INDEX idx_reports_radiologist_phone ON reports(radiologist_phone);  -- ✅ NEW
```

---

## 🛠️ Troubleshooting

### Issue: "column already exists"
**Solution:** Migration script checks for existing columns - safe to re-run

### Issue: "relation does not exist"
**Solution:** Tables don't exist yet. Run `init_db()` first or create tables

### Issue: Render deployment fails
**Solution:** Check build logs in Render dashboard for specific errors

### Issue: Frontend can't submit phone numbers
**Solution:** Ensure API endpoint accepts `phone_number` in request body

---

## 📞 Phone Number Format Recommendations

### Recommended Format
- International: `+1-555-0100`
- National: `(555) 123-4567`
- Simple: `5551234567`

### Validation Regex (Optional)
```python
import re

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    pattern = r'^[+]?[0-9]{1,4}[-\s]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}$'
    return bool(re.match(pattern, phone))
```

---

## ⚡ Quick Command Reference

```powershell
# 1. Run migration locally
python backend/migrate_add_phone_numbers.py

# 2. Test backend
uvicorn backend.main:app --reload

# 3. Commit and push
git add .
git commit -m "Add phone number fields"
git push origin main

# 4. Check Render deployment status
# Visit: https://dashboard.render.com

# 5. Run migration on production (via Render Shell)
python backend/migrate_add_phone_numbers.py
```

---

## ✅ Summary

**Changes:**
- ✅ Added `phone_number` to Patient model (VARCHAR(20), nullable)
- ✅ Added `radiologist_phone` to Report model (VARCHAR(20), nullable)
- ✅ Created migration script with indexes
- ✅ Backward compatible (existing data preserved)

**Next Actions:**
1. Run `migrate_add_phone_numbers.py` locally
2. Test locally
3. Commit and push to GitHub
4. Wait for Render auto-deployment
5. Run migration on production database
6. Update frontend forms (optional)

**Status:** Ready to deploy! 🚀
