import mongoose from 'mongoose';

const enxaquecaSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  intensidade: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  }
});

const Enxaqueca = mongoose.model('Enxaqueca', enxaquecaSchema);
export default Enxaqueca;
