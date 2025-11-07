import express from "express";
import jwt from "jsonwebtoken";
import Card from "../models/Card.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Procesar pago y guardar tarjeta
router.post("/process", verifyToken, async (req, res) => {
  try {
    const { cardData, amount, items, saveCard } = req.body;

    // Aquí iría la lógica para procesar el pago con una pasarela de pago
    // Por ahora, simulamos que el pago fue exitoso

    let savedCard = null;

    // Si el usuario quiere guardar la tarjeta
    if (saveCard) {
      // Obtener los últimos 4 dígitos
      const last4 = cardData.cardNumber.slice(-4);
      
      // Determinar la marca de la tarjeta (simulado)
      const brand = determineCardBrand(cardData.cardNumber);

      const newCard = new Card({
        userId: req.userId,
        cardHolder: cardData.cardHolder,
        cardNumber: cardData.cardNumber, // En producción, esto debería estar encriptado
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv, // En producción, esto debería estar encriptado
        last4,
        brand
      });

      savedCard = await newCard.save();
    }

    // Simular respuesta exitosa
    res.json({
      success: true,
      message: "Pago procesado correctamente",
      cardSaved: saveCard,
      savedCard: savedCard ? {
        id: savedCard._id,
        last4: savedCard.last4,
        brand: savedCard.brand
      } : null
    });

  } catch (error) {
    console.error("Error en el proceso de pago:", error);
    res.status(500).json({ message: "Error al procesar el pago" });
  }
});

// Obtener tarjetas guardadas del usuario
router.get("/cards", verifyToken, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.userId }).select('last4 brand');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tarjetas" });
  }
});

// Función auxiliar para determinar la marca de la tarjeta
function determineCardBrand(cardNumber) {
  // Lógica simple para determinar la marca
  if (cardNumber.startsWith('4')) return 'Visa';
  if (cardNumber.startsWith('5')) return 'MasterCard';
  if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) return 'American Express';
  return 'Otra';
}

export default router;