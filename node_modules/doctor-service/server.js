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
  database: process.env.DB_NAME || "doctors_db"
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Doctor Service API", version: "1.0.0" }
  },
  apis: ["./server.js"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/doctors:
 *   post:
 *     tags: [Doctors]
 *     summary: Mendaftarkan dokter baru
 */
app.post("/api/doctors", async (req, res) => {
  const { full_name, specialization, phone, email } = req.body;
  if (!full_name || !specialization) {
    return res.status(400).json({ message: "full_name dan specialization wajib diisi" });
  }
  const [result] = await pool.query(
    "INSERT INTO doctors (full_name, specialization, phone, email) VALUES (?, ?, ?, ?)",
    [full_name, specialization, phone || null, email || null]
  );
  const [rows] = await pool.query("SELECT * FROM doctors WHERE id = ?", [result.insertId]);
  return res.status(201).json(rows[0]);
});

/**
 * @openapi
 * /api/doctors:
 *   get:
 *     tags: [Doctors]
 *     summary: Menampilkan seluruh daftar dokter
 */
app.get("/api/doctors", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM doctors ORDER BY id DESC");
  return res.json(rows);
});

/**
 * @openapi
 * /api/doctors/{id}:
 *   get:
 *     tags: [Doctors]
 *     summary: Mencari dokter berdasarkan ID
 */
app.get("/api/doctors/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM doctors WHERE id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Doctor tidak ditemukan" });
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/doctors/{id}:
 *   put:
 *     tags: [Doctors]
 *     summary: Memperbarui data dokter
 */
app.put("/api/doctors/:id", async (req, res) => {
  const { full_name, specialization, phone, email } = req.body;
  const [existing] = await pool.query("SELECT * FROM doctors WHERE id = ?", [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: "Doctor tidak ditemukan" });

  await pool.query(
    "UPDATE doctors SET full_name = ?, specialization = ?, phone = ?, email = ? WHERE id = ?",
    [
      full_name ?? existing[0].full_name,
      specialization ?? existing[0].specialization,
      phone ?? existing[0].phone,
      email ?? existing[0].email,
      req.params.id
    ]
  );
  const [rows] = await pool.query("SELECT * FROM doctors WHERE id = ?", [req.params.id]);
  return res.json(rows[0]);
});

/**
 * @openapi
 * /api/doctors/{id}:
 *   delete:
 *     tags: [Doctors]
 *     summary: Menghapus data dokter
 */
app.delete("/api/doctors/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM doctors WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Doctor tidak ditemukan" });
  return res.json({ message: "Doctor berhasil dihapus" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
});

const PORT = Number(process.env.PORT || 4002);
app.listen(PORT, () => {
  console.log(`Doctor Service running on http://localhost:${PORT}`);
});
