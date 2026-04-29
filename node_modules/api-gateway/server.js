require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());

const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || "http://localhost:4001";
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:4002";
const RECORD_SERVICE_URL = process.env.RECORD_SERVICE_URL || "http://localhost:4003";
const CONSULTATION_SERVICE_URL = process.env.CONSULTATION_SERVICE_URL || "http://localhost:4004";

function createServiceProxy(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl
  });
}

app.get("/", (_req, res) => {
  res.json({ message: "API Gateway Smart Healthcare aktif" });
});

app.use(
  "/api/patients",
  createServiceProxy(PATIENT_SERVICE_URL)
);

app.use(
  "/api/doctors",
  createServiceProxy(DOCTOR_SERVICE_URL)
);

app.use(
  "/api/records",
  createServiceProxy(RECORD_SERVICE_URL)
);

app.use(
  "/api/consultations",
  createServiceProxy(CONSULTATION_SERVICE_URL)
);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
