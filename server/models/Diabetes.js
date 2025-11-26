
// models/Diabetes.js
import mongoose from 'mongoose';

const DiabetesSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: false
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: false
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
});

export default mongoose.model('Diabetes', DiabetesSchema);
