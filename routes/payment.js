import express from "express";
import jwt from "jsonwebtoken";
import Card from "../models/Card.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ MIDDLEWARE MEJORADO PARA VERIFICAR TOKEN
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log("❌ Token no proporcionado");
    return res.status(401).json({ 
      message: 'Token no proporcionado',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log("✅ Token válido para usuario:", req.userId);
    next();
  } catch (error) {
    console.log("❌ Error con token:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    } else {
      return res.status(401).json({ 
        message: 'Error de autenticación',
        code: 'AUTH_ERROR'
      });
    }
  }
};

// ✅ PROCESAR PAGO MEJORADO - AHORA SEGURO Y FUNCIONAL
router.post("/process", verifyToken, async (req, res) => {
  try {
    console.log("💳 Iniciando proceso de pago...");
    console.log("Usuario:", req.userId);
    console.log("Datos recibidos:", {
      cardData: req.body.cardData ? "Presente" : "Faltante",
      amount: req.body.amount,
      items: req.body.items?.length || 0,
      saveCard: req.body.saveCard,
      cardId: req.body.cardId // Para pagos con tarjeta guardada
    });

    const { cardData, amount, items, saveCard, cardId } = req.body;

    // ✅ VALIDACIONES MEJORADAS
    if (!amount || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Datos de pago incompletos" 
      });
    }

    // ✅ OBTENER INFORMACIÓN DEL USUARIO
    let userInfo = {};
    try {
      const user = await User.findById(req.userId);
      if (user) {
        userInfo = {
          name: `${user.nombre || ''} ${user.apellidos || ''}`.trim(),
          email: user.email || '',
          phone: user.telefono || ''
        };
      }
    } catch (userError) {
      console.log("⚠️ No se pudo obtener info del usuario, continuando...");
    }

    let savedCard = null;
    let cardDetails = {};

    // ✅ PAGO CON TARJETA GUARDADA
    if (cardId) {
      try {
        console.log("💳 Procesando pago con tarjeta guardada:", cardId);
        const existingCard = await Card.findById(cardId);
        
        if (!existingCard || existingCard.userId.toString() !== req.userId) {
          return res.status(404).json({
            success: false,
            message: "Tarjeta no encontrada o no pertenece al usuario"
          });
        }

        cardDetails = {
          last4: existingCard.last4,
          brand: existingCard.brand,
          cardHolder: existingCard.cardHolder
        };

        console.log("✅ Usando tarjeta guardada:", cardDetails);

      } catch (cardError) {
        console.error("❌ Error al obtener tarjeta guardada:", cardError);
        return res.status(400).json({
          success: false,
          message: "Error al procesar tarjeta guardada"
        });
      }
    }
    // ✅ PAGO CON NUEVA TARJETA Y GUARDAR
    else if (saveCard && cardData) {
      try {
        const last4 = cardData.cardNumber.slice(-4);
        const brand = determineCardBrand(cardData.cardNumber);

        console.log("💾 Intentando guardar tarjeta de forma segura...", { 
          userId: req.userId,
          last4: last4,
          brand: brand
        });

        // ✅ VERIFICAR SI LA TARJETA YA EXISTE
        const existingCard = await Card.findOne({ 
          userId: req.userId, 
          last4: last4 
        });

        if (existingCard) {
          console.log("🔄 Tarjeta ya existe, actualizando...");
          // Actualizar tarjeta existente (solo información segura)
          existingCard.cardHolder = cardData.cardHolder;
          existingCard.expiryDate = cardData.expiryDate;
          existingCard.brand = brand;
          savedCard = await existingCard.save();
        } else {
          console.log("🆕 Creando nueva tarjeta (solo información segura)...");
          // ✅ CREAR NUEVA TARJETA SOLO CON INFORMACIÓN SEGURA
          const newCard = new Card({
            userId: req.userId,
            cardHolder: cardData.cardHolder,
            // ✅ SOLO guardar últimos 4 dígitos
            last4: last4,
            brand: brand,
            expiryDate: cardData.expiryDate
            // ✅ NO guardar cardNumber completo
            // ✅ NO guardar CVV
          });

          savedCard = await newCard.save();
        }

        cardDetails = {
          last4: savedCard.last4,
          brand: savedCard.brand,
          cardHolder: savedCard.cardHolder
        };
        
        console.log("✅ Tarjeta guardada de forma segura:", savedCard._id);
        
      } catch (saveError) {
        console.error("❌ Error al guardar tarjeta:", saveError);
        
        // Manejar error de duplicado
        if (saveError.code === 11000) {
          console.log("ℹ️ Tarjeta ya existe para este usuario");
          // Intentar obtener la tarjeta existente
          const last4 = cardData.cardNumber.slice(-4);
          const existingCard = await Card.findOne({ userId: req.userId, last4: last4 });
          if (existingCard) {
            savedCard = existingCard;
            cardDetails = {
              last4: existingCard.last4,
              brand: existingCard.brand,
              cardHolder: existingCard.cardHolder
            };
          }
        }
      }
    }
    // ✅ PAGO CON NUEVA TARJETA SIN GUARDAR
    else if (cardData) {
      const last4 = cardData.cardNumber.slice(-4);
      const brand = determineCardBrand(cardData.cardNumber);
      
      cardDetails = {
        last4: last4,
        brand: brand,
        cardHolder: cardData.cardHolder
      };
    }

    // ✅ GUARDAR EL PAGO EN LA BASE DE DATOS
    let savedPayment = null;
    try {
      console.log("💾 Guardando pago en la base de datos...");
      
      const paymentData = {
        userId: req.userId,
        amount: amount,
        items: items.map(item => ({
          name: item.name || 'Producto',
          detail: item.detail || 'Sin descripción',
          price: item.total || 0,
          quantity: 1
        })),
        paymentMethod: cardId ? 'saved_card' : 'card',
        cardDetails: cardDetails,
        customerInfo: userInfo,
        status: 'completed'
      };

      console.log("📦 Datos del pago a guardar:", paymentData);

      const newPayment = new Payment(paymentData);
      savedPayment = await newPayment.save();
      
      console.log("✅ PAGO GUARDADO EN MONGODB:", {
        orderNumber: savedPayment.orderNumber,
        paymentId: savedPayment._id,
        amount: savedPayment.amount
      });

    } catch (paymentError) {
      console.error("💥 ERROR CRÍTICO: No se pudo guardar el pago:", paymentError);
      return res.status(500).json({ 
        success: false,
        message: "Error al guardar el pago en la base de datos",
        error: paymentError.message 
      });
    }

    // ✅ RESPUESTA EXITOSA
    console.log("✅ Pago procesado y guardado exitosamente");
    res.json({
      success: true,
      message: "Pago procesado correctamente y guardado en la base de datos",
      transactionId: savedPayment.orderNumber,
      paymentId: savedPayment._id,
      amount: amount,
      cardSaved: !!savedCard,
      savedCard: savedCard ? {
        id: savedCard._id,
        last4: savedCard.last4,
        brand: savedCard.brand
      } : null
    });

  } catch (error) {
    console.error("💥 Error en el proceso de pago:", error);
    res.status(500).json({ 
      success: false,
      message: "Error interno al procesar el pago",
      error: error.message 
    });
  }
});

