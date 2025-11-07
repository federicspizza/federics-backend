import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cardHolder: { 
    type: String, 
    required: true 
  },
  cardNumber: { 
    type: String, 
    required: true 
  },
  expiryDate: { 
    type: String, 
    required: true 
  },
  cvv: { 
    type: String, 
    required: true 
  },
  last4: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model("Card", cardSchema);