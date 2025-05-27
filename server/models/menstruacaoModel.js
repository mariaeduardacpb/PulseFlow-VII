import mongoose from 'mongoose';

const menstruacaoSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    dataInicio: {
        type: Date,
        required: true
    },
    dataFim: {
        type: Date,
        required: true
    },
    teveColica: {
        type: Boolean,
        required: true
    },
    intensidadeColica: {
        type: Number,
        min: 0,
        max: 10,
        required: function() {
            return this.teveColica === true;
        }
    },
    fluxo: {
        type: String,
        enum: ['Leve', 'Moderado', 'Intenso'],
        required: true
    },
    humor: {
        type: String,
        enum: ['Estável', 'Irritável', 'Ansioso', 'Deprimido', 'Outro'],
        required: true
    },
    observacoes: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

export const Menstruacao = mongoose.model('Menstruacao', menstruacaoSchema); 