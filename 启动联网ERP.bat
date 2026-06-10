@echo off
cd /d "%~dp0"

echo Starting Warehouse ERP...
echo Project folder: %cd%
echo.

set "NODE_CMD="
if exist "%~dp0node.exe" (
  set "NODE_CMD=%~dp0node.exe"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Missing Node.js.
    echo Please install Node.js first, then run this file again.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
  )
  set "NODE_CMD=node"
)

start "Warehouse ERP Server" /D "%~dp0" cmd /k ""%NODE_CMD%" "%~dp0server.js""
timeout /t 3 /nobreak >nul
start "" msedge "http://localhost:3000"

echo.
echo If Edge does not open, visit: http://localhost:3000
echo Keep the "Warehouse ERP Server" window open while using the system.
pause
