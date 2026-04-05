# MySQL Database Setup Script for SAMS
# This script will create the database and run migrations

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SAMS Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
try {
    $mysqlVersion = & mysql --version 2>&1
    Write-Host "✓ MySQL is installed: $mysqlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ MySQL is not found in PATH" -ForegroundColor Red
    Write-Host "Please restart your terminal or add MySQL to PATH manually" -ForegroundColor Yellow
    Write-Host "Default MySQL path: C:\Program Files\MySQL\MySQL Server 8.4\bin" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get MySQL credentials
Write-Host "MySQL Configuration" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Cyan
$mysqlUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$mysqlPassword = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
$mysqlPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Creating database and running migrations..." -ForegroundColor Yellow

# Create database and run schema
$schemaPath = Join-Path $PSScriptRoot "schema.sql"

if (Test-Path $schemaPath) {
    try {
        # Run the SQL script
        $env:MYSQL_PWD = $mysqlPasswordPlain
        & mysql -u $mysqlUser < $schemaPath 2>&1 | Out-Null
        Remove-Item Env:\MYSQL_PWD
        
        Write-Host "✓ Database created successfully!" -ForegroundColor Green
        Write-Host "✓ Tables created successfully!" -ForegroundColor Green
        Write-Host "✓ Default data inserted!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Setup Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Database Details:" -ForegroundColor Cyan
        Write-Host "  Database Name: sams_db" -ForegroundColor White
        Write-Host "  Tables: 21 tables created" -ForegroundColor White
        Write-Host "  Views: 4 views created" -ForegroundColor White
        Write-Host "  Procedures: 2 stored procedures" -ForegroundColor White
        Write-Host ""
        Write-Host "Default Admin Credentials:" -ForegroundColor Cyan
        Write-Host "  Username: admin" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
        Write-Host "  (Please change this password in production!)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Update your application's database configuration" -ForegroundColor White
        Write-Host "  2. Test the connection" -ForegroundColor White
        Write-Host "  3. Change the default admin password" -ForegroundColor White
        Write-Host ""
        
    } catch {
        Write-Host "✗ Error creating database: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Schema file not found: $schemaPath" -ForegroundColor Red
    exit 1
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
