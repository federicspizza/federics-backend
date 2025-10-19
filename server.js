import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";

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

    // Montamos las rutas solo después de conectar
    app.use("/api/auth", authRoutes);

    // ✅ Verificamos que las rutas sí están montadas correctamente
    if (app._router) {
      console.log("🧩 Rutas activas:");
      app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
          console.log("→", r.route.path);
        }
      });
    } else {
      console.log("⚠️ No hay rutas cargadas aún");
    }

    const PORT = 3000;
    app.listen(PORT, () =>
      console.log(`🚀 Servidor en http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ Error de conexión:", err));

