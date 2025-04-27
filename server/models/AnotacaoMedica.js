import mongoose from 'mongoose';

const anotacaoSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  titulo: { type: String, required: true },
  data: { type: Date, required: true },
  categoria: { type: String, required: true },
  medico: { type: String, required: true },
  anotacao: { type: String, required: true }
}, { timestamps: true });

const AnotacaoMedica = mongoose.model('AnotacaoMedica', anotacaoSchema);
export default AnotacaoMedica;
