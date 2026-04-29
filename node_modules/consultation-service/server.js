require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(cors());
app.use(express.json());

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "consultations_db";

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await connection.query(`USE \`${DB_NAME}\``);
  await connection.query(`
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
    )
  `);

  await connection.end();
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Consultation Service API", version: "1.0.0" }
  },
  apis: ["./server.js"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/consultations:
 *   post:
 *     tags: [Consultations]
 *     summary: Menambahkan data konsultasi pasien
 */
app.post("/api/consultations", async (req, res) => {
  const { patient_id, doctor_id, complaint, consultation_result, consultation_date, status } = req.body;
  if (!patient_id || !doctor_id || !complaint || !consultation_result || !consultation_date) {
    return res.status(400).json({
      message: "patient_id, doctor_id, complaint, consultation_result, consultation_date wajib diisi"
    });
  }

  const [result] = await pool.query(
    "INSERT INTO consultations (patient_id, doctor_id, complaint, consultation_result, consultation_date, status) VALUES (?, ?, ?, ?, ?, ?)",
    [patient_id, doctor_id, complaint, consultation_result, consultation_date, status || "done"]
  );
  const [rows] = await pool.query("SELECT * FROM consultations WHERE id = ?", [result.insertId]);
  return res.status(201).json(rows[0]);
});

/**
 * @openapi
 * /api/consultations:
 *   get:
 *     tags: [Consultations]
 *     summary: Menampilkan seluruh data konsultasi
 */
app.get("/api/consultations", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM consultations ORDER BY id DESC");
  return res.json(rows);
});

/**
 * @openapi
 * /api/consultations/{id}:
 *   get:
 *     tags: [Consultations]
 *     summary: Mengambil data konsultasi berdasarkan ID
 */
app.get("/api/consultations/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM consultations WHERE id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Consultation tidak ditemukan" });
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/consultations/patient/{patientId}:
 *   get:
 *     tags: [Consultations]
 *     summary: Menampilkan riwayat konsultasi berdasarkan patient ID
 */
app.get("/api/consultations/patient/:patientId", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM consultations WHERE patient_id = ? ORDER BY id DESC", [
    req.params.patientId
  ]);
  return res.json(rows);
});

/**
 * @openapi
 * /api/consultations/{id}:
 *   put:
 *     tags: [Consultations]
 *     summary: Memperbarui hasil konsultasi dan status
 */
app.put("/api/consultations/:id", async (req, res) => {
  const { complaint, consultation_result, consultation_date, status } = req.body;
  const [existing] = await pool.query("SELECT * FROM consultations WHERE id = ?", [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: "Consultation tidak ditemukan" });
  const oldData = existing[0];

  await pool.query(
    "UPDATE consultations SET complaint = ?, consultation_result = ?, consultation_date = ?, status = ? WHERE id = ?",
    [
      complaint ?? oldData.complaint,
      consultation_result ?? oldData.consultation_result,
      consultation_date ?? oldData.consultation_date,
      status ?? oldData.status,
      req.params.id
    ]
  );

  const [rows] = await pool.query("SELECT * FROM consultations WHERE id = ?", [req.params.id]);
  return res.json(rows[0]);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
});

const PORT = Number(process.env.PORT || 4004);

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Consultation Service running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Gagal inisialisasi consultation service:", error.message);
    process.exit(1);
  });
