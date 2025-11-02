import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true },
  telefono: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
  // ❌ ELIMINADO: codigoTemporal: String 
}, {
  timestamps: true
});

export default mongoose.model("User", userSchema);