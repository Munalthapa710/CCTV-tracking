-- Smart Indoor Person Tracking System
-- Database Initialization Script for PostgreSQL

-- Create database (run this as postgres superuser)
-- CREATE DATABASE cctv_tracking;

-- Connect to the database
-- \c cctv_tracking

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create face_embeddings table
CREATE TABLE IF NOT EXISTS face_embeddings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    embedding_vector TEXT NOT NULL,
    image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create cameras table
CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    rtsp_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tracking_logs table
CREATE TABLE IF NOT EXISTS tracking_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    confidence_score FLOAT DEFAULT 0.0,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_face_embeddings_user_id ON face_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_cameras_is_active ON cameras(is_active);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_user_id ON tracking_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_timestamp ON tracking_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_location ON tracking_logs(location);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_log_type ON system_logs(log_type);

-- Insert sample data (optional - for testing)
-- Uncomment to add sample cameras

-- INSERT INTO cameras (name, location, rtsp_url, is_active) VALUES
-- ('Main Entrance', 'Building A - Floor 1', 'rtsp://admin:password@192.168.1.100:554/stream1', TRUE),
-- ('Reception', 'Building A - Lobby', 'rtsp://admin:password@192.168.1.101:554/stream1', TRUE),
-- ('Conference Room', 'Building A - Floor 2', 'rtsp://admin:password@192.168.1.102:554/stream1', FALSE);

-- Verify tables created
-- \dt

-- Verify indexes created
-- \di
