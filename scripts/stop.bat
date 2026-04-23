@echo off
echo ========================================
echo Book Editor - Stopping Services
echo ========================================
echo.

echo Stopping frontend and backend services...
taskkill /FI "WINDOWTITLE eq BookEditor-*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Book Editor*" /F > nul 2>&1

:: Also kill any node processes running on our ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /PID %%a /F > nul 2>&1
)

echo.
echo All Book Editor services stopped.
echo.
pause