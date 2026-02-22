@echo off
setlocal

echo ===================================================
echo   Installing Portable Postgres Tools...
echo ===================================================
echo.

:: URL for 15.x binaries (Version 15 is compatible with most)
set PG_URL=https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64-binaries.zip
set ZIP_FILE=pg_tools.zip
set EXTRACT_DIR=pg_bin

if exist %EXTRACT_DIR%\pgsql\bin\pg_dump.exe (
    echo [OK] Tools already installed in %EXTRACT_DIR%.
    goto :FINISHED
)

echo [1/3] Downloading PostgreSQL binaries (approx 200MB)...
echo       Please wait...
curl -L -o %ZIP_FILE% %PG_URL%

if %errorlevel% neq 0 (
    echo [ERROR] Download failed.
    pause
    exit /b
)

echo [2/3] Extracting files...
tar -xf %ZIP_FILE%

if %errorlevel% neq 0 (
    echo [ERROR] Extraction failed.
    pause
    exit /b
)

echo [3/3] Cleaning up...
del %ZIP_FILE%

:FINISHED
echo.
echo [SUCCESS] psql.exe and pg_dump.exe are ready!
echo           Location: %~dp0%EXTRACT_DIR%\pgsql\bin
echo.
pause
