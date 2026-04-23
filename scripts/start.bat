@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Book Editor - Starting Services
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

cd /d "%PROJECT_DIR%"

if not exist "backend\node_modules" (
    echo [1/2] Installing backend dependencies...
    cd /d "%PROJECT_DIR%\backend"
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo.
)

if not exist "frontend\node_modules" (
    echo [2/2] Installing frontend dependencies...
    cd /d "%PROJECT_DIR%\frontend"
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo.
)

echo Starting Backend on port 3001...
cd /d "%PROJECT_DIR%\backend"
start "BookEditor-Backend" cmd /k "title BookEditor-Backend && npm run dev"

timeout /t 2 /nobreak > nul

echo Starting Frontend on port 5173...
cd /d "%PROJECT_DIR%\frontend"
start "BookEditor-Frontend" cmd /k "title BookEditor-Frontend && npm run dev"

echo.
echo ========================================
echo Services started:
echo   - Backend: http://localhost:3001
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo Closing this window will NOT stop the services.
echo To stop: close the Backend and Frontend windows,
echo          or run scripts\stop.bat
echo.
echo Press any key to exit...
pause > nul
endlocal