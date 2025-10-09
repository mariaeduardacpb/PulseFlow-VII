import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
  // Campos do app mobile
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  cpf: { type: String, unique: true, required: true },
  rg: { type: String },
  phone: { type: String, required: true },
  secondaryPhone: { type: String },
  birthDate: { type: String, required: true },
  gender: { type: String, required: true },
  maritalStatus: { type: String },
  nationality: { type: String, required: true },
  address: { type: String },
  height: { type: Number }, // Altura em cm
  weight: { type: Number }, // Peso em kg
  profession: { type: String }, // Profissão
  acceptedTerms: { type: Boolean, default: false },
  profilePhoto: { type: String, default: '/client/public/assets/User_logonegativo.png' },
  emergencyContact: { type: String },
  emergencyPhone: { type: String },
  fcmToken: { type: String }, // Token para notificações push
  isAdmin: { type: Boolean, default: false },
  twoFactorCode: { type: String },
  twoFactorExpires: { type: Date },
  passwordResetCode: { type: String },
  passwordResetExpires: { type: Date },
  passwordResetRequired: { type: Boolean, default: false },
  accessCode: { type: String },
  accessCodeExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Campos legacy para compatibilidade
  nome: { type: String },
  fotoPerfil: { type: String },
  altura: { type: String },
  dataNascimento: { type: String },
  genero: { type: String },
  nacionalidade: { type: String },
  peso: { type: String },
  profissao: { type: String },
  telefone: { type: String },
  senha: { type: String },
  observacoes: { type: String, default: 'Nenhuma observação registrada' }
});

const Paciente = mongoose.model('Paciente', pacienteSchema, 'patients');
export default Paciente;
