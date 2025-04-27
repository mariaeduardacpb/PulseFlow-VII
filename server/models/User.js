import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nome: String,
  cpf: String,
  telefonePessoal: String,
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
  crm: String,
  areaAtuacao: String,
  genero: String,
  enderecoConsultorio: String,
  telefoneConsultorio: String,
  otp: String,
  otpExpires: Date,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
