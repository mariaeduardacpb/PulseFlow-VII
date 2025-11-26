import BatimentosCardiacos from '../models/BatimentosCardiacos.js';
import Paciente from '../models/Paciente.js';

export const registrarBatimentos = async (req, res) => {
  const { data, batimentos } = req.body;
  const pacienteId = req.user.id;

  try {
    // Processar data - pode ser ISO8601 string ou formato YYYY-MM-DD
    let dataCorrigida;
    if (typeof data === 'string' && data.includes('T')) {
      // ISO8601 string
      dataCorrigida = new Date(data);
    } else if (typeof data === 'string') {
      // Formato YYYY-MM-DD
      const [ano, mes, dia] = data.split('-');
      dataCorrigida = new Date(ano, mes - 1, dia, 12);
    } else {
      dataCorrigida = new Date(data);
    }

    const novoRegistro = new BatimentosCardiacos({
      paciente: pacienteId,
      pacienteId: pacienteId,
      data: dataCorrigida,
      valor: Number(batimentos),
      batimentos: Number(batimentos) // Mantém para compatibilidade
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Registro de batimentos cardíacos salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar batimentos cardíacos:', error);
    res.status(500).json({ message: 'Erro ao registrar batimentos cardíacos' });
  }
};

export const buscarBatimentosMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    console.log('🔍 Buscando batimentos cardíacos - CPF recebido:', cpf, 'Mês:', month, 'Ano:', year);
    
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

    // Buscar registros - o app mobile usa 'pacienteId' como string
    // Tentar buscar com ObjectId e string para garantir compatibilidade
    const pacienteIdString = paciente._id.toString();
    let registros = await BatimentosCardiacos.find({
      $and: [
        {
          $or: [
            { paciente: paciente._id },
            { paciente: pacienteIdString },
            { pacienteId: paciente._id },
            { pacienteId: pacienteIdString }
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
        pacienteId: registros[0].pacienteId,
        data: registros[0].data,
        valor: registros[0].valor,
        batimentos: registros[0].batimentos
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
      
      // Usar 'valor' se existir, senão usar 'batimentos' (compatibilidade)
      const batimentos = r.valor !== undefined && r.valor !== null ? r.valor : (r.batimentos || 0);
      
      return {
        dia: dataRegistro.getDate(),
        batimentos: batimentos
      };
    });

    console.log('📈 Dados processados:', data.length, 'registros');
    if (data.length > 0) {
      console.log('Primeiros registros:', data.slice(0, 3));
    }

    // Calcular estatísticas
    const total = data.length;
    const soma = data.reduce((acc, d) => acc + (d.batimentos || 0), 0);
    const media = total > 0 ? soma / total : 0;
    const normais = data.filter(d => {
      const bpm = d.batimentos || 0;
      return bpm >= 60 && bpm <= 100; // Valores normais de batimentos cardíacos em repouso
    }).length;
    const elevados = data.filter(d => {
      const bpm = d.batimentos || 0;
      return bpm > 100; // Batimentos elevados
    }).length;

    const response = { 
      paciente: paciente.nome || paciente.name,
      data,
      stats: {
        total,
        media: Math.round(media * 10) / 10, // Arredondar para 1 casa decimal
        normais,
        elevados
      }
    };
    
    console.log('✅ Resposta enviada:', { 
      paciente: response.paciente, 
      totalRegistros: response.data.length,
      stats: response.stats 
    });

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar dados de batimentos cardíacos por CPF:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const buscarBatimentosPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await BatimentosCardiacos.find({
      $or: [
        { paciente: pacienteId },
        { pacienteId: pacienteId }
      ],
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

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
      
      // Usar 'valor' se existir, senão usar 'batimentos' (compatibilidade)
      const batimentos = r.valor !== undefined && r.valor !== null ? r.valor : (r.batimentos || 0);
      
      return {
        dia: dataRegistro.getDate(),
        batimentos: batimentos
      };
    });

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados de batimentos cardíacos do próprio paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

