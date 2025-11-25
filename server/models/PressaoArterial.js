import mongoose from 'mongoose';

const PressaoArterialSchema = new mongoose.Schema({
  // Suporta ambos os formatos: 'paciente' (web) e 'pacienteId' (mobile)
  paciente: {
    type: mongoose.Schema.Types.Mixed, // Aceita ObjectId ou string
    ref: 'Paciente'
  },
  pacienteId: {
    type: mongoose.Schema.Types.Mixed, // Aceita ObjectId ou string
    ref: 'Paciente'
  },
  data: {
    type: Date,
    required: true
  },
  sistolica: {
    type: Number,
    required: true
  },
  diastolica: {
    type: Number,
    required: true
  }
}, {
  collection: 'pressoes' // Nome da coleção usado pelo app mobile
});

export default mongoose.model('PressaoArterial', PressaoArterialSchema);
