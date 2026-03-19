# AI CCTV Employee Finder System

## Local Run

### Backend

```powershell
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```powershell
cd frontend
npm run dev
```

### Or use the existing launcher

```powershell
cd C:\Users\hp\CCTV
start.bat
```

## URLs

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:8001`
- API docs: `http://localhost:8001/api/docs`

## Login

- Username: `admin`
- Password: `admin123`

## Main Workflow

1. Open `http://localhost:3001/login`
2. Sign in with the static admin credentials
3. Go to **Add Employee**
4. Capture at least 5 webcam face samples
5. Save the employee
6. Go to **Find Employee**
7. Select the employee and let the page sync the camera grid
8. Click **Find**

## Camera Simulation

- The Find page uses one live webcam feed and transforms it into 3 simulated cameras:
  - `cam-a` -> Room A
  - `cam-b` -> Room B
  - `cam-c` -> Room C
- Camera frames are synced to the FastAPI backend every 2 seconds.
- The backend processes the latest frames using InsightFace when available and falls back to OpenCV-based embeddings if needed.

## Storage

- Database: `backend\employee_finder.db`
- Employee preview images: `backend\data\previews\`

## Notes

- No PostgreSQL setup is required.
- No database-backed authentication is required.
- The backend already seeds the 3 default cameras automatically.
