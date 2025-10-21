import mongoose from 'mongoose';

const enxaquecaSchema = new mongoose.Schema({
  pacienteId: {
    type: String,
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  intensidade: {
    type: String,
    required: true
  },
  duracao: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Enxaqueca = mongoose.model('Enxaqueca', enxaquecaSchema);
export default Enxaqueca;
