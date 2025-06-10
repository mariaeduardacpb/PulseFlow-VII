// models/Insonia.js
import mongoose from 'mongoose';

const InsoniaSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  horasSono: {
    type: Number, // agora é número decimal
    required: true
  },
  qualidadeSono: {
    type: Number, // assume que a nota também é numérica
    required: true
  }
});

export default mongoose.model('Insonia', InsoniaSchema);
