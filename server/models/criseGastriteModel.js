import mongoose from 'mongoose';

const criseGastriteSchema = new mongoose.Schema({
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    data: {
        type: Date,
        required: true
    },
    intensidadeDor: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    sintomas: {
        type: String,
        required: false
    },
    alimentosIngeridos: {
        type: String,
        required: false
    },
    medicacao: {
        type: String,
        required: false
    },
    alivioMedicacao: {
        type: Boolean,
        required: true
    },
    observacoes: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

export const CriseGastrite = mongoose.model('CriseGastrite', criseGastriteSchema); 