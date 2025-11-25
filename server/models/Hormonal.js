import mongoose from 'mongoose';

const hormonalSchema = new mongoose.Schema({
  // App mobile usa 'paciente' como string
  paciente: {
    type: mongoose.Schema.Types.Mixed, // Aceita ObjectId ou string
    ref: 'Paciente',
    required: true
  },
  hormonio: {
    type: String,
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  data: {
    type: Date,
    required: true
  }
}, {
  collection: 'hormonais' // Nome da coleção usado pelo app mobile
});

const Hormonal = mongoose.model('Hormonal', hormonalSchema);
export default Hormonal;
