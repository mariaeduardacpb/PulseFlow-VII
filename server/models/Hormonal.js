import mongoose from 'mongoose';

const hormonalSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
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
});

const Hormonal = mongoose.model('Hormonal', hormonalSchema);
export default Hormonal;