// Obtener tarjetas guardadas del usuario
router.get("/cards", verifyToken, async (req, res) => {
  try {
    console.log("📋 Solicitando tarjetas para usuario:", req.userId);
    
    const cards = await Card.find({ userId: req.userId })
      .select('last4 brand cardHolder expiryDate createdAt')
      .sort({ createdAt: -1 });

    console.log(`📋 Tarjetas encontradas: ${cards.length}`);
    
    res.json(cards);
  } catch (error) {
    console.error("💥 Error al obtener tarjetas:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener tarjetas",
      error: error.message 
    });
  }
});

// ✅ ELIMINAR TARJETA GUARDADA
router.delete("/cards/:cardId", verifyToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    
    console.log("🗑️ Eliminando tarjeta:", cardId, "para usuario:", req.userId);
    
    const card = await Card.findOneAndDelete({ 
      _id: cardId, 
      userId: req.userId 
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta no encontrada"
      });
    }

    console.log("✅ Tarjeta eliminada:", cardId);
    
    res.json({
      success: true,
      message: "Tarjeta eliminada correctamente"
    });
  } catch (error) {
    console.error("💥 Error al eliminar tarjeta:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar tarjeta",
      error: error.message 
    });
  }
});

// Función auxiliar para determinar la marca de la tarjeta
function determineCardBrand(cardNumber) {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'Visa';
  if (cleaned.startsWith('5')) return 'MasterCard';
  if (cleaned.startsWith('34') || cleaned.startsWith('37')) return 'American Express';
  if (cleaned.startsWith('6')) return 'Discover';
  return 'Otra';
}

export default router;