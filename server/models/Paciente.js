import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cpf: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
});

const Paciente = mongoose.model('Paciente', pacienteSchema);
export default Paciente;
