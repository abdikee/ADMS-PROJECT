# ============================================
# Apply ID Range Updates to Database
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating Student and Teacher ID Ranges" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database credentials
$dbUser = "abdike"
$dbPassword = "abdike@3132"
$dbName = "sams_db"

Write-Host "Connecting to database: $dbName" -ForegroundColor Yellow
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "update-id-ranges.sql"

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Executing SQL script: update-id-ranges.sql" -ForegroundColor Yellow
Write-Host ""

# Execute the SQL script
try {
    # Use mysql command to execute the script
    $mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    
    if (Test-Path $mysqlPath) {
        & $mysqlPath -u $dbUser -p"$dbPassword" -D $dbName -e "source $sqlFile"
    } else {
        # Try system PATH
        mysql -u $dbUser -p"$dbPassword" -D $dbName -e "source $sqlFile"
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ ID ranges updated successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ID Ranges:" -ForegroundColor Cyan
    Write-Host "  Teachers: Start from 100001 (6 digits)" -ForegroundColor White
    Write-Host "  Students: Start from 200001 (6 digits)" -ForegroundColor White
    Write-Host "  Maximum:  999999999 (9 digits)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error updating ID ranges" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
