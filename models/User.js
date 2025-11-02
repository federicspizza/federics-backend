import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: String,
  apellidos: String,
  telefono: String,
  email: { type: String, unique: true },
  password: String,
  codigoTemporal: String 
});

export default mongoose.model("User", userSchema);

