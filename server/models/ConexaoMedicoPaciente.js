import mongoose from 'mongoose';

const conexaoSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true,
    index: true
  },
  medicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicoNome: {
    type: String,
    required: true
  },
  medicoEspecialidade: {
    type: String
  },
  connectedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  disconnectedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

conexaoSchema.index({ pacienteId: 1, isActive: 1 });

const ConexaoMedicoPaciente = mongoose.model('ConexaoMedicoPaciente', conexaoSchema, 'conexoes_medico_paciente');

export default ConexaoMedicoPaciente;

