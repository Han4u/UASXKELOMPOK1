-- ============================================
-- Smart Healthcare System - Database Setup
-- ============================================

-- 1. PATIENTS DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS patients_db;
USE patients_db;

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  date_of_birth DATE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. DOCTORS DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS doctors_db;
USE doctors_db;

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  specialization VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. MEDICAL RECORDS DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS records_db;
USE records_db;

CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  visit_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. CONSULTATIONS DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS consultations_db;
USE consultations_db;

CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  complaint TEXT NOT NULL,
  consultation_result TEXT NOT NULL,
  consultation_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'done',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- SAMPLE DATA (Optional - Uncomment to use)
-- ============================================

-- Sample Patients
-- USE patients_db;
-- INSERT INTO patients (full_name, gender, date_of_birth, phone, address) VALUES
-- ('John Doe', 'Male', '1990-05-15', '081234567890', 'Jl. Merdeka No. 123'),
-- ('Jane Smith', 'Female', '1992-08-22', '082345678901', 'Jl. Sudirman No. 456');

-- Sample Doctors
-- USE doctors_db;
-- INSERT INTO doctors (full_name, specialization, phone, email) VALUES
-- ('Dr. Ahmad Wijaya', 'General Practitioner', '081111111111', 'ahmad@hospital.com'),
-- ('Dr. Siti Nurhaliza', 'Cardiologist', '082222222222', 'siti@hospital.com');

-- ============================================
-- All databases and tables created successfully!
-- ============================================
