import { Menstruacao } from '../models/menstruacaoModel.js';
import Paciente from '../models/Paciente.js';
import mongoose from 'mongoose'; // Import mongoose to use Types.ObjectId

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
        console.log(`[obterRegistros] Recebido CPF: ${cpf}`);

        if (!cpf) {
            return res.status(400).json({ message: 'CPF não fornecido' });
        }

        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        console.log(`[obterRegistros] Paciente encontrado: ${paciente ? paciente._id : 'Nenhum'}`);

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        // Adicionar log da consulta e resultado
        // Garantir que estamos consultando com um ObjectId e usando o nome do campo correto
        const pacienteObjectId = new mongoose.Types.ObjectId(paciente._id);
        const query = { pacienteId: pacienteObjectId };
        console.log(`[obterRegistros] Executando consulta com ObjectId: ${JSON.stringify(query)}`);

        const registros = await Menstruacao.find(query)
            .sort({ dataInicio: -1 });
        
        console.log(`[obterRegistros] Resultado da consulta (quantidade): ${registros.length}`);
        console.log(`[obterRegistros] Resultado da consulta (dados): ${JSON.stringify(registros)}`);

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

        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const registro = await Menstruacao.findOne({
            _id: id,
            paciente: paciente._id
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

        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const { dataInicio, dataFim, teveColica, intensidadeColica, fluxo, humor, observacoes } = req.body;
        
        const registro = await Menstruacao.findOne({
            _id: id,
            paciente: paciente._id
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

// Médico busca registros de menstruação por CPF
export const buscarMenstruacaoMedico = async (req, res) => {
    try {
        const { cpf } = req.query;
        console.log(`[buscarMenstruacaoMedico] Recebido CPF: ${cpf}`);

        if (!cpf) {
            return res.status(400).json({ message: 'CPF não fornecido' });
        }

        // Tentar buscar com CPF limpo primeiro
        let paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        
        // Se não encontrar, tentar com CPF formatado
        if (!paciente) {
            const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            paciente = await Paciente.findOne({ cpf: cpfFormatado });
        }
        
        // Se ainda não encontrar, tentar com o CPF original
        if (!paciente) {
            paciente = await Paciente.findOne({ cpf: cpf });
        }

        if (!paciente) {
            console.log(`[buscarMenstruacaoMedico] Paciente não encontrado para CPF: ${cpf}`);
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        console.log(`[buscarMenstruacaoMedico] Paciente encontrado: ${paciente._id}`);

        // Buscar registros de menstruação
        const pacienteObjectId = new mongoose.Types.ObjectId(paciente._id);
        const query = { pacienteId: pacienteObjectId };
        console.log(`[buscarMenstruacaoMedico] Executando consulta com ObjectId: ${JSON.stringify(query)}`);

        const registros = await Menstruacao.find(query)
            .sort({ dataInicio: -1 });
        
        console.log(`[buscarMenstruacaoMedico] Resultado da consulta (quantidade): ${registros.length}`);
        console.log(`[buscarMenstruacaoMedico] Resultado da consulta (dados): ${JSON.stringify(registros)}`);

        res.status(200).json(registros);
    } catch (error) {
        console.error('Erro ao buscar registros de menstruação:', error);
        res.status(500).json({ message: 'Erro interno ao buscar registros de menstruação' });
    }
};

// Excluir um registro
export const excluirRegistro = async (req, res) => {
    try {
        const { cpf, id } = req.params;
        if (!cpf || !id) {
            return res.status(400).json({ message: 'CPF ou ID não fornecidos' });
        }

        // Buscar o paciente pelo CPF
        const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }

        const registro = await Menstruacao.findOneAndDelete({
            _id: id,
            paciente: paciente._id
        });

        if (!registro) {
            return res.status(404).json({ message: 'Registro não encontrado' });
        }

        res.status(200).json({ message: 'Registro excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 