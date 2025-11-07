import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();

// CORS mejorado para GitHub Pages
app.use(cors({
  origin: [
    'https://federicspizza.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ruta de prueba mejorada
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 Servidor de Federic's Pizza funcionando",
    version: "1.0.0",
    status: "OK",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login"
      },
      payments: {
        process: "POST /api/payments/process",
        cards: "GET /api/payments/cards"
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas");

    // Montar rutas
    app.use("/api/auth", authRoutes);
    app.use("/api/payments", paymentRoutes);

    console.log("🧩 Rutas cargadas:");
    console.log("   → POST /api/auth/register");
    console.log("   → POST /api/auth/login"); 
    console.log("   → POST /api/payments/process");
    console.log("   → GET /api/payments/cards");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🍕 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌐 URL: https://federics-backend.onrender.com`);
    });
  })
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB:", err);
    process.exit(1);
  });