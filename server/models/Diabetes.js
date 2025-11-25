
// models/Diabetes.js
import mongoose from 'mongoose';

const DiabetesSchema = new mongoose.Schema({
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
  glicemia: {
    type: Number,
    required: true
  },
  unidade: {
    type: String,
    default: 'mg/dL'
  }
}, {
  collection: 'diabetes' // Nome da coleção usado pelo app mobile
});

export default mongoose.model('Diabetes', DiabetesSchema);
