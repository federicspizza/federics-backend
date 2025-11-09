import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cardHolder: { 
    type: String, 
    required: true,
    trim: true
  },
  // ✅ SEGURO: Solo guardar los últimos 4 dígitos
  last4: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
      },
      message: 'last4 debe tener exactamente 4 dígitos'
    }
  },
  brand: {
    type: String,
    required: true,
    enum: ['Visa', 'MasterCard', 'American Express', 'Discover', 'Otra']
  },
  expiryDate: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{2}\/\d{2}$/.test(v);
      },
      message: 'Fecha de expiración debe ser MM/AA'
    }
  },
  // ✅ ELIMINADO: cardNumber completo - NUNCA GUARDAR
  // ✅ ELIMINADO: cvv - NUNCA GUARDAR
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ✅ Asegurar que un usuario no tenga tarjetas duplicadas
cardSchema.index({ userId: 1, last4: 1 }, { unique: true });

export default mongoose.model("Card", cardSchema);