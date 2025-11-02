import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true }, // ✅ AGREGADO
  telefono: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  codigoTemporal: String 
}, {
  timestamps: true // ✅ AGREGADO para ver cuándo se creó/actualizó
});

export default mongoose.model("User", userSchema);