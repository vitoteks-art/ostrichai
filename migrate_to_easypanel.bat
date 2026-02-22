@echo off
setlocal

echo ===================================================
echo     Supabase Migration Script (Local)
echo ===================================================
echo.
echo This script uses local portable tools to migrate your data.
echo.

:: ---------------------------------------------------
:: PATH CONFIGURATION
:: ---------------------------------------------------
set PG_BIN=.\pgsql\bin

if not exist "%PG_BIN%\pg_dump.exe" (
    echo [ERROR] Postgres tools not found.
    echo Please run 'install_pg_tools.bat' first!
    pause
    exit /b
)

:: ---------------------------------------------------
:: DESTINATION CONFIGURATION
:: ---------------------------------------------------
set DEST_HOST=supabase.getostrichai.com
set DEST_PORT=5432
set DEST_USER=postgres
set DEST_DB=postgres
set DEST_PASSWORD=your-super-secret-and-long-postgres-password

:: ---------------------------------------------------
:: SOURCE CONFIGURATION (Stockholm Pooler)
:: ---------------------------------------------------
echo.
echo Please enter your OLD Managed Supabase Database Password.
echo Project: wmpwqotfncymoswctrqo (Stockholm Region)
set /p SOURCE_PASSWORD="Old DB Password: "

:: Correct keys from Screenshot (EU North 1)
set SOURCE_HOST=aws-0-eu-north-1.pooler.supabase.com
set SOURCE_PORT=5432
set SOURCE_USER=postgres.wmpwqotfncymoswctrqo
set SOURCE_DB=postgres

echo.
echo ===================================================
echo 1. TESTING CONNECTION
echo ===================================================
echo Connecting to Old Database (IPv6/IPv4)...
echo.
set PGPASSWORD=%SOURCE_PASSWORD%
"%PG_BIN%\psql.exe" -h %SOURCE_HOST% -p %SOURCE_PORT% -U %SOURCE_USER% -d %SOURCE_DB% -c "SELECT 1 as connected;" 

if %errorlevel% neq 0 (
    echo [ERROR] Connection Failed. 
    echo Your internet connection might not support IPv6.
    echo If this fails, you MUST find the 'Pooler Hostname' in your Dashboard.
    pause
    exit /b
)
echo [OK] Connected!

echo.
echo ===================================================
echo 2. MIGRATING DATA (Direct Pipe)
echo ===================================================
echo Streaming data from Old -> New...
echo This avoids saving a huge file locally.

set PGPASSWORD=%SOURCE_PASSWORD%
"%PG_BIN%\pg_dump.exe" -h %SOURCE_HOST% -p %SOURCE_PORT% -U %SOURCE_USER% -d %SOURCE_DB% --clean --if-exists --quote-all-identifiers --exclude-schema "auth" --exclude-schema "storage" --no-owner --no-privileges | ^
set PGPASSWORD=%DEST_PASSWORD%&& "%PG_BIN%\psql.exe" -h %DEST_HOST% -p %DEST_PORT% -U %DEST_USER% -d %DEST_DB%

if %errorlevel% neq 0 (
    echo [ERROR] Migration failed.
    pause
    exit /b
)

echo.
echo ===================================================
echo [SUCCESS] Migration Finished!
echo ===================================================
pause
