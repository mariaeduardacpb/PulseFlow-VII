import CicloMenstrual from '../models/CicloMenstrual.js';
import Paciente from '../models/Paciente.js';
import mongoose from 'mongoose';

export const salvarCiclo = async (req, res) => {
  try {
    const { cpf, dataInicio, dataFim } = req.body;

    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const novoCiclo = new CicloMenstrual({
      pacienteId: paciente._id,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });

    await novoCiclo.save();
    res.status(201).json({ message: 'Ciclo salvo com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar ciclo:', err);
    res.status(500).json({ message: 'Erro interno ao salvar ciclo' });
  }
};

export const listarCiclos = async (req, res) => {
  try {
    const { cpf } = req.params;
    console.log(`[listarCiclos] Recebido CPF: ${cpf}`);

    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    console.log(`[listarCiclos] Paciente encontrado: ${paciente ? paciente._id : 'Nenhum'}`);

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const pacienteObjectId = paciente._id;
    const query = { pacienteId: pacienteObjectId };
    console.log(`[listarCiclos] Executando consulta: ${JSON.stringify(query)}`);

    const ciclos = await CicloMenstrual.find({ pacienteId: new mongoose.Types.ObjectId(paciente._id) });
    console.log(`[listarCiclos] Resultado da consulta (quantidade): ${ciclos.length}`);
    console.log(`[listarCiclos] Resultado da consulta (dados): ${JSON.stringify(ciclos, null, 2)}`);

    ciclos.forEach((ciclo, index) => {
      console.log(`[listarCiclos] Ciclo ${index + 1}:`, {
        id: ciclo._id,
        dataInicio: ciclo.dataInicio,
        dataFim: ciclo.dataFim,
        pacienteId: ciclo.pacienteId,
        rawData: ciclo.toObject()
      });
    });

    const ciclosJSON = JSON.stringify(ciclos);
    console.log(`[listarCiclos] Ciclos serializados: ${ciclosJSON}`);

    res.status(200).json(ciclos);
  } catch (err) {
    console.error('Erro ao buscar ciclos:', err);
    res.status(500).json({ message: 'Erro interno ao buscar ciclos' });
  }
};

export const debugCiclos = async (req, res) => {
  try {
    const { cpf } = req.params;
    console.log(`[debugCiclos] Recebido CPF: ${cpf}`);

    // Buscar todos os ciclos no banco
    const todosCiclos = await CicloMenstrual.find({});
    console.log(`[debugCiclos] Total de ciclos no banco: ${todosCiclos.length}`);

    // Buscar ciclos do paciente específico
    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ 
        message: 'Paciente não encontrado',
        debug: {
          totalCiclos: todosCiclos.length,
          ciclosEncontrados: todosCiclos.map(c => ({
            id: c._id,
            pacienteId: c.pacienteId,
            dataInicio: c.dataInicio,
            dataFim: c.dataFim
          }))
        }
      });
    }

    const ciclosPaciente = await CicloMenstrual.find({ 
      pacienteId: new mongoose.Types.ObjectId(paciente._id) 
    });

    console.log(`[debugCiclos] Ciclos do paciente:`, {
      pacienteId: paciente._id,
      cpf: cpf,
      totalCiclos: ciclosPaciente.length,
      ciclos: ciclosPaciente.map(c => ({
        id: c._id,
        dataInicio: c.dataInicio,
        dataFim: c.dataFim
      }))
    });

    res.status(200).json({
      message: 'Debug de ciclos',
      debug: {
        totalCiclosNoBanco: todosCiclos.length,
        ciclosDoPaciente: ciclosPaciente.length,
        ciclos: ciclosPaciente.map(c => ({
          id: c._id,
          dataInicio: c.dataInicio,
          dataFim: c.dataFim
        }))
      }
    });
  } catch (err) {
    console.error('Erro ao debugar ciclos:', err);
    res.status(500).json({ 
      message: 'Erro interno ao debugar ciclos',
      error: err.message
    });
  }
};
