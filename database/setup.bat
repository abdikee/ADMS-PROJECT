@echo off
echo ========================================
echo SAMS Database Setup
echo ========================================
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL not found in PATH
    echo.
    echo Please add MySQL to your PATH or restart your terminal
    echo Default location: C:\Program Files\MySQL\MySQL Server 8.4\bin
    echo.
    pause
    exit /b 1
)

echo [OK] MySQL found
echo.

REM Get MySQL credentials
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

echo.
echo Creating database and running migrations...
echo.

REM Run the schema
mysql -u %MYSQL_USER% -p < schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Setup Complete!
    echo ========================================
    echo.
    echo Database Details:
    echo   Database Name: sams_db
    echo   Tables: 21 tables created
    echo   Views: 4 views created
    echo   Procedures: 2 stored procedures
    echo.
    echo Default Admin Credentials:
    echo   Username: admin
    echo   Password: admin123
    echo   [WARNING] Change this password in production!
    echo.
    echo Next Steps:
    echo   1. Update your application's database configuration
    echo   2. Test the connection
    echo   3. Change the default admin password
    echo.
) else (
    echo.
    echo [ERROR] Failed to create database
    echo Please check your MySQL credentials and try again
    echo.
)

pause
