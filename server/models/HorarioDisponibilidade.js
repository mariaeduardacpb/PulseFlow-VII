import mongoose from 'mongoose';

const horarioDisponibilidadeSchema = new mongoose.Schema({
  medicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  diaSemana: {
    type: Number,
    required: function() {
      return !this.dataEspecifica; // Obrigatório se não for data específica
    },
    min: 0, // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    max: 6
  },
  dataEspecifica: {
    type: Date,
    required: function() {
      return !this.diaSemana; // Obrigatório se não for dia da semana
    },
    index: true
  },
  dataFim: {
    type: Date,
    // Opcional: se fornecido, cria horários recorrentes até esta data
  },
  horaInicio: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // Formato HH:MM
  },
  horaFim: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // Formato HH:MM
  },
  duracaoConsulta: {
    type: Number,
    default: 30, // Duração padrão em minutos
    required: true,
    min: 15,
    max: 120
  },
  ativo: {
    type: Boolean,
    default: true
  },
  observacoes: {
    type: String,
    default: ''
  },
  tipo: {
    type: String,
    enum: ['recorrente', 'especifico'],
    default: 'recorrente'
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

// Índice composto para melhor performance
horarioDisponibilidadeSchema.index({ medicoId: 1, diaSemana: 1 });
horarioDisponibilidadeSchema.index({ medicoId: 1, ativo: 1 });
horarioDisponibilidadeSchema.index({ medicoId: 1, dataEspecifica: 1 });
horarioDisponibilidadeSchema.index({ medicoId: 1, dataEspecifica: 1, dataFim: 1 });

// Middleware para atualizar updatedAt antes de salvar
horarioDisponibilidadeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validação: horaFim deve ser maior que horaInicio
horarioDisponibilidadeSchema.pre('save', function(next) {
  const inicio = this.horaInicio.split(':').map(Number);
  const fim = this.horaFim.split(':').map(Number);
  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const fimMinutos = fim[0] * 60 + fim[1];
  
  if (fimMinutos <= inicioMinutos) {
    return next(new Error('Hora de fim deve ser maior que hora de início'));
  }
  
  next();
});

const HorarioDisponibilidade = mongoose.model('HorarioDisponibilidade', horarioDisponibilidadeSchema, 'horariosDisponibilidade');

export default HorarioDisponibilidade;

