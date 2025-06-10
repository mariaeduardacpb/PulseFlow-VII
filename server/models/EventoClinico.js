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
      'Acupuntura',
      'Alergia e imunologia',
      'Anestesiologia',
      'Angiologia',
      'Cardiologia',
      'Cirurgia cardiovascular',
      'Cirurgia da mão',
      'Cirurgia de cabeça e pescoço',
      'Cirurgia do aparelho digestivo',
      'Cirurgia geral',
      'Cirurgia oncológica',
      'Cirurgia pediátrica',
      'Cirurgia plástica',
      'Cirurgia torácica',
      'Cirurgia vascular',
      'Clínica médica',
      'Coloproctologia',
      'Dermatologia',
      'Endocrinologia e metabologia',
      'Endoscopia',
      'Gastroenterologia',
      'Genética médica',
      'Geriatria',
      'Ginecologia e obstetrícia',
      'Hematologia e hemoterapia',
      'Homeopatia',
      'Infectologia',
      'Mastologia',
      'Medicina de emergência',
      'Medicina de família e comunidade',
      'Medicina do trabalho',
      'Medicina do tráfego',
      'Medicina esportiva',
      'Medicina física e reabilitação',
      'Medicina intensiva',
      'Medicina legal e perícia médica',
      'Medicina nuclear',
      'Medicina preventiva e social',
      'Nefrologia',
      'Neurocirurgia',
      'Neurologia',
      'Nutrologia',
      'Oftalmologia',
      'Oncologia clínica',
      'Ortopedia e traumatologia',
      'Otorrinolaringologia',
      'Patologia',
      'Patologia clínica/medicina laboratorial',
      'Pediatria',
      'Pneumologia',
      'Psiquiatria',
      'Radiologia e diagnóstico por imagem',
      'Radioterapia',
      'Reumatologia',
      'Urologia'
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