import mongoose from 'mongoose';

const cicloSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, required: true }
}, { timestamps: true });

const CicloMenstrual = mongoose.model('ciclo', cicloSchema);
export default CicloMenstrual;
