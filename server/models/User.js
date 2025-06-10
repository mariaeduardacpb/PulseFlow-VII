import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cpf: { type: String, required: true },
  genero: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
  crm: { type: String, required: true },
  rqe: [{ type: String }], // Array de RQEs
  areaAtuacao: { type: String, required: true },
  telefonePessoal: { type: String, required: true },
  telefoneConsultorio: { type: String },
  cep: { type: String, required: true },
  enderecoConsultorio: { type: String, required: true },
  numeroConsultorio: { type: String, required: true },
  complemento: { type: String },
  bairro: { type: String },
  cidade: { type: String },
  estado: { type: String },
  foto: { type: String },
  otp: String,
  otpExpires: Date,
}, { 
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      if (ret.dataNascimento) {
        ret.dataNascimento = new Date(ret.dataNascimento).toISOString().split('T')[0];
      }
      return ret;
    }
  }
});

const User = mongoose.model('User', userSchema);

export default User;
