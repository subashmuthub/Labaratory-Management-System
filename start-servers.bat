@echo off
echo Starting Laboratory Management System...
echo.

echo Killing any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Starting Backend Server...
start "LabMS Backend" cmd /k "cd /d "%~dp0zbackend" && echo Backend Starting... && node server.js"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend Server...
start "LabMS Frontend" cmd /k "cd /d "%~dp0frontend" && echo Frontend Starting... && npm run dev"

echo.
echo ================================================
echo   Laboratory Management System Started!
echo ================================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173 (check terminal for actual port)
echo ================================================
echo.
echo Press any key to close this window...
pause >nul