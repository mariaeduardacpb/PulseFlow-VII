// models/Insonia.js
import mongoose from 'mongoose';

const InsoniaSchema = new mongoose.Schema({
  pacienteId: {
    type: String,
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  fonte: {
    type: String,
    default: 'Manual'
  },
  unidade: {
    type: String,
    default: 'horas'
  },
  descricao: {
    type: String,
    default: 'Horas de sono'
  }
}, {
  timestamps: true
});

export default mongoose.model('Insonia', InsoniaSchema);
