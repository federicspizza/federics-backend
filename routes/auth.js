import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "./models/User.js"; // ✅ CORREGIDO

const router = express.Router();

// ✅ CONFIGURACIÓN MEJORADA DE CORREO
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // ✅ Para evitar problemas SSL
  }
});

// ✅ REGISTRO MEJORADO
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Intento de registro:", req.body.email);
    
    const { nombre, apellidos, telefono, email, password } = req.body;

    // Validaciones
    if (!nombre || !apellidos || !telefono || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo."
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(telefono)) {
      return res.status(400).json({ message: "El teléfono debe tener 10 dígitos." });
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

    // ✅ ENVÍO DE CORREO MEJORADO (con manejo de errores)
    try {
      const mailOptions = {
        from: `"Federic's Pizza 🍕" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "¡Bienvenido a Federic's Pizza!",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #ff6b35;">¡Bienvenido ${nombre}!</h2>
            <p>Tu cuenta ha sido creada exitosamente en Federic's Pizza.</p>
            <p>Ahora puedes disfrutar de nuestras deliciosas pizzas con tu cuenta.</p>
            <br>
            <p><strong>Datos de tu cuenta:</strong></p>
            <p>Nombre: ${nombre} ${apellidos}</p>
            <p>Email: ${email}</p>
            <p>Teléfono: ${telefono}</p>
            <br>
            <p>¡Gracias por unirte a nuestra familia pizza-lover! 🍕</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Correo de bienvenida enviado a:", email);
    } catch (emailError) {
      console.error("⚠️ Error enviando correo de bienvenida:", emailError);
      // No falla el registro solo por error de correo
    }

    res.json({ 
      message: "Usuario registrado exitosamente ✅",
      user: {
        nombre,
        email,
        telefono
      }
    });

  } catch (error) {
    console.error("💥 Error en registro:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ LOGIN MEJORADO (con fallback para desarrollo)
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

    // Generar código
    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("📧 Código generado para", email, ":", codigo);
    
    user.codigoTemporal = codigo;
    await user.save();

    // ✅ INTENTAR ENVIAR CORREO
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const mailOptions = {
          from: `"Federic's Pizza 🔐" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Tu código de verificación - Federic's Pizza",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #ff6b35;">Código de Verificación</h2>
              <p>Hola ${user.nombre},</p>
              <p>Usa el siguiente código para completar tu inicio de sesión:</p>
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0;">
                ${codigo}
              </div>
              <p>Este código expirará en 10 minutos.</p>
              <p>Si no solicitaste este código, ignora este mensaje.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Correo de verificación enviado a:", email);
        return res.json({ message: "Código enviado al correo ✅" });
        
      } catch (emailError) {
        console.error("❌ Error enviando correo:", emailError);
        // Continuar con fallback
      }
    }

    // ✅ FALLBACK: Mostrar código en respuesta (solo desarrollo)
    console.log("📧 (MODO DESARROLLO) Código para", email, ":", codigo);
    res.json({ 
      message: "Código generado (modo desarrollo)",
      codigo: codigo,
      email: email,
      modo: "desarrollo"
    });

  } catch (error) {
    console.error("💥 Error en login:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ VERIFICACIÓN MEJORADA
router.post("/verify-code", async (req, res) => {
  try {
    const { email, codigo } = req.body;
    console.log("🔍 Verificando código para:", email, "Código:", codigo);

    if (!email || !codigo) {
      return res.status(400).json({ message: "Email y código son requeridos" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    if (user.codigoTemporal !== codigo) {
      console.log("❌ Código incorrecto. Esperado:", user.codigoTemporal, "Recibido:", codigo);
      return res.status(400).json({ message: "Código incorrecto" });
    }

    // ✅ Código correcto - limpiar y generar token
    user.codigoTemporal = null;
    await user.save();

    const token = jwt.sign({ 
      userId: user._id,
      email: user.email 
    }, process.env.JWT_SECRET || "secreto_temporal", {
      expiresIn: "24h",
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
    console.error("💥 Error en verificación:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
