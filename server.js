import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js"; // ✅ NUEVA LÍNEA

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando ✅");
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB");

    // Montar rutas
    app.use("/api/auth", authRoutes);
    app.use("/api/payments", paymentRoutes); // ✅ NUEVA LÍNEA

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`🚀 Servidor en http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ Error de conexión:", err));