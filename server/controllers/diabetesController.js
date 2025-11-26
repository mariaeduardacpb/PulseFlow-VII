
// controllers/diabetesController.js
import mongoose from 'mongoose';
import Diabetes from '../models/Diabetes.js';
import Paciente from '../models/Paciente.js';

// Paciente registra sua glicemia
export const registrarDiabetes = async (req, res) => {
  const { data, glicemia, unidade } = req.body;
  const pacienteId = req.user.id;

  try {
    // Converter pacienteId para ObjectId se necessário
    const pacienteObjectId = mongoose.Types.ObjectId.isValid(pacienteId) 
      ? (typeof pacienteId === 'string' ? new mongoose.Types.ObjectId(pacienteId) : pacienteId)
      : new mongoose.Types.ObjectId(pacienteId);
    
    // Processar data - pode vir como string ISO ou no formato YYYY-MM-DD
    let dataCorrigida;
    if (typeof data === 'string' && data.includes('T')) {
      // Se for string ISO, usar diretamente
      dataCorrigida = new Date(data);
    } else {
      // Se for formato YYYY-MM-DD, processar
      const [ano, mes, dia] = data.split('-');
      dataCorrigida = new Date(ano, mes - 1, dia, 12);
    }

    const novoRegistro = new Diabetes({
      pacienteId: pacienteObjectId, // Campo correto conforme MongoDB
      paciente: pacienteObjectId, // Mantém compatibilidade
      data: dataCorrigida,
      glicemia: Number(glicemia),
      unidade: unidade || 'mg/dL'
    });

    await novoRegistro.save();
    console.log(`[registrarDiabetes] Registro salvo com sucesso - pacienteId: ${pacienteObjectId.toString()}, glicemia: ${glicemia}, data: ${dataCorrigida}`);
    res.status(201).json({ message: 'Registro de glicemia salvo com sucesso' });
  } catch (error) {
    console.error('[registrarDiabetes] Erro ao registrar glicemia:', error);
    res.status(500).json({ message: 'Erro ao registrar glicemia', error: error.message });
  }
};

