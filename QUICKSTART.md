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
- Or create a local account from `http://localhost:3001/register`

## Main Workflow

1. Open `http://localhost:3001/login`
2. Sign in with the static admin credentials
3. Go to **Add Employee**
4. Capture at least 5 webcam face samples
5. Save the employee
6. Go to **Find Employee**
7. Select the employee and let the page sync the camera grid
8. Click **Find**
9. Review saved detections and snapshots on **Tracking History**

## Camera Management

- Open `http://localhost:3001/cameras` to add, edit, test, disable, or delete cameras
- Default browser camera slots are created only on first startup:
  - `cam-a` -> Room A
  - `cam-b` -> Room B
  - `cam-c` -> Room C
- Network cameras can use HTTP, MJPEG, or RTSP URLs that OpenCV can open
- Camera frames are synced to the FastAPI backend every 2 seconds.
- The backend processes the latest frames using InsightFace when available and falls back to OpenCV-based embeddings if needed.

## Tracking History

- Open `http://localhost:3001/tracking` to review recent detections
- Every successful match stores:
  - employee identity
  - camera and location
  - similarity score
  - timestamp
  - saved snapshot frame when preview data is available

## Storage

- Database: `backend\employee_finder.db`
- Employee preview images: `backend\data\previews\`
- Detection snapshots: `backend\data\snapshots\`

## Notes

- No PostgreSQL setup is required.
- SQLite is used for users, employees, embeddings, cameras, and tracking events.
- The backend seeds the default camera slots only when the camera table is empty.
