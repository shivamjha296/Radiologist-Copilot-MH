# ==============================================================================
# 🏥 RADIOLOGIST'S COPILOT - DATABASE SETUP SCRIPT
# ==============================================================================
# One-click initialization for PostgreSQL + pgvector + Sample Data
# Platform: Windows PowerShell
# ==============================================================================

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  RADIOLOGY DATABASE - ONE-CLICK SETUP" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ==============================================================================
# STEP 1: Pre-flight Checks
# ==============================================================================
Write-Host "[1/5] Running pre-flight checks..." -ForegroundColor Yellow

# Check Docker
Write-Host "  Checking Docker installation..." -NoNewline
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK ($dockerVersion)" -ForegroundColor Green
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker daemon
Write-Host "  Checking Docker daemon..." -NoNewline
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Running" -ForegroundColor Green
    } else {
        throw "Docker daemon not running"
    }
} catch {
    Write-Host " NOT RUNNING" -ForegroundColor Red
    Write-Host ""
    Write-Host "  ERROR: Docker Desktop is not running" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and wait for it to fully start" -ForegroundColor Yellow
    Write-Host "  Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Python
Write-Host "  Checking Python installation..." -NoNewline
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK ($pythonVersion)" -ForegroundColor Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Python 3.9+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ==============================================================================
# STEP 2: Install Python Dependencies
# ==============================================================================
Write-Host "[2/5] Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "  Installing: sqlalchemy, psycopg2-binary, pgvector, pydantic"

pip install --quiet sqlalchemy psycopg2-binary pgvector pydantic 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  Warning: Some packages may have failed to install" -ForegroundColor Yellow
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# ==============================================================================
# STEP 3: Start Docker Containers
# ==============================================================================
Write-Host "[3/5] Starting Docker containers..." -ForegroundColor Yellow

# Clean up existing containers if needed
Write-Host "  Stopping any existing containers..."
docker-compose down 2>$null | Out-Null

Write-Host "  Pulling pgvector/pgvector:pg16 image..."
docker-compose pull 2>$null

Write-Host "  Starting PostgreSQL + pgAdmin..."
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Containers started successfully" -ForegroundColor Green
} else {
    Write-Host "  Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ==============================================================================
# STEP 4: Wait for PostgreSQL
# ==============================================================================
Write-Host "[4/5] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow

$maxRetries = 20
$retryCount = 0
$ready = $false

while ($retryCount -lt $maxRetries -and -not $ready) {
    $retryCount++
    Write-Host "  Attempt $retryCount/$maxRetries..." -NoNewline
    
    Start-Sleep -Seconds 2
    
    $result = docker exec radiology_postgres pg_isready -U admin -d radiology_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Connected!" -ForegroundColor Green
        $ready = $true
    } else {
        Write-Host " Waiting..." -ForegroundColor Yellow
    }
}

if (-not $ready) {
    Write-Host ""
    Write-Host "  ERROR: PostgreSQL failed to start within 40 seconds" -ForegroundColor Red
    Write-Host "  Check Docker logs: docker-compose logs db" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ==============================================================================
# STEP 5: Initialize Database
# ==============================================================================
Write-Host "[5/5] Initializing database schema and seeding data..." -ForegroundColor Yellow
Write-Host ""

python init_db.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Access pgAdmin:" -ForegroundColor Cyan
    Write-Host "    URL:      http://localhost:5050" -ForegroundColor White
    Write-Host "    Email:    admin@admin.com" -ForegroundColor White
    Write-Host "    Password: admin" -ForegroundColor White
    Write-Host ""
    Write-Host "  Database Connection:" -ForegroundColor Cyan
    Write-Host "    Host:     localhost:5432" -ForegroundColor White
    Write-Host "    Database: radiology_db" -ForegroundColor White
    Write-Host "    Username: admin" -ForegroundColor White
    Write-Host "    Password: radpass" -ForegroundColor White
    Write-Host ""
    Write-Host "  Sample Data Loaded:" -ForegroundColor Cyan
    Write-Host "    1 Patient (Yash M. Patel)" -ForegroundColor White
    Write-Host "    1 Chest X-Ray Scan" -ForegroundColor White
    Write-Host "    1 Complete Radiology Report" -ForegroundColor White
    Write-Host "    5 Medical NER Entities" -ForegroundColor White
    Write-Host "    1536-dim Vector Embedding" -ForegroundColor White
    Write-Host ""
    Write-Host "  Next Steps:" -ForegroundColor Cyan
    Write-Host "    1. Open pgAdmin to explore the database" -ForegroundColor White
    Write-Host "    2. Run sample queries from DATABASE_SETUP.md" -ForegroundColor White
    Write-Host "    3. Start building your FastAPI endpoints" -ForegroundColor White
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "  SETUP FAILED" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  The database initialization script encountered an error." -ForegroundColor Yellow
    Write-Host "  Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Common fixes:" -ForegroundColor Cyan
    Write-Host "    - Ensure all Python packages are installed" -ForegroundColor White
    Write-Host "    - Check Docker logs: docker-compose logs db" -ForegroundColor White
    Write-Host "    - Try restarting: docker-compose restart" -ForegroundColor White
    Write-Host ""
    exit 1
}
