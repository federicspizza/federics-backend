import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; 

const router = express.Router();

// ✅ REGISTRO SIMPLIFICADO (SIN CORREO)
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Intento de registro:", req.body.email);
    
    const { nombre, apellidos, telefono, email, password } = req.body;

    // Validaciones
    if (!nombre || !apellidos || !telefono || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Verificar duplicado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Este correo ya está registrado." });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      nombre, 
      apellidos, 
      telefono, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();
    console.log("✅ Usuario registrado:", email);

    res.json({ 
      message: "Usuario registrado exitosamente ✅",
      user: {
        id: user._id,
        nombre,
        apellidos,
        email,
        telefono
      }
    });

  } catch (error) {
    console.error("💥 Error en registro:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message
    });
  }
});

// ✅ LOGIN DIRECTO - TOKEN MEJORADO
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Intento de login para:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ Usuario no encontrado:", email);
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("❌ Contraseña incorrecta para:", email);
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // ✅ GENERAR TOKEN MEJORADO - 7 DÍAS EN LUGAR DE 24H
    const token = jwt.sign({ 
      userId: user._id,
      email: user.email 
    }, process.env.JWT_SECRET || "secreto_temporal", {
      expiresIn: "7d", 
    });

    console.log("✅ Login exitoso para:", email);
    res.json({
      message: "Login exitoso ✅",
      token: token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        telefono: user.telefono
      }
    });

  } catch (error) {
    console.error("💥 Error en login:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message
    });
  }
});

export default router;