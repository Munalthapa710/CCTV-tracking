@echo off
echo ============================================
echo  Smart Indoor Person Tracking System
echo  Quick Start Script
echo ============================================
echo.

echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9 or higher from python.org
    pause
    exit /b 1
)
echo OK: Python found
echo.

echo [2/5] Setting up Backend...
cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit backend\.env and update:
    echo   - DATABASE_URL with your PostgreSQL credentials
    echo   - SECRET_KEY with a random 32+ character string
    echo.
)

cd ..
echo.

echo [3/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18.x or higher from nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js found
echo.

echo [4/5] Setting up Frontend...
cd frontend

if not exist node_modules (
    echo Installing Node.js dependencies...
    call npm install
)

cd ..
echo.

echo [5/5] Setup Complete!
echo.
echo ============================================
echo  Next Steps:
echo ============================================
echo.
echo 1. Make sure PostgreSQL is running
echo 2. Create database: CREATE DATABASE cctv_tracking;
echo 3. Edit backend\.env with your database credentials
echo.
echo To start the application:
echo.
echo   Backend (Terminal 1):
echo     cd backend
echo     venv\Scripts\activate
echo     python -m uvicorn app.main:app --reload
echo.
echo   Frontend (Terminal 2):
echo     cd frontend
echo     npm run dev
echo.
echo Then open: http://localhost:3000
echo ============================================
echo.
pause
