# 🚀 Render Deployment Guide

## Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Repository URL** - `https://github.com/shivamjha296/Radiologist-Copilot-MH`

---

## 🎯 Deployment Options

### Option 1: Blueprint Deployment (Recommended - One Click)

This deploys everything automatically using `render.yaml`.

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com

2. **Create New Blueprint**
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select repository: `shivamjha296/Radiologist-Copilot-MH`
   - Branch: `main`
   - Click "Apply"

3. **Wait for Deployment**
   - Render will create:
     - PostgreSQL database
     - Backend API service
     - Frontend static site
   - First deployment takes ~5-10 minutes

4. **Get Your URLs**
   - Frontend: `https://radiology-frontend.onrender.com`
   - Backend API: `https://radiology-backend.onrender.com`
   - Database: Internal connection string

---

### Option 2: Manual Deployment

#### Step 1: Deploy PostgreSQL Database

1. Go to Render Dashboard → "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `radiology-postgres`
   - **Database**: `radiology_db`
   - **User**: `admin`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free
3. Click "Create Database"
4. **Save the Internal Database URL** (found in database info page)

#### Step 2: Deploy Backend API

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `radiology-backend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: Free

4. **Add Environment Variables**:
   - `DATABASE_URL` = Your PostgreSQL Internal Database URL
   - `PYTHON_VERSION` = `3.11.0`

5. Click "Create Web Service"

#### Step 3: Initialize Database

After backend is deployed:

1. Go to backend service → "Shell" tab
2. Run:
   ```bash
   python init_db.py
   ```

#### Step 4: Deploy Frontend

1. Go to Render Dashboard → "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `radiology-frontend`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Publish Directory**: `frontend/dist`

4. **Add Environment Variables**:
   - `VITE_API_URL` = Your backend URL (e.g., `https://radiology-backend.onrender.com`)

5. Click "Create Static Site"

---

## 🔧 Configuration Files

### Frontend Environment

Update `frontend/.env.production`:

```env
VITE_API_URL=https://radiology-backend.onrender.com
```

### Backend Environment

Backend automatically uses `DATABASE_URL` from Render.

---

## 📊 Database Setup

After deployment, initialize the database:

```bash
# Option 1: Using Render Shell
# Go to backend service → Shell tab
python init_db.py

# Option 2: Using Render API
curl -X POST https://radiology-backend.onrender.com/api/init-db
```

---

## 🔍 Troubleshooting

### Backend Won't Start

**Issue**: Import errors or module not found

**Fix**: Ensure `backend/app/__init__.py` exists and `backend/app/main.py` has correct imports

```bash
# Check logs in Render dashboard
# Verify build command installed all dependencies
pip install -r backend/requirements.txt
```

### Database Connection Failed

**Issue**: Backend can't connect to PostgreSQL

**Fix**: 
1. Check `DATABASE_URL` environment variable
2. Ensure it's the **Internal Database URL** (not external)
3. Format: `postgresql://user:password@host:5432/database`

### Frontend API Calls Failing

**Issue**: CORS errors or 404 on API requests

**Fix**:
1. Update `VITE_API_URL` in frontend environment variables
2. Ensure backend CORS allows your frontend domain
3. Check backend is running: visit `https://radiology-backend.onrender.com/health`

### Free Tier Limitations

**Issue**: Service spins down after inactivity

**Solution**: 
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to paid plan ($7/month) for 24/7 uptime

---

## 🎨 Frontend Configuration

Update `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  baseURL: API_BASE_URL,
  // ... rest of your API config
};
```

---

## 📈 Monitoring

### Check Service Health

```bash
# Backend health
curl https://radiology-backend.onrender.com/health

# API status
curl https://radiology-backend.onrender.com/api/status
```

### View Logs

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Filter by error/warning

---

## 🔐 Security Recommendations

### Production Environment Variables

Add these to backend service:

```env
SECRET_KEY=<generate-strong-secret-key>
ALLOWED_ORIGINS=https://radiology-frontend.onrender.com
DATABASE_URL=<internal-database-url>
```

### Database Credentials

- Use environment variables (never hardcode)
- Enable SSL in production
- Rotate passwords regularly

---

## 💰 Cost Estimate

### Free Tier (All Services)
- **Database**: PostgreSQL - Free (1GB storage, shared CPU)
- **Backend**: Web Service - Free (750 hours/month, sleeps after 15min inactivity)
- **Frontend**: Static Site - Free (100GB bandwidth/month)
- **Total**: $0/month ⚠️ Services sleep when inactive

### Starter Plan (Recommended for Production)
- **Database**: $7/month (512MB RAM, 1GB storage)
- **Backend**: $7/month (512MB RAM, always on)
- **Frontend**: Free
- **Total**: $14/month (24/7 uptime)

---

## 🚀 Post-Deployment

### 1. Test Your Deployment

```bash
# Test backend
curl https://radiology-backend.onrender.com/health

# Test frontend
open https://radiology-frontend.onrender.com
```

### 2. Update README

Update your repository URLs:

```markdown
**Live Demo**: https://radiology-frontend.onrender.com
**API Docs**: https://radiology-backend.onrender.com/docs
```

### 3. Set Up Custom Domain (Optional)

1. Go to frontend service settings
2. Add custom domain
3. Update DNS records
4. Enable SSL (automatic)

---

## 📚 Useful Commands

```bash
# View backend logs
render logs radiology-backend

# Restart service
render restart radiology-backend

# Run shell commands
render shell radiology-backend
python init_db.py

# Update environment variable
render env:set DATABASE_URL=<new-url> -s radiology-backend
```

---

## 🆘 Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com

---

## ✅ Deployment Checklist

- [ ] GitHub repository is up to date
- [ ] `render.yaml` is in repository root
- [ ] Backend has `main.py` with health check endpoint
- [ ] Frontend build command is correct
- [ ] Environment variables are set
- [ ] Database is initialized
- [ ] Services are healthy (check `/health`)
- [ ] Frontend can reach backend API
- [ ] Test core functionality

---

**Your deployment is ready! 🎉**

Access your app at: `https://radiology-frontend.onrender.com`
