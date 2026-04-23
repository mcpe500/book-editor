@echo off
echo ========================================
echo Book Editor - Starting Frontend & Backend
echo ========================================
echo.

echo [1/2] Starting Backend on port 3001...
cd /d "%~dp0..\backend"
start "BookEditor-Backend" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend on port 5173...
cd /d "%~dp0..\frontend"
start "BookEditor-Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Services starting:
echo   - Backend: http://localhost:3001
echo   - Frontend: http://localhost:5173
echo ========================================
echo Press any key to exit...
pause > nul