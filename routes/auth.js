import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

// Configuración de correo (Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Registro
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellidos, telefono, email, password } = req.body;

    // Validar contraseña segura
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .json({
          message:
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.",
        });
    }

    // Validar formato de teléfono
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(telefono)) {
      return res
        .status(400)
        .json({ message: "El teléfono debe tener 10 dígitos." });
    }

    // Verificar duplicado de correo
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Este correo ya está registrado." });
    }

    // Encriptar contraseña y guardar usuario
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ nombre, apellidos, telefono, email, password: hashed });
    await user.save();

    // Enviar correo de verificación
    const mailOptions = {
      from: `"Federic's Pizza 🍕" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta",
      text: `¡Hola ${nombre}! Gracias por registrarte en Federic's Pizza.\nTu cuenta ha sido creada con éxito.`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: "Usuario registrado y correo de verificación enviado ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login con código
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Usuario no encontrado" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(400).json({ message: "Contraseña incorrecta" });

  // Generar código de 4 dígitos
  const codigo = Math.floor(1000 + Math.random() * 9000).toString();

  // Enviar código por correo
  await transporter.sendMail({
    from: `"Federic's Pizza 🍕" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de inicio de sesión",
    text: `Tu código de verificación es: ${codigo}`,
  });

  // Guardar el código temporal en la base o variable global (mejor en DB)
  user.codigoTemporal = codigo;
  await user.save();

  res.json({ message: "Código enviado al correo ✅" });
});

// Verificar código
router.post("/verify-code", async (req, res) => {
  const { email, codigo } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.codigoTemporal !== codigo) {
    return res.status(400).json({ message: "Código inválido" });
  }

  user.codigoTemporal = null;
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({
    message: "Inicio de sesión exitoso ✅",
    token,
    nombre: user.nombre,
  });
});

export default router;
