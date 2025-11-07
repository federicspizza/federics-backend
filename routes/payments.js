import express from "express";
import jwt from "jsonwebtoken";
import Card from "../models/Card.js";

const router = express.Router();

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log("❌ Token no proporcionado");
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log("✅ Token válido para usuario:", req.userId);
    next();
  } catch (error) {
    console.log("❌ Token inválido:", error.message);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Procesar pago y guardar tarjeta
router.post("/process", verifyToken, async (req, res) => {
  try {
    console.log("💳 Iniciando proceso de pago...");
    console.log("Usuario:", req.userId);
    console.log("Datos recibidos:", {
      cardData: req.body.cardData ? "Presente" : "Faltante",
      amount: req.body.amount,
      items: req.body.items?.length || 0,
      saveCard: req.body.saveCard
    });

    const { cardData, amount, items, saveCard } = req.body;

    // Validaciones
    if (!cardData || !amount) {
      return res.status(400).json({ 
        message: "Datos de pago incompletos" 
      });
    }

    let savedCard = null;

    // Si el usuario quiere guardar la tarjeta
    if (saveCard && cardData) {
      try {
        // Obtener los últimos 4 dígitos
        const last4 = cardData.cardNumber.slice(-4);
        
        // Determinar la marca de la tarjeta
        const brand = determineCardBrand(cardData.cardNumber);

        console.log("💾 Guardando tarjeta...", { last4, brand });

        const newCard = new Card({
          userId: req.userId,
          cardHolder: cardData.cardHolder,
          cardNumber: cardData.cardNumber,
          expiryDate: cardData.expiryDate,
          cvv: cardData.cvv,
          last4,
          brand
        });

        savedCard = await newCard.save();
        console.log("✅ Tarjeta guardada exitosamente:", savedCard._id);
        
      } catch (saveError) {
        console.error("❌ Error al guardar tarjeta:", saveError);
        // No detenemos el proceso de pago si falla guardar la tarjeta
      }
    }

    // Simular respuesta exitosa de pago
    console.log("✅ Pago procesado exitosamente");
    res.json({
      success: true,
      message: "Pago procesado correctamente",
      transactionId: "TXN_" + Date.now(),
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
      .select('last4 brand createdAt')
      .sort({ createdAt: -1 });

    console.log(`📋 Tarjetas encontradas: ${cards.length}`);
    
    res.json(cards);
  } catch (error) {
    console.error("💥 Error al obtener tarjetas:", error);
    res.status(500).json({ 
      message: "Error al obtener tarjetas",
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