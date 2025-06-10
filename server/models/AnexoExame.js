import mongoose from 'mongoose';

const exameSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  }
});

const Exame = mongoose.model('Exame', exameSchema);
export default Exame;