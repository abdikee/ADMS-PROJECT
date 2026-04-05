# Simple Database Creation Script
Write-Host "SAMS Database Setup" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Add MySQL to PATH
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.4\bin"

Write-Host "Enter MySQL root password (press Enter if no password):" -ForegroundColor Yellow
$password = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Creating database..." -ForegroundColor Yellow

$schemaPath = Join-Path $PSScriptRoot "schema.sql"

if ($plainPassword -eq "") {
    Get-Content $schemaPath | & mysql -u root
} else {
    $env:MYSQL_PWD = $plainPassword
    Get-Content $schemaPath | & mysql -u root
    Remove-Item Env:\MYSQL_PWD
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Database created" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database: sams_db" -ForegroundColor White
    Write-Host "Admin username: admin" -ForegroundColor White
    Write-Host "Admin password: admin123" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
    Write-Host "Please check your MySQL password" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
