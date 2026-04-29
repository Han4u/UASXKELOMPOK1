require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
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
  database: process.env.DB_NAME || "patients_db"
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Patient Service API", version: "1.0.0" }
  },
  apis: ["./server.js"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function findExistingPatient({ full_name, date_of_birth, phone }) {
  if (phone) {
    const [byPhone] = await pool.query(
      "SELECT * FROM patients WHERE phone = ? AND date_of_birth = ? LIMIT 1",
      [phone, date_of_birth]
    );
    if (byPhone.length) return byPhone[0];
  }

  const [byNameDob] = await pool.query(
    "SELECT * FROM patients WHERE full_name = ? AND date_of_birth = ? LIMIT 1",
    [full_name, date_of_birth]
  );
  return byNameDob[0] || null;
}

/**
 * @openapi
 * /api/patients:
 *   post:
 *     tags: [Patients]
 *     summary: Mendaftarkan pasien baru
 */
app.post("/api/patients", async (req, res) => {
  const { full_name, gender, date_of_birth, phone, address } = req.body;
  if (!full_name || !gender || !date_of_birth) {
    return res.status(400).json({ message: "full_name, gender, date_of_birth wajib diisi" });
  }
  const [result] = await pool.query(
    "INSERT INTO patients (full_name, gender, date_of_birth, phone, address) VALUES (?, ?, ?, ?, ?)",
    [full_name, gender, date_of_birth, phone || null, address || null]
  );
  const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [result.insertId]);
  return res.status(201).json(rows[0]);
});

/**
 * @openapi
 * /api/patients/register:
 *   post:
 *     tags: [Patients]
 *     summary: Registrasi pasien (gunakan data lama jika sudah ada)
 */
app.post("/api/patients/register", async (req, res) => {
  const { full_name, gender, date_of_birth, phone, address } = req.body;
  if (!full_name || !gender || !date_of_birth) {
    return res.status(400).json({ message: "full_name, gender, date_of_birth wajib diisi" });
  }

  const existing = await findExistingPatient({ full_name, date_of_birth, phone: phone || null });
  if (existing) {
    return res.status(200).json({
      reused: true,
      message: "Pasien sudah terdaftar, menggunakan ID lama",
      patient: existing
    });
  }

  const [result] = await pool.query(
    "INSERT INTO patients (full_name, gender, date_of_birth, phone, address) VALUES (?, ?, ?, ?, ?)",
    [full_name, gender, date_of_birth, phone || null, address || null]
  );
  const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [result.insertId]);
  return res.status(201).json({
    reused: false,
    message: "Pasien baru berhasil didaftarkan",
    patient: rows[0]
  });
});

/**
 * @openapi
 * /api/patients:
 *   get:
 *     tags: [Patients]
 *     summary: Menampilkan seluruh daftar pasien
 */
app.get("/api/patients", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM patients ORDER BY id DESC");
  return res.json(rows);
});

/**
 * @openapi
 * /api/patients/{id}:
 *   get:
 *     tags: [Patients]
 *     summary: Mencari pasien berdasarkan ID
 */
app.get("/api/patients/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Patient tidak ditemukan" });
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/patients/{id}:
 *   put:
 *     tags: [Patients]
 *     summary: Memperbarui data pasien
 */
app.put("/api/patients/:id", async (req, res) => {
  const { full_name, gender, date_of_birth, phone, address } = req.body;
  const [existing] = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: "Patient tidak ditemukan" });

  await pool.query(
    "UPDATE patients SET full_name = ?, gender = ?, date_of_birth = ?, phone = ?, address = ? WHERE id = ?",
    [
      full_name ?? existing[0].full_name,
      gender ?? existing[0].gender,
      date_of_birth ?? existing[0].date_of_birth,
      phone ?? existing[0].phone,
      address ?? existing[0].address,
      req.params.id
    ]
  );
  const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/patients/{id}:
 *   delete:
 *     tags: [Patients]
 *     summary: Menghapus data pasien
 */
app.delete("/api/patients/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM patients WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Patient tidak ditemukan" });
  return res.json({ message: "Patient berhasil dihapus" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
});

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => {
  console.log(`Patient Service running on http://localhost:${PORT}`);
});
