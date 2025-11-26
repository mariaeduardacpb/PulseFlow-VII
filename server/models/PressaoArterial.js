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
  collection: 'pressoes'
});

PressaoArterialSchema.pre('save', function(next) {
  if (this.paciente != null && (this.pacienteId == null || this.pacienteId === undefined)) {
    this.pacienteId = this.paciente;
  }
  if (this.pacienteId != null && (this.paciente == null || this.paciente === undefined)) {
    this.paciente = this.pacienteId;
  }
  next();
});

export default mongoose.model('PressaoArterial', PressaoArterialSchema);
