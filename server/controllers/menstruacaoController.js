import { Menstruacao } from '../models/menstruacaoModel.js';
import Paciente from '../models/Paciente.js';

// Criar novo registro de menstruação
export const criarRegistro = async (req, res) => {
    try {
        const { cpfPaciente, dataInicio, dataFim, teveColica, intensidadeColica, fluxo, humor, observacoes } = req.body;
        
        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpfPaciente.replace(/[^\d]/g, '') });
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const registro = new Menstruacao({
            paciente: paciente._id,
            cpfPaciente,
            dataInicio,
            dataFim,
            teveColica,
            intensidadeColica: teveColica ? intensidadeColica : undefined,
            fluxo,
            humor,
            observacoes
        });

        await registro.save();
        res.status(201).json(registro);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Obter todos os registros de um paciente
export const obterRegistros = async (req, res) => {
    try {
        const { cpf } = req.params;
        if (!cpf) {
            return res.status(400).json({ message: 'CPF não fornecido' });
        }

        const registros = await Menstruacao.find({ cpfPaciente: cpf })
            .sort({ dataInicio: -1 });
        res.status(200).json(registros);
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        res.status(500).json({ message: 'Erro ao buscar registros de menstruação' });
    }
};

// Obter um registro específico
export const obterRegistro = async (req, res) => {
    try {
        const { cpf, id } = req.params;
        if (!cpf || !id) {
            return res.status(400).json({ message: 'CPF ou ID não fornecidos' });
        }

        const registro = await Menstruacao.findOne({
            _id: id,
            cpfPaciente: cpf
        });

        if (!registro) {
            return res.status(404).json({ message: 'Registro não encontrado' });
        }

        res.status(200).json(registro);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Atualizar um registro
export const atualizarRegistro = async (req, res) => {
    try {
        const { cpf, id } = req.params;
        if (!cpf || !id) {
            return res.status(400).json({ message: 'CPF ou ID não fornecidos' });
        }

        const { dataInicio, dataFim, teveColica, intensidadeColica, fluxo, humor, observacoes } = req.body;
        
        const registro = await Menstruacao.findOne({
            _id: id,
            cpfPaciente: cpf
        });

        if (!registro) {
            return res.status(404).json({ message: 'Registro não encontrado' });
        }

        registro.dataInicio = dataInicio;
        registro.dataFim = dataFim;
        registro.teveColica = teveColica;
        registro.intensidadeColica = teveColica ? intensidadeColica : undefined;
        registro.fluxo = fluxo;
        registro.humor = humor;
        registro.observacoes = observacoes;

        await registro.save();
        res.status(200).json(registro);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir um registro
export const excluirRegistro = async (req, res) => {
    try {
        const { cpf, id } = req.params;
        if (!cpf || !id) {
            return res.status(400).json({ message: 'CPF ou ID não fornecidos' });
        }

        const registro = await Menstruacao.findOneAndDelete({
            _id: id,
            cpfPaciente: cpf
        });

        if (!registro) {
            return res.status(404).json({ message: 'Registro não encontrado' });
        }

        res.status(200).json({ message: 'Registro excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 