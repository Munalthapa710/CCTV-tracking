@echo off
echo ============================================
echo  Starting Smart Indoor Person Tracking System
echo ============================================
echo.

echo Starting Backend Server...
start "CCTV Backend" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "CCTV Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo  Application Starting...
echo ============================================
echo.
echo Backend:  http://localhost:8001
echo API Docs: http://localhost:8001/api/docs
echo Frontend: http://localhost:3001
echo.
echo Press any key to exit this window
echo (The application will continue running)
pause >nul
