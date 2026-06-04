@echo off
cd /d "%~dp0"

echo Starting Warehouse ERP...
echo Project folder: %cd%
echo.

if not exist "node.exe" (
  echo Missing node.exe in project folder.
  echo Please contact the maintainer.
  pause
  exit /b 1
)

start "Warehouse ERP Server" cmd /k "node.exe server.js"
timeout /t 3 /nobreak >nul
start "" msedge "http://localhost:3000"

echo.
echo If Edge does not open, visit: http://localhost:3000
echo Keep the "Warehouse ERP Server" window open while using the system.
pause
