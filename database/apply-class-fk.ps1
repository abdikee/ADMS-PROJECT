# Apply class-teacher foreign key constraint
Write-Host "Applying database migration..." -ForegroundColor Cyan

# Common MySQL installation paths
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp\bin\mysql\mysql8.0.27\bin\mysql.exe"
)

# Find MySQL executable
$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "Found MySQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "MySQL not found in common locations. Please run this SQL manually:" -ForegroundColor Red
    Write-Host "File: add-class-teacher-fk.sql" -ForegroundColor Yellow
    exit 1
}

# Execute the SQL file
$sqlFile = Join-Path $PSScriptRoot "add-class-teacher-fk.sql"
try {
    Get-Content $sqlFile | & $mysqlExe -u abdike "-pabdike@3132" sams_db
    Write-Host "Migration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error applying migration: $_" -ForegroundColor Red
    exit 1
}
