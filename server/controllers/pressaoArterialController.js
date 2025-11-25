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

    // Buscar registros - o app mobile usa 'pacienteId', o web usa 'paciente'
    // MongoDB/Mongoose converte automaticamente strings ISO8601 para Date
    let registros = await PressaoArterial.find({
      $and: [
        {
          $or: [
            { paciente: paciente._id },
            { paciente: paciente._id.toString() },
            { pacienteId: paciente._id },
            { pacienteId: paciente._id.toString() }
          ]
        },
        {
          data: { $gte: startDate, $lt: endDate }
        }
      ]
    }).sort({ data: 1 });
    
    console.log('📊 Busca realizada com $or para paciente/pacienteId');
    
    console.log('📊 Registros encontrados:', registros.length);
    if (registros.length > 0) {
      console.log('Primeiro registro:', {
        paciente: registros[0].paciente,
        data: registros[0].data,
        sistolica: registros[0].sistolica,
        diastolica: registros[0].diastolica
      });
    }

    const data = registros.map(r => {
      // Processar data - pode ser Date object ou ISO8601 string
      let dataRegistro;
      if (r.data instanceof Date) {
        dataRegistro = r.data;
      } else if (typeof r.data === 'string') {
        dataRegistro = new Date(r.data);
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
      paciente: pacienteId,
      data: { $gte: startDate, $lt: endDate }
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
