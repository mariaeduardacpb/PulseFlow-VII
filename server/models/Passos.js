import mongoose from 'mongoose';

const PassosSchema = new mongoose.Schema({
  // O app mobile usa 'pacienteId' como string
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
  valor: {
    type: Number,
    required: true
  },
  // Campo legado para compatibilidade
  passos: {
    type: Number
  },
  fonte: {
    type: String
  },
  descricao: {
    type: String
  },
  unidade: {
    type: String,
    default: 'passos'
  }
}, {
  collection: 'passos', // Nome da coleção usado pelo app mobile
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

export default mongoose.model('Passos', PassosSchema);