// Médico busca dados de um paciente pelo CPF
export const buscarDiabetesMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    console.log(`[buscarDiabetesMedico] Buscando dados - CPF: ${cpf}, Mês: ${month}, Ano: ${year}`);
    
    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    if (!paciente) {
      console.log(`[buscarDiabetesMedico] Paciente não encontrado para CPF: ${cpf}`);
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    console.log(`[buscarDiabetesMedico] Paciente encontrado: ${paciente._id.toString()}`);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    
    console.log(`[buscarDiabetesMedico] Período: ${startDate.toISOString()} até ${endDate.toISOString()}`);

    // Garantir que pacienteId é um ObjectId válido
    const pacienteIdObj = paciente._id;
    const pacienteIdString = pacienteIdObj.toString();
    
    console.log(`[buscarDiabetesMedico] Buscando registros para pacienteId: ${pacienteIdString}`);
    
    // Tentar múltiplas formas de busca para garantir que encontramos os dados
    // 1. Buscar pelo pacienteId como ObjectId
    let registros = await Diabetes.find({
      $or: [
        { pacienteId: pacienteIdObj },
        { pacienteId: new mongoose.Types.ObjectId(pacienteIdString) },
        { pacienteId: pacienteIdString },
        { paciente: pacienteIdObj },
        { paciente: new mongoose.Types.ObjectId(pacienteIdString) },
        { paciente: pacienteIdString }
      ],
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });
    
    console.log(`[buscarDiabetesMedico] Registros encontrados com filtro de data: ${registros.length}`);
    
    // Se não encontrar com filtro de data, buscar sem filtro para debug
    if (registros.length === 0) {
      const todosRegistros = await Diabetes.find({
        $or: [
          { pacienteId: pacienteIdObj },
          { pacienteId: new mongoose.Types.ObjectId(pacienteIdString) },
          { pacienteId: pacienteIdString },
          { paciente: pacienteIdObj },
          { paciente: new mongoose.Types.ObjectId(pacienteIdString) },
          { paciente: pacienteIdString }
        ]
      }).sort({ data: 1 });
      
      console.log(`[buscarDiabetesMedico] Total de registros encontrados (sem filtro de data): ${todosRegistros.length}`);
      
      if (todosRegistros.length > 0) {
        console.log(`[buscarDiabetesMedico] Primeiro registro encontrado:`, {
          _id: todosRegistros[0]._id?.toString(),
          pacienteId: todosRegistros[0].pacienteId?.toString(),
          paciente: todosRegistros[0].paciente?.toString(),
          data: todosRegistros[0].data,
          glicemia: todosRegistros[0].glicemia,
          dataString: todosRegistros[0].data?.toString()
        });
        
        // Filtrar manualmente os registros que estão no período
        registros = todosRegistros.filter(r => {
          const dataRegistro = r.data instanceof Date ? r.data : new Date(r.data);
          return dataRegistro >= startDate && dataRegistro < endDate;
        });
        
        console.log(`[buscarDiabetesMedico] Registros após filtro manual de data: ${registros.length}`);
      }
    }

    // Mapear os dados corretamente
    const data = registros.map(r => {
      const dataObj = r.data instanceof Date ? r.data : new Date(r.data);
      const dia = dataObj.getDate();
      // Buscar glicemia no registro
      const nivelGlicemia = r.glicemia || r.nivelGlicemia || 0;
      return { dia, nivelGlicemia };
    });

    // Calcular estatísticas
    const total = registros.length;
    const media = total > 0 
      ? registros.reduce((sum, r) => sum + (r.glicemia || r.nivelGlicemia || 0), 0) / total 
      : 0;
    const normais = registros.filter(r => {
      const valor = r.glicemia || r.nivelGlicemia || 0;
      return valor >= 70 && valor <= 100; // Valores normais de glicemia em jejum
    }).length;

    console.log(`[buscarDiabetesMedico] Retornando ${total} registros, média: ${media.toFixed(1)}, normais: ${normais}`);

    res.json({ 
      paciente: paciente.nome || paciente.name, 
      data,
      stats: {
        total,
        media: Math.round(media * 10) / 10, // Arredondar para 1 casa decimal
        normais
      }
    });
  } catch (error) {
    console.error('[buscarDiabetesMedico] Erro ao buscar dados de glicemia por CPF:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

// Paciente busca seus próprios dados
export const buscarDiabetesPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    console.log(`[buscarDiabetesPaciente] Buscando dados - pacienteId: ${pacienteId}, Mês: ${month}, Ano: ${year}`);
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    
    // Converter para ObjectId se necessário
    const pacienteIdString = pacienteId.toString();
    const pacienteObjectId = mongoose.Types.ObjectId.isValid(pacienteId) 
      ? (typeof pacienteId === 'string' ? new mongoose.Types.ObjectId(pacienteId) : pacienteId)
      : new mongoose.Types.ObjectId(pacienteId);
    
    console.log(`[buscarDiabetesPaciente] Buscando registros para pacienteId: ${pacienteIdString}`);
    
    // Buscar usando múltiplas formas para garantir que encontramos os dados
    let registros = await Diabetes.find({
      $or: [
        { pacienteId: pacienteObjectId },
        { pacienteId: new mongoose.Types.ObjectId(pacienteIdString) },
        { pacienteId: pacienteIdString },
        { paciente: pacienteObjectId },
        { paciente: new mongoose.Types.ObjectId(pacienteIdString) },
        { paciente: pacienteIdString }
      ],
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });
    
    console.log(`[buscarDiabetesPaciente] Registros encontrados com filtro de data: ${registros.length}`);
    
    // Se não encontrar com filtro de data, buscar sem filtro e filtrar manualmente
    if (registros.length === 0) {
      const todosRegistros = await Diabetes.find({
        $or: [
          { pacienteId: pacienteObjectId },
          { pacienteId: new mongoose.Types.ObjectId(pacienteIdString) },
          { pacienteId: pacienteIdString },
          { paciente: pacienteObjectId },
          { paciente: new mongoose.Types.ObjectId(pacienteIdString) },
          { paciente: pacienteIdString }
        ]
      }).sort({ data: 1 });
      
      console.log(`[buscarDiabetesPaciente] Total de registros encontrados (sem filtro de data): ${todosRegistros.length}`);
      
      if (todosRegistros.length > 0) {
        // Filtrar manualmente os registros que estão no período
        registros = todosRegistros.filter(r => {
          const dataRegistro = r.data instanceof Date ? r.data : new Date(r.data);
          return dataRegistro >= startDate && dataRegistro < endDate;
        });
        
        console.log(`[buscarDiabetesPaciente] Registros após filtro manual de data: ${registros.length}`);
      }
    }

    const data = registros.map(r => {
      const dataObj = r.data instanceof Date ? r.data : new Date(r.data);
      const dia = dataObj.getDate();
      const nivelGlicemia = r.glicemia || r.nivelGlicemia || 0;
      return { dia, nivelGlicemia };
    });

    // Calcular estatísticas
    const total = registros.length;
    const media = total > 0 
      ? registros.reduce((sum, r) => sum + (r.glicemia || r.nivelGlicemia || 0), 0) / total 
      : 0;
    const normais = registros.filter(r => {
      const valor = r.glicemia || r.nivelGlicemia || 0;
      return valor >= 70 && valor <= 100; // Valores normais de glicemia em jejum
    }).length;

    res.json({ 
      data,
      stats: {
        total,
        media: Math.round(media * 10) / 10, // Arredondar para 1 casa decimal
        normais
      }
    });
  } catch (error) {
    console.error('[buscarDiabetesPaciente] Erro ao buscar dados de glicemia do próprio paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};