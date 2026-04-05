# Automatic Database Setup Script
# This script will attempt to create the database with common default passwords

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SAMS Database Auto Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add MySQL to PATH for this session
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.4\bin"

# Check if MySQL is accessible
try {
    $version = & mysql --version 2>&1
    Write-Host "✓ MySQL found: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ MySQL not found" -ForegroundColor Red
    Write-Host "Please ensure MySQL is installed" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "Attempting to connect to MySQL..." -ForegroundColor Yellow
Write-Host ""

# Try common default passwords
$passwords = @("", "root", "password", "admin", "mysql")
$connected = $false
$workingPassword = ""

foreach ($pwd in $passwords) {
    Write-Host "Trying password: $(if($pwd -eq ''){'{empty}'}else{'***'})" -ForegroundColor Gray
    
    if ($pwd -eq "") {
        $result = & mysql -u root -e "SELECT 1;" 2>&1
    } else {
        $env:MYSQL_PWD = $pwd
        $result = & mysql -u root -e "SELECT 1;" 2>&1
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
    
    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        $workingPassword = $pwd
        Write-Host "✓ Connected successfully!" -ForegroundColor Green
        break
    }
}

if (-not $connected) {
    Write-Host ""
    Write-Host "Could not connect with default passwords." -ForegroundColor Yellow
    Write-Host "Please enter your MySQL root password:" -ForegroundColor Cyan
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $workingPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Test the password
    $env:MYSQL_PWD = $workingPassword
    $result = & mysql -u root -e "SELECT 1;" 2>&1
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Invalid password" -ForegroundColor Red
        pause
        exit 1
    }
    $connected = $true
}

Write-Host ""
Write-Host "Creating database and importing schema..." -ForegroundColor Yellow

# Set password for mysql command
if ($workingPassword -ne "") {
    $env:MYSQL_PWD = $workingPassword
}

# Run the schema
$schemaPath = Join-Path $PSScriptRoot "schema.sql"
$output = & mysql -u root 2>&1 < $schemaPath

# Clean up
Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Database Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Details:" -ForegroundColor Cyan
    Write-Host "  Database Name: sams_db" -ForegroundColor White
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 3306" -ForegroundColor White
    Write-Host "  Tables: 21 tables created" -ForegroundColor White
    Write-Host "  Views: 4 views created" -ForegroundColor White
    Write-Host "  Procedures: 2 stored procedures" -ForegroundColor White
    Write-Host ""
    Write-Host "Default Admin Credentials:" -ForegroundColor Cyan
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host "  ⚠️  CHANGE THIS IN PRODUCTION!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verify Installation:" -ForegroundColor Cyan
    Write-Host "  mysql -u root -p" -ForegroundColor White
    Write-Host "  USE sams_db;" -ForegroundColor White
    Write-Host "  SHOW TABLES;" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Error creating database" -ForegroundColor Red
    Write-Host "Error output:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
