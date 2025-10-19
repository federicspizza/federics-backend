import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellidos, telefono, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ nombre, apellidos, telefono, email, password: hashed });
    await user.save();
    res.json({ message: "Usuario registrado correctamente ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Contraseña incorrecta" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ message: "Inicio de sesión exitoso ✅", token });
});

export default router;
