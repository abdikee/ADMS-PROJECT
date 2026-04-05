@echo off
REM ============================================
REM Apply ID Range Updates to Database
REM ============================================

echo ========================================
echo Updating Student and Teacher ID Ranges
echo ========================================
echo.

REM Database credentials
set DB_USER=abdike
set DB_PASSWORD=abdike@3132
set DB_NAME=sams_db

echo Connecting to database: %DB_NAME%
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
set SQL_FILE=%SCRIPT_DIR%update-id-ranges.sql

REM Check if SQL file exists
if not exist "%SQL_FILE%" (
    echo Error: SQL file not found: %SQL_FILE%
    pause
    exit /b 1
)

echo Executing SQL script: update-id-ranges.sql
echo.

REM Try to find MySQL
set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"

if exist %MYSQL_PATH% (
    %MYSQL_PATH% -u %DB_USER% -p%DB_PASSWORD% -D %DB_NAME% < "%SQL_FILE%"
) else (
    mysql -u %DB_USER% -p%DB_PASSWORD% -D %DB_NAME% < "%SQL_FILE%"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Success: ID ranges updated!
    echo ========================================
    echo.
    echo ID Ranges:
    echo   Teachers: Start from 100001 (6 digits^)
    echo   Students: Start from 200001 (6 digits^)
    echo   Maximum:  999999999 (9 digits^)
    echo.
) else (
    echo.
    echo ========================================
    echo Error: Failed to update ID ranges
    echo ========================================
    echo.
)

pause
