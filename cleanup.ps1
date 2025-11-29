# Cleanup Script for Radiologist-Copilot-MH
# Removes unnecessary files and directories

Write-Host "Starting cleanup..." -ForegroundColor Cyan

# Remove __pycache__ directories
Write-Host "`nRemoving __pycache__ directories..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" | ForEach-Object {
    Write-Host "  Deleting: $($_.FullName)" -ForegroundColor Gray
    Remove-Item -Path $_.FullName -Recurse -Force
}

# Remove debug files
Write-Host "`nRemoving debug files..." -ForegroundColor Yellow
$debugFiles = @(
    "debug_get_patients.py",
    "debug_rajesh.py",
    "debug_output.txt"
)
foreach ($file in $debugFiles) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove check/test files
Write-Host "`nRemoving check and test files..." -ForegroundColor Yellow
$testFiles = @(
    "check_ai_reports.py",
    "check_api.py",
    "check_cloudinary_config.py",
    "check_data.py",
    "check_report.py",
    "backend/test_cloudinary.py",
    "backend/test_whatsapp_demo.py"
)
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove backup files
Write-Host "`nRemoving backup files..." -ForegroundColor Yellow
$backupFiles = @(
    "backend/whatsapp_service_backup.py",
    "backend/temp_whatsapp.txt"
)
foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove old migration files (keep only the latest add_phone_column.py)
Write-Host "`nRemoving old migration files..." -ForegroundColor Yellow
$oldMigrations = @(
    "backend/migrate_add_phone_numbers.py",
    "backend/migrate_clean_and_add_phones.py"
)
foreach ($file in $oldMigrations) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove unused database files
Write-Host "`nRemoving unused database files..." -ForegroundColor Yellow
$unusedDbFiles = @(
    "backend/database_mysql.py",
    "backend/database_postgres.py"
)
foreach ($file in $unusedDbFiles) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove duplicate setup files
Write-Host "`nRemoving duplicate setup files..." -ForegroundColor Yellow
$duplicateFiles = @(
    "backend/FINAL_SETUP_GUIDE.py",
    "backend/SETUP_AI_CHATBOT.py",
    "inspect_db.py",
    "refinalize_report.py",
    "reset_db.py",
    "seed_db.py"
)
foreach ($file in $duplicateFiles) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove duplicate root files
Write-Host "`nRemoving duplicate root files..." -ForegroundColor Yellow
$rootDuplicates = @(
    "main.py",  # duplicate of backend/main.py
    "server.py",  # duplicate of backend/main.py or webhook_server.py
    "env"  # likely empty or duplicate
)
foreach ($file in $rootDuplicates) {
    if (Test-Path $file) {
        Write-Host "  Deleting: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# Remove cap.py files (unclear purpose)
Write-Host "`nRemoving unclear utility files..." -ForegroundColor Yellow
if (Test-Path "backend/cap.py") {
    Write-Host "  Deleting: backend/cap.py" -ForegroundColor Gray
    Remove-Item "backend/cap.py" -Force
}

# Remove empty Reports directory if it exists
Write-Host "`nChecking Reports directory..." -ForegroundColor Yellow
if (Test-Path "Reports") {
    $reportsContent = Get-ChildItem "Reports" -Recurse
    if ($reportsContent.Count -eq 0 -or ($reportsContent.Count -eq 1 -and $reportsContent[0].Name -eq "visualizations")) {
        Write-Host "  Reports directory is empty or contains only visualizations folder" -ForegroundColor Gray
        Write-Host "  (Keeping for future use)" -ForegroundColor Gray
    }
}

Write-Host "`nCleanup complete!" -ForegroundColor Green
Write-Host "`nRemaining important files:" -ForegroundColor Cyan
Write-Host "  - backend/main.py (FastAPI server)" -ForegroundColor Green
Write-Host "  - backend/models.py (Database models)" -ForegroundColor Green
Write-Host "  - backend/database.py (DB connection)" -ForegroundColor Green
Write-Host "  - backend/config.py (Configuration)" -ForegroundColor Green
Write-Host "  - backend/storage.py (Cloudinary)" -ForegroundColor Green
Write-Host "  - backend/whatsapp_service.py (WhatsApp integration)" -ForegroundColor Green
Write-Host "  - backend/webhook_server.py (Webhook handler)" -ForegroundColor Green
Write-Host "  - backend/add_phone_column.py (Phone migration)" -ForegroundColor Green
Write-Host "  - agent_graph/ (AI pipeline)" -ForegroundColor Green
Write-Host "  - frontend/ (React app)" -ForegroundColor Green
