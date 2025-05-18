
// models/Diabetes.js
import mongoose from 'mongoose';

const DiabetesSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  nivelGlicemia: {
    type: Number,
    required: true
  }
});

export default mongoose.model('Diabetes', DiabetesSchema);
