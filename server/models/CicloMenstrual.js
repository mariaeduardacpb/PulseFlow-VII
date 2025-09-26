import mongoose from 'mongoose';

const cicloSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, required: true },
  diasPorData: {
    type: Map,
    of: {
      fluxo: { type: String },
      teveColica: { type: Boolean },
      humor: { type: String }
    }
  }
}, { timestamps: true });

const CicloMenstrual = mongoose.model('CicloMenstrual', cicloSchema, 'menstruacaos');
export default CicloMenstrual;
