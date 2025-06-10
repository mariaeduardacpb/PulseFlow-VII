import { CriseGastrite } from '../models/criseGastriteModel.js';
import Paciente from '../models/Paciente.js';
import mongoose from 'mongoose';

// Buscar todas as crises de um paciente
export const getCrises = async (req, res) => {
    try {
        const { cpf } = req.params;
        console.log('Backend: Buscando crises para CPF:', cpf);
        console.log('Backend: Query parameters recebidos:', req.query);

        // Busca o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        console.log('Paciente encontrado:', paciente ? 'Sim' : 'Não');

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

        console.log('Backend: Pipeline de agregação final:', JSON.stringify(pipeline, null, 2));

        const crises = await CriseGastrite.aggregate(pipeline);
        console.log('Backend: Crises encontradas (' + crises.length + '):', crises.map(c => ({ id: c._id, data: c.data, intensidadeDor: c.intensidadeDor })));

        res.json(crises);
    } catch (error) {
        console.error('Erro ao buscar crises:', error);
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
        console.error('Erro ao buscar crise:', error);
        res.status(500).json({ message: 'Erro ao buscar crise' });
    }
};

// Criar uma nova crise
export const createCrise = async (req, res) => {
    try {
        const { cpfPaciente, data, intensidadeDor, sintomas, alimentosIngeridos, medicacao, alivioMedicacao, observacoes } = req.body;

        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpfPaciente.replace(/[^\d]/g, '') });
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
        console.error('Erro ao criar crise:', error);
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
        console.error('Erro ao atualizar crise:', error);
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
        console.error('Erro ao deletar crise:', error);
        res.status(500).json({ message: 'Erro ao deletar crise' });
    }
};

// Buscar detalhes de uma crise específica
export const getCriseDetails = async (req, res) => {
    try {
        const { cpf, id } = req.params;

        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
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
        console.error('Erro ao buscar detalhes da crise:', error);
        res.status(500).json({ message: 'Erro ao buscar detalhes da crise' });
    }
};