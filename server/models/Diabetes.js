
// models/Diabetes.js
import mongoose from 'mongoose';

const DiabetesSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Paciente'
  },
  pacienteId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Paciente'
  },
  data: {
    type: Date,
    required: true
  },
  glicemia: {
    type: Number
  },
  nivelGlicemia: {
    type: Number
  },
  unidade: {
    type: String,
    default: 'mg/dL'
  }
}, {
  collection: 'diabetes'
});

DiabetesSchema.pre('save', function(next) {
  if (this.nivelGlicemia != null && (this.glicemia == null || this.glicemia === undefined)) {
    this.glicemia = this.nivelGlicemia;
  }
  if (this.glicemia != null && (this.nivelGlicemia == null || this.nivelGlicemia === undefined)) {
    this.nivelGlicemia = this.glicemia;
  }
  
  if ((this.glicemia == null || this.glicemia === undefined) && 
      (this.nivelGlicemia == null || this.nivelGlicemia === undefined)) {
    return next(new Error('É necessário fornecer glicemia ou nivelGlicemia'));
  }
  
  if (this.paciente != null && (this.pacienteId == null || this.pacienteId === undefined)) {
    this.pacienteId = this.paciente;
  }
  if (this.pacienteId != null && (this.paciente == null || this.paciente === undefined)) {
    this.paciente = this.pacienteId;
  }
  
  next();
});

DiabetesSchema.virtual('valorGlicemia').get(function() {
  return this.glicemia || this.nivelGlicemia || 0;
});

export default mongoose.model('Diabetes', DiabetesSchema);
