require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const axios = require("axios");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "records_db"
});

const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || "http://localhost:4001";
const CONSULTATION_SERVICE_URL = process.env.CONSULTATION_SERVICE_URL || "http://localhost:4004";

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Medical Record Service API", version: "1.0.0" }
  },
  apis: ["./server.js"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function validatePatient(patientId) {
  const response = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/${patientId}`);
  return response.data;
}

async function ensureConsultationHistory(patientId) {
  const response = await axios.get(`${CONSULTATION_SERVICE_URL}/api/consultations/patient/${patientId}`);
  const consultations = Array.isArray(response.data) ? response.data : [];
  if (!consultations.length) {
    throw new Error("NO_CONSULTATION_HISTORY");
  }
}

/**
 * @openapi
 * /api/records:
 *   post:
 *     tags: [MedicalRecords]
 *     summary: Membuat rekam medis baru
 */
app.post("/api/records", async (req, res) => {
  const { patient_id, doctor_id, diagnosis, treatment, visit_date, notes } = req.body;
  if (!patient_id || !doctor_id || !diagnosis || !treatment || !visit_date) {
    return res.status(400).json({
      message: "patient_id, doctor_id, diagnosis, treatment, visit_date wajib diisi"
    });
  }

  try {
    await validatePatient(patient_id);
  } catch (_error) {
    return res.status(400).json({ message: "Patient tidak valid / tidak ditemukan" });
  }

  try {
    await ensureConsultationHistory(patient_id);
  } catch (error) {
    if (error.message === "NO_CONSULTATION_HISTORY") {
      return res.status(400).json({
        message: "Belum ada riwayat konsultasi. Silakan input layanan konsultasi terlebih dahulu."
      });
    }
    return res.status(400).json({ message: "Consultation service tidak dapat diakses" });
  }

  const [result] = await pool.query(
    "INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, visit_date, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [patient_id, doctor_id, diagnosis, treatment, visit_date, notes || null]
  );
  const [rows] = await pool.query("SELECT * FROM medical_records WHERE id = ?", [result.insertId]);
  return res.status(201).json(rows[0]);
});

/**
 * @openapi
 * /api/records:
 *   get:
 *     tags: [MedicalRecords]
 *     summary: Menampilkan seluruh rekam medis
 */
app.get("/api/records", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM medical_records ORDER BY id DESC");
  return res.json(rows);
});

/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     tags: [MedicalRecords]
 *     summary: Mengambil rekam medis berdasarkan ID
 */
app.get("/api/records/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM medical_records WHERE id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Record tidak ditemukan" });
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/records/patient/{patientId}:
 *   get:
 *     tags: [MedicalRecords]
 *     summary: Menampilkan rekam medis berdasarkan patient ID
 */
app.get("/api/records/patient/:patientId", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM medical_records WHERE patient_id = ?", [
    req.params.patientId
  ]);
  return res.json(rows);
});

/**
 * @openapi
 * /api/records/{id}:
 *   put:
 *     tags: [MedicalRecords]
 *     summary: Memperbarui data rekam medis
 */
app.put("/api/records/:id", async (req, res) => {
  const { patient_id, doctor_id, diagnosis, treatment, visit_date, notes } = req.body;
  const [existing] = await pool.query("SELECT * FROM medical_records WHERE id = ?", [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: "Record tidak ditemukan" });
  const oldData = existing[0];

  if (patient_id !== undefined) {
    try {
      await validatePatient(patient_id);
    } catch (_error) {
      return res.status(400).json({ message: "Patient tidak valid / tidak ditemukan" });
    }
    try {
      await ensureConsultationHistory(patient_id);
    } catch (error) {
      if (error.message === "NO_CONSULTATION_HISTORY") {
        return res.status(400).json({
          message: "Belum ada riwayat konsultasi. Silakan input layanan konsultasi terlebih dahulu."
        });
      }
      return res.status(400).json({ message: "Consultation service tidak dapat diakses" });
    }
  }

  await pool.query(
    "UPDATE medical_records SET patient_id = ?, doctor_id = ?, diagnosis = ?, treatment = ?, visit_date = ?, notes = ? WHERE id = ?",
    [
      patient_id ?? oldData.patient_id,
      doctor_id ?? oldData.doctor_id,
      diagnosis ?? oldData.diagnosis,
      treatment ?? oldData.treatment,
      visit_date ?? oldData.visit_date,
      notes ?? oldData.notes,
      req.params.id
    ]
  );
  const [rows] = await pool.query("SELECT * FROM medical_records WHERE id = ?", [req.params.id]);
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     tags: [MedicalRecords]
 *     summary: Menghapus data rekam medis
 */
app.delete("/api/records/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM medical_records WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Record tidak ditemukan" });
  return res.json({ message: "Record berhasil dihapus" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
});

const PORT = Number(process.env.PORT || 4003);
app.listen(PORT, () => {
  console.log(`Medical Record Service running on http://localhost:${PORT}`);
});
