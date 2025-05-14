import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  fotoPerfil: {type: String, required: true },
  cpf: { type: String, unique: true, required: true },
  altura: { type: String, unique: true, required: true },
  dataNascimento: { type: String, unique: true, required: true },
  genero: { type: String, unique: true, required: true },
  nacionalidade: { type: String, required: true },
  peso: { type: String, required: true },
  profissao: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
  observacoes: { type: String, required: true },
});

const Paciente = mongoose.model('Paciente', pacienteSchema);
export default Paciente;
