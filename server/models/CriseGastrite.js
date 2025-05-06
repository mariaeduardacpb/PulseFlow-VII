import mongoose from 'mongoose';

const criseGastriteSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Paciente'
  },
  dataCrise: {
    type: Date,
    required: true
  },
  intensidadeDor: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  sintomas: {
    type: String,
    required: false
  },
  alimentosIngeridos: {
    type: String,
    required: false
  },
  alivioMedicacao: {
    type: Boolean,
    required: false
  },
  observacoes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model('CriseGastrite', criseGastriteSchema);
