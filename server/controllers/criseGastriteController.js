import { CriseGastrite } from '../models/criseGastriteModel.js';
import Paciente from '../models/Paciente.js';
import mongoose from 'mongoose';

// Buscar todas as crises de um paciente
export const getCrises = async (req, res) => {
    try {
        const { cpf } = req.params;
        console.log('Buscando crises para CPF:', cpf);

        // Busca o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        console.log('Paciente encontrado:', paciente ? 'Sim' : 'Não');

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        // Busca as crises do paciente
        const query = { paciente: paciente._id };
        console.log('Query para buscar crises:', query);

        // Aplica filtros se fornecidos
        if (req.query.month) {
            const [year, month] = req.query.month.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            query.data = { $gte: startDate, $lte: endDate };
        }

        if (req.query.year) {
            const startDate = new Date(req.query.year, 0, 1);
            const endDate = new Date(req.query.year, 11, 31);
            query.data = { $gte: startDate, $lte: endDate };
        }

        if (req.query.intensity) {
            const [min, max] = req.query.intensity.split('-').map(Number);
            query.intensidadeDor = { $gte: min, $lte: max };
        }

        console.log('Query final:', query);

        const crises = await CriseGastrite.find(query).sort({ data: -1 });
        console.log('Crises encontradas:', crises.length);

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