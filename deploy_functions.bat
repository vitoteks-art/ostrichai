@echo off
setlocal

echo ===================================================
echo     Supabase Edge Functions Deployer (Self-Hosted)
echo ===================================================
echo.
echo This script will copy your local Edge Functions to your 
echo Self-Hosted Supabase server on Easypanel.
echo.

:: ---------------------------------------------------
:: CONFIGURATION
:: ---------------------------------------------------
:: Replace with your server's IP address
set /p SERVER_IP="Enter your Server IP Address (e.g., 123.45.67.89): "

:: Replace with the path where the 'edge-runtime' or 'functions' volume is mounted on the server.
:: For many Easypanel setups, this is inside /etc/supabase/functions or similar.
:: You might need to check your Docker Compose or Easypanel "Mounts" section.
set SERVER_DEST_PATH=/etc/easypanel/projects/supabase/supabase/code/supabase/code/volumes/functions

:: SSH User (usually root for Easypanel/VPS)
set SSH_USER=root

:: ---------------------------------------------------
:: DEPLOYMENT
:: ---------------------------------------------------
echo.
echo [INFO] Deploying functions from: .\supabase\functions\
echo [INFO] To server: %SSH_USER%@%SERVER_IP%:%SERVER_DEST_PATH%
echo.

:: using scp to copy the files recursively
:: Note: we copy the directory itself to ensure hidden files like .env are included
scp -r .\supabase\functions %SSH_USER%@%SERVER_IP%:%SERVER_DEST_PATH%\..

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Deployment failed. 
    echo Please check:
    echo 1. Your Server IP and SSH credentials.
    echo 2. That you have SSH access enabling on the server.
    echo 3. The destination path on the server exists.
    pause
    exit /b
)

echo.
echo [SUCCESS] Files transferred!
echo.
echo [NOTE] You may need to restart the 'Functions' or 'Edge Runtime' service
echo        in Easypanel for changes to take effect immediately.
echo.
pause
