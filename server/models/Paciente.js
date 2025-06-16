import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  fotoPerfil: { type: String, default: '/client/public/assets/User_logonegativo.png' },
  cpf: { type: String, unique: true, required: true },
  altura: { type: String, required: true },
  dataNascimento: { type: String, required: true },
  genero: { type: String, required: true },
  nacionalidade: { type: String, required: true },
  peso: { type: String, required: true },
  profissao: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
  observacoes: { type: String, default: 'Nenhuma observação registrada' }
});

const Paciente = mongoose.model('Paciente', pacienteSchema, 'pacientes');
export default Paciente;
