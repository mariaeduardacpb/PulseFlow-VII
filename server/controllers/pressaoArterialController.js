import PressaoArterial from '../models/PressaoArterial.js';
import Paciente from '../models/Paciente.js';

export const registrarPressao = async (req, res) => {
  const { data, pressao } = req.body;
  const pacienteId = req.user.id;

  try {
    const [sistolicaStr, diastolicaStr] = pressao.split('/');
    const sistolica = Number(sistolicaStr);
    const diastolica = Number(diastolicaStr);

    if (isNaN(sistolica) || isNaN(diastolica)) {
      return res.status(400).json({ message: 'Formato inválido de pressão. Use o formato 120/80.' });
    }

    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const novoRegistro = new PressaoArterial({
      paciente: pacienteId,
      pacienteId: pacienteId,
      data: dataCorrigida,
      sistolica,
      diastolica
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Pressão registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar pressão:', error);
    res.status(500).json({ message: 'Erro ao registrar pressão arterial' });
  }
};

export const buscarPressaoMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    console.log('🔍 Buscando pressão arterial - CPF recebido:', cpf, 'Mês:', month, 'Ano:', year);
    
    // Limpar CPF removendo caracteres não numéricos
    const cpfLimpo = cpf?.replace(/\D/g, '');
    
    // Validar se CPF tem 11 dígitos
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      console.error('❌ CPF inválido:', cpfLimpo);
      return res.status(400).json({ message: 'CPF inválido' });
    }
    
    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    console.log('Tentativa 1 - CPF limpo:', cpfLimpo, 'Resultado:', paciente ? `✅ Encontrado: ${paciente.name || paciente.nome}` : '❌ Não encontrado');
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
      console.log('Tentativa 2 - CPF formatado:', cpfFormatado, 'Resultado:', paciente ? `✅ Encontrado: ${paciente.name || paciente.nome}` : '❌ Não encontrado');
    }
    
    // Se ainda não encontrar, tentar com o CPF original (caso já venha formatado)
    if (!paciente && cpf !== cpfLimpo) {
      paciente = await Paciente.findOne({ cpf: cpf });
      console.log('Tentativa 3 - CPF original:', cpf, 'Resultado:', paciente ? `✅ Encontrado: ${paciente.name || paciente.nome}` : '❌ Não encontrado');
    }
    
    if (!paciente) {
      console.error('❌ Paciente não encontrado com CPF:', cpfLimpo);
      // Buscar exemplos de CPFs no banco para debug
      const pacientesExemplo = await Paciente.find({}).limit(3).select('cpf name');
      console.error('Exemplos de CPFs no banco:', pacientesExemplo.map(p => ({ cpf: p.cpf, name: p.name || p.nome })));
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    console.log('✅ Paciente encontrado:', paciente.name || paciente.nome, 'ID:', paciente._id);

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);
    
    console.log('📅 Buscando registros entre:', startDate, 'e', endDate);
    console.log('🔑 ID do paciente (ObjectId):', paciente._id);
    console.log('🔑 ID do paciente (String):', paciente._id.toString());

    const pacienteObjectId = paciente._id;
    const pacienteString = paciente._id.toString();

    console.log('🔍 Buscando registros de pressão arterial...');
    console.log('   - ObjectId:', pacienteObjectId);
    console.log('   - String:', pacienteString);
    console.log('   - Período:', startDate, 'até', endDate);

    // Primeiro, buscar TODOS os registros do paciente para debug
    const todosRegistros = await PressaoArterial.find({
      $or: [
        { paciente: pacienteObjectId },
        { paciente: pacienteString },
        { pacienteId: pacienteObjectId },
        { pacienteId: pacienteString }
      ]
    }).sort({ data: 1 });
    
    console.log('📊 Total de registros encontrados (sem filtro de data):', todosRegistros.length);
    if (todosRegistros.length > 0) {
      console.log('Primeiros 3 registros:');
      todosRegistros.slice(0, 3).forEach((r, i) => {
        console.log(`  [${i}] ID: ${r._id}`);
        console.log(`      paciente: ${r.paciente}, pacienteId: ${r.pacienteId}`);
        console.log(`      data: ${r.data} (tipo: ${typeof r.data})`);
        console.log(`      valores: ${r.sistolica}/${r.diastolica}`);
      });
    }

    // Filtrar por data manualmente, já que o MongoDB pode ter datas em formatos diferentes
    let registros = todosRegistros.filter(r => {
      let dataRegistro;
      if (r.data instanceof Date) {
        dataRegistro = r.data;
      } else if (typeof r.data === 'string') {
        dataRegistro = new Date(r.data);
      } else if (r.data && r.data.$date) {
        dataRegistro = typeof r.data.$date === 'string' 
          ? new Date(r.data.$date) 
          : new Date(r.data.$date);
      } else {
        dataRegistro = new Date(r.data);
      }
      
      // Verificar se está dentro do período
      return dataRegistro >= startDate && dataRegistro < endDate;
    });
    
    console.log('📊 Registros filtrados por data:', registros.length);
    
    const data = registros.map(r => {
      // Processar data - pode ser Date object ou ISO8601 string
      let dataRegistro;
      if (r.data instanceof Date) {
        dataRegistro = r.data;
      } else if (typeof r.data === 'string') {
        dataRegistro = new Date(r.data);
      } else if (r.data && r.data.$date) {
        dataRegistro = typeof r.data.$date === 'string' 
          ? new Date(r.data.$date) 
          : new Date(r.data.$date);
      } else {
        dataRegistro = new Date(r.data);
      }
      
      return {
        dia: dataRegistro.getDate(),
        sistolica: r.sistolica || 0,
        diastolica: r.diastolica || 0
      };
    });

    console.log('📈 Dados processados:', data.length, 'registros');
    if (data.length > 0) {
      console.log('Primeiros registros:', data.slice(0, 3));
    }

    const response = { 
      paciente: paciente.nome || paciente.name,
      data
    };
    
    console.log('✅ Resposta enviada:', { 
      paciente: response.paciente, 
      totalRegistros: response.data.length
    });

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar dados de pressão:', error);
    res.status(500).json({ message: 'Erro ao buscar dados de pressão arterial' });
  }
};

export const buscarPressaoPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await PressaoArterial.find({
      $and: [
        {
          $or: [
            { paciente: pacienteId },
            { paciente: pacienteId.toString() },
            { pacienteId: pacienteId },
            { pacienteId: pacienteId.toString() }
          ]
        },
        {
          data: { $gte: startDate, $lt: endDate }
        }
      ]
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      sistolica: r.sistolica,
      diastolica: r.diastolica
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    res.status(500).json({ message: 'Erro ao buscar dados de pressão arterial' });
  }
};
