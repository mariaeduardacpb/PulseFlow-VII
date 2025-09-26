import { CriseGastrite } from '../models/criseGastriteModel.js';
import Paciente from '../models/Paciente.js';
import mongoose from 'mongoose';

// Buscar todas as crises de um paciente
export const getCrises = async (req, res) => {
    try {
        const { cpf } = req.params;

        // Tentar buscar com CPF limpo primeiro
        let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
        
        // Se não encontrar, tentar com CPF formatado
        if (!paciente) {
            const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            paciente = await Paciente.findOne({ cpf: cpfFormatado });
        }
        
        // Se ainda não encontrar, tentar com o CPF original
        if (!paciente) {
            paciente = await Paciente.findOne({ cpf: cpf });
        }

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const initialMatch = { paciente: paciente._id }; // Initial match for patient ID
        const dateMatch = {}; // This will hold $month and $year conditions for aggregation

        if (req.query.month) {
            const month = parseInt(req.query.month, 10);
            dateMatch['$expr'] = { $eq: [{ $month: '$data' }, month] };
        }

        if (req.query.year) {
            const year = parseInt(req.query.year, 10);
            if (dateMatch['$expr']) {
                // If month is already present, combine with year
                dateMatch['$expr'] = { $and: [dateMatch['$expr'], { $eq: [{ $year: '$data' }, year] }] };
            } else {
                // Otherwise, just filter by year
                dateMatch['$expr'] = { $eq: [{ $year: '$data' }, year] };
            }
        }

        if (req.query.intensity) {
            const [min, max] = req.query.intensity.split('-').map(Number);
            initialMatch.intensidadeDor = { $gte: min, $lte: max }; // Intensity can be filtered directly in initial $match
        }

        // Build the aggregation pipeline
        const pipeline = [
            { $match: initialMatch } // Start with patient ID and intensity
        ];

        if (Object.keys(dateMatch).length > 0) {
            pipeline.push({ $match: dateMatch }); // Add date filtering if applicable
        }

        pipeline.push({ $sort: { data: -1 } }); // Sort by data

        const crises = await CriseGastrite.aggregate(pipeline);

        res.json(crises);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar crises' });
    }
};

// Buscar uma crise específica
export const getCrise = async (req, res) => {
    try {
        const { id } = req.params;
        const crise = await CriseGastrite.findById(id);
        
        if (!crise) {
            return res.status(404).json({ message: 'Crise não encontrada' });
        }

        res.json(crise);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar crise' });
    }
};

// Criar uma nova crise
export const createCrise = async (req, res) => {
    try {
        const { cpfPaciente, data, intensidadeDor, sintomas, alimentosIngeridos, medicacao, alivioMedicacao, observacoes } = req.body;

        // Tentar buscar com CPF limpo primeiro
        let paciente = await Paciente.findOne({ cpf: cpfPaciente?.replace(/[^\d]/g, '') });
        
        // Se não encontrar, tentar com CPF formatado
        if (!paciente) {
            const cpfFormatado = cpfPaciente?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            paciente = await Paciente.findOne({ cpf: cpfFormatado });
        }
        
        // Se ainda não encontrar, tentar com o CPF original
        if (!paciente) {
            paciente = await Paciente.findOne({ cpf: cpfPaciente });
        }

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const crise = new CriseGastrite({
            paciente: paciente._id,
            data,
            intensidadeDor,
            sintomas,
            alimentosIngeridos,
            medicacao,
            alivioMedicacao,
            observacoes
        });

        await crise.save();
        res.status(201).json(crise);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar uma crise
export const updateCrise = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const crise = await CriseGastrite.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!crise) {
            return res.status(404).json({ message: 'Crise não encontrada' });
        }

        res.json(crise);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar crise' });
    }
};

// Deletar uma crise
export const deleteCrise = async (req, res) => {
    try {
        const { id } = req.params;
        const crise = await CriseGastrite.findByIdAndDelete(id);

        if (!crise) {
            return res.status(404).json({ message: 'Crise não encontrada' });
        }

        res.json({ message: 'Crise deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar crise' });
    }
};

// Buscar detalhes de uma crise específica
export const getCriseDetails = async (req, res) => {
    try {
        const { cpf, id } = req.params;

        // Tentar buscar com CPF limpo primeiro
        let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
        
        // Se não encontrar, tentar com CPF formatado
        if (!paciente) {
            const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            paciente = await Paciente.findOne({ cpf: cpfFormatado });
        }
        
        // Se ainda não encontrar, tentar com o CPF original
        if (!paciente) {
            paciente = await Paciente.findOne({ cpf: cpf });
        }

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const crise = await CriseGastrite.findOne({
            _id: id,
            paciente: paciente._id
        });

        if (!crise) {
            return res.status(404).json({ message: 'Crise não encontrada' });
        }

        res.json(crise);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes da crise' });
    }
};

// Médico busca crises de um paciente pelo CPF
export const buscarCrisesMedico = async (req, res) => {
    try {
        const { cpf } = req.query;

        // Tentar buscar com CPF limpo primeiro
        let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
        
        // Se não encontrar, tentar com CPF formatado
        if (!paciente) {
            const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            paciente = await Paciente.findOne({ cpf: cpfFormatado });
        }
        
        // Se ainda não encontrar, tentar com o CPF original
        if (!paciente) {
            paciente = await Paciente.findOne({ cpf: cpf });
        }

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const crises = await CriseGastrite.find({ paciente: paciente._id })
            .populate('paciente', 'name nome cpf email')
            .sort({ data: -1 });

        res.json(crises);
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};