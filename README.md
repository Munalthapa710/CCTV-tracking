# 🎯 Smart Indoor Person Tracking System

A full-stack application for real-time indoor person tracking using CCTV cameras and face recognition technology.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Pages](#frontend-pages)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [Security & Privacy](#security--privacy)

---

## ✨ Features

### Core Features
- **Real-time Face Recognition**: Detect and recognize faces from multiple CCTV cameras
- **Multi-Camera Support**: Manage multiple IP cameras with RTSP streams
- **Live Location Tracking**: Track person's current location in real-time
- **Movement History**: View historical movement data for any person
- **User Management**: Register users with face images for recognition
- **Camera Management**: Add, edit, and manage CCTV cameras
- **Search Functionality**: Search for persons by name

### Technical Features
- **Debounced Tracking**: Avoid duplicate updates within configurable time windows
- **Multi-threaded Processing**: Process multiple camera streams simultaneously
- **Cosine Similarity**: Optimized face comparison using embedding similarity
- **JWT Authentication**: Secure API access with token-based auth
- **Dark Mode UI**: Modern, eye-friendly dark theme interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Face Recognition**: InsightFace + OpenCV
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### AI/ML
- **Face Detection**: RetinaFace (via InsightFace)
- **Face Recognition**: ArcFace embeddings (512-dim)
- **Similarity**: Cosine similarity

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Dashboard│ │  Users   │ │ Cameras  │ │  Search  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Auth   │ │  Users   │ │ Cameras  │ │ Tracking │       │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                            │                                 │
│  ┌─────────────────────────┴─────────────────────────┐     │
│  │              Services Layer                        │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ User Service │  │Camera Service│               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │Face Service  │  │Track Engine  │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQLAlchemy
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Users   │ │FaceEmbeddings│ │ Cameras  │ │Tracking  │  │
│  │          │ │              │ │          │ │  Logs    │  │
│  └──────────┘ └──────────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ RTSP Streams
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CCTV IP Cameras                           │
│     Camera 1        Camera 2        Camera 3        ...     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

### Required Software
- **Python**: 3.9 or higher
- **Node.js**: 18.x or higher
- **PostgreSQL**: 13.x or higher
- **Git**: For version control

### Hardware Requirements
- **CPU**: 4+ cores recommended (8+ for multiple cameras)
- **RAM**: 8GB minimum (16GB recommended)
- **GPU**: Optional but recommended for faster face recognition (NVIDIA with CUDA)
- **Storage**: 10GB free space minimum

---

## 📥 Installation

### Step 1: Clone/Setup Project Structure

The project is already created in the `CCTV` folder with the following structure:

```
CCTV/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # SQLAlchemy models & Pydantic schemas
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── face_recognition/ # Face detection & recognition
│   │   └── main.py         # FastAPI application entry
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/                # Next.js app directory
    ├── components/         # React components
    ├── lib/                # API client & utilities
    ├── package.json
    └── .env.local
```

### Step 2: Setup PostgreSQL Database

1. Install PostgreSQL from https://www.postgresql.org/download/

2. Create the database:
```bash
# Using psql command line
psql -U postgres
CREATE DATABASE cctv_tracking;
\q

# Or using pgAdmin, create a new database named 'cctv_tracking'
```

### Step 3: Setup Backend

```bash
cd CCTV\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env with your database credentials
```

### Step 4: Setup Frontend

```bash
cd CCTV\frontend

# Install dependencies
npm install

# Copy environment file (already created)
# Edit .env.local if your API URL is different
```

---

## ⚙️ Configuration

### Backend Configuration (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cctv_tracking

# Security (CHANGE THIS IN PRODUCTION!)
SECRET_KEY=your-super-secret-key-min-32-characters-long

# Application
DEBUG=True
APP_NAME=Smart Indoor Person Tracking System

# Face Recognition
FACE_DETECTION_THRESHOLD=0.5
FACE_RECOGNITION_THRESHOLD=0.6
FACE_DEBOUNCE_SECONDS=30

# Tracking
PROCESS_FRAME_INTERVAL=1.5
MAX_CAMERAS=16
```

### Frontend Configuration (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🚀 Running the Application

### Start Backend Server

```bash
cd CCTV\backend
venv\Scripts\activate  # Activate virtual environment
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start at: **http://localhost:8000**
API Documentation: **http://localhost:8000/api/docs**

### Start Frontend Server

Open a new terminal:

```bash
cd CCTV\frontend
npm run dev
```

The frontend will start at: **http://localhost:3000**

### Access the Application

1. Open browser and go to: **http://localhost:3000**
2. You'll be redirected to the login page
3. Use any email to login (demo mode creates user automatically)
4. Start by registering users with face images
5. Add your CCTV cameras with RTSP URLs
6. View real-time tracking on the dashboard

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with credentials |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/` | Create user with face images |
| GET | `/api/users/` | Get all users |
| GET | `/api/users/{id}` | Get user by ID |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |
| POST | `/api/users/{id}/faces` | Add face images to user |

### Cameras

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cameras/` | Add new camera |
| GET | `/api/cameras/` | Get all cameras |
| GET | `/api/cameras/{id}` | Get camera by ID |
| PUT | `/api/cameras/{id}` | Update camera |
| DELETE | `/api/cameras/{id}` | Delete camera |
| POST | `/api/cameras/{id}/toggle` | Toggle camera status |

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracking/person/{id}/location` | Get person's current location |
| GET | `/api/tracking/persons/active` | Get all active persons |
| GET | `/api/tracking/person/{id}/history` | Get person's movement history |
| GET | `/api/tracking/search?q=name` | Search person by name |
| GET | `/api/tracking/statistics` | Get tracking statistics |
| GET | `/api/tracking/logs` | Get recent tracking logs |

---

## 🖥️ Frontend Pages

### 1. Login Page (`/login`)
- Email/password authentication
- Demo mode for testing

### 2. Register Page (`/register`)
- User registration with face images
- Upload 1-5 clear face photos

### 3. Dashboard (`/dashboard`)
- Real-time tracking overview
- Statistics cards
- Currently tracked persons
- Auto-refresh every 30 seconds

### 4. Users Page (`/users`)
- List all registered users
- Add/delete users
- Manage face data

### 5. Cameras Page (`/cameras`)
- Add/manage CCTV cameras
- Configure RTSP streams
- Toggle camera status

### 6. Search Page (`/search`)
- Search persons by name
- View current location
- View movement history

---

## 📖 Usage Guide

### 1. Register a User

1. Go to **Register** page or click "Add User"
2. Fill in name, email, and department
3. Upload 1-5 clear face photos (front-facing, good lighting)
4. Click "Create Account"
5. User is now registered with face embeddings

### 2. Add a Camera

1. Go to **Cameras** page
2. Click "Add Camera"
3. Enter camera details:
   - **Name**: Descriptive name (e.g., "Main Entrance")
   - **Location**: Physical location (e.g., "Building A - Floor 1")
   - **RTSP URL**: Camera stream URL
4. Check "Active" to start tracking immediately
5. Click "Add Camera"

### 3. View Tracking

1. Go to **Dashboard**
2. View currently tracked persons
3. See their current location and last seen time
4. Data auto-refreshes every 30 seconds

### 4. Search for a Person

1. Go to **Search** page
2. Enter person's name
3. View current location and movement history

---

## 🔧 Troubleshooting

### Backend Issues

**Database Connection Error**
```
Solution: Check DATABASE_URL in .env file
- Verify PostgreSQL is running
- Check username/password
- Ensure database 'cctv_tracking' exists
```

**Face Recognition Not Working**
```
Solution: 
- Ensure insightface is installed: pip install insightface
- Download ONNX model (first run auto-downloads)
- Check if images have detectable faces
```

**Camera Stream Not Working**
```
Solution:
- Verify RTSP URL is correct
- Test URL in VLC player: Media > Open Network Stream
- Check camera is accessible on network
- Ensure firewall allows RTSP (port 554)
```

### Frontend Issues

**API Connection Error**
```
Solution:
- Ensure backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in .env.local
- Clear browser cache and restart dev server
```

**Login Not Working**
```
Solution:
- Check browser console for errors
- Verify backend auth endpoint is working
- Try incognito mode to clear cookies
```

### Performance Issues

**Slow Face Recognition**
```
Solutions:
- Reduce PROCESS_FRAME_INTERVAL (process less frequently)
- Reduce number of active cameras
- Use GPU acceleration (install onnxruntime-gpu)
- Lower camera resolution
```

**High CPU Usage**
```
Solutions:
- Reduce MAX_CAMERAS
- Increase PROCESS_FRAME_INTERVAL
- Use dedicated GPU for inference
```

---

## 🔒 Security & Privacy

### Data Protection
- Face embeddings are stored (not raw images after processing)
- Passwords are hashed with bcrypt
- JWT tokens expire after 24 hours
- Database connections are secured

### Privacy Considerations
⚠️ **Important**: This system should only be used:
- With explicit consent from all tracked individuals
- In compliance with local privacy laws (GDPR, CCPA, etc.)
- For legitimate security/access control purposes
- With proper data retention policies

### Recommended Security Measures
1. Change `SECRET_KEY` in production
2. Use HTTPS in production
3. Implement rate limiting
4. Add IP whitelisting for admin access
5. Regular security audits
6. Encrypt database at rest
7. Implement data retention policies

---

## 📝 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Face Embeddings Table
```sql
CREATE TABLE face_embeddings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    embedding_vector TEXT NOT NULL,
    image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Cameras Table
```sql
CREATE TABLE cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    rtsp_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tracking Logs Table
```sql
CREATE TABLE tracking_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    confidence_score FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Performance Optimization Tips

1. **Frame Processing**: Process every 1-2 seconds, not every frame
2. **Threading**: Each camera runs in separate thread
3. **Embedding Cache**: Cache user embeddings in memory
4. **Debounce Logic**: Avoid duplicate tracking updates
5. **Database Indexing**: Indexes on user_id, timestamp, location
6. **Connection Pooling**: SQLAlchemy connection pool configured

---

## 📄 License

This project is for educational and authorized commercial use only.
Ensure compliance with local privacy laws and regulations.

---

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at `/api/docs`
3. Check backend logs for errors
4. Verify all prerequisites are installed

---

## 🚀 Future Enhancements

- [ ] Live camera preview in dashboard
- [ ] Floor map visualization
- [ ] Unknown person alerts
- [ ] Email/SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] WebSocket for real-time updates
- [ ] Multi-face detection per frame
- [ ] Age/gender estimation
- [ ] Mask detection

---

**Built with ❤️ using FastAPI, Next.js, and InsightFace**
