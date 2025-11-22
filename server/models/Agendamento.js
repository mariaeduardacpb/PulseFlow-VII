import mongoose from 'mongoose';

const agendamentoSchema = new mongoose.Schema({
  medicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true,
    index: true
  },
  pacienteNome: {
    type: String,
    required: true
  },
  pacienteEmail: {
    type: String
  },
  pacienteTelefone: {
    type: String
  },
  dataHora: {
    type: Date,
    required: false,
    index: true
  },
  data: {
    type: Date,
    required: true,
    index: true
  },
  horaInicio: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  horaFim: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  tipoConsulta: {
    type: String,
    enum: ['presencial', 'online', 'domiciliar'],
    default: 'presencial',
    required: true
  },
  status: {
    type: String,
    enum: ['agendada', 'confirmada', 'cancelada', 'realizada', 'remarcada'],
    default: 'agendada',
    required: true,
    index: true
  },
  motivoConsulta: {
    type: String,
    required: true
  },
  observacoes: {
    type: String,
    default: ''
  },
  duracao: {
    type: Number,
    default: 30, // duração padrão em minutos
    required: true
  },
  endereco: {
    logradouro: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String
  },
  linkVideochamada: {
    type: String
  },
  lembreteEnviado: {
    type: Boolean,
    default: false
  },
  dataLembrete: {
    type: Date
  },
  canceladoPor: {
    type: String,
    enum: ['medico', 'paciente', 'sistema']
  },
  motivoCancelamento: {
    type: String
  },
  dataCancelamento: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices compostos para melhor performance
agendamentoSchema.index({ medicoId: 1, dataHora: 1 });
agendamentoSchema.index({ pacienteId: 1, dataHora: 1 });
agendamentoSchema.index({ status: 1, dataHora: 1 });
agendamentoSchema.index({ medicoId: 1, status: 1, dataHora: 1 });
agendamentoSchema.index({ medicoId: 1, data: 1 });
agendamentoSchema.index({ pacienteId: 1, data: 1 });
agendamentoSchema.index({ medicoId: 1, data: 1, horaInicio: 1 });

// Middleware para atualizar updatedAt antes de salvar
agendamentoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Agendamento = mongoose.model('Agendamento', agendamentoSchema, 'agendamentos');

export default Agendamento;

