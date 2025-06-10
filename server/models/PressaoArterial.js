import mongoose from 'mongoose';

const PressaoArterialSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
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
});

export default mongoose.model('PressaoArterial', PressaoArterialSchema);
