import mongoose from 'mongoose';

const eventoClinicoSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  dataHora: {
    type: Date,
    required: true
  },
  tipoEvento: {
    type: String,
    required: true,
    enum: [
      'Crise / Emergência',
      'Acompanhamento de Condição Crônica',
      'Episódio Psicológico ou Emocional',
      'Evento Relacionado à Medicação'
    ]
  },
  especialidade: {
    type: String,
    required: true,
    enum: [
      'Cardiologia',
      'Dermatologia',
      'Endocrinologia',
      'Gastroenterologia',
      'Ginecologia',
      'Neurologia',
      'Psiquiatria'
    ]
  },
  intensidadeDor: {
    type: String,
    required: true,
    enum: ['na', '0', '1-3', '4-6', '7-9', '10']
  },
  alivio: {
    type: String,
    required: true,
    enum: ['Sim', 'Parcial', 'Não', 'Não se Aplica']
  },
  descricao: {
    type: String,
    required: true
  },
  sintomas: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('EventoClinico', eventoClinicoSchema); 