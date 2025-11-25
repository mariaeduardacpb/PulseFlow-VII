
// controllers/diabetesController.js
import Diabetes from '../models/Diabetes.js';
import Paciente from '../models/Paciente.js';

// Paciente registra sua glicemia
export const registrarDiabetes = async (req, res) => {
  const { data, glicemia } = req.body;
  const pacienteId = req.user.id;

  try {
    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const novoRegistro = new Diabetes({
      paciente: pacienteId,
      pacienteId: pacienteId,
      data: dataCorrigida,
      glicemia: Number(glicemia),
      nivelGlicemia: Number(glicemia)
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Registro de glicemia salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar glicemia:', error);
    res.status(500).json({ message: 'Erro ao registrar glicemia' });
  }
};

// Médico busca dados de um paciente pelo CPF
export const buscarDiabetesMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    console.log('🔍 Buscando diabetes - CPF recebido:', cpf, 'Mês:', month, 'Ano:', year);
    
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
    let registros = await Diabetes.find({
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
        glicemia: registros[0].glicemia
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
      
      const dia = dataRegistro.getDate();
      const nivelGlicemia = r.glicemia || r.nivelGlicemia || r._doc?.glicemia || r._doc?.nivelGlicemia || 0;
      return { dia, nivelGlicemia };
    });

    console.log('📈 Dados processados:', data.length, 'registros');
    if (data.length > 0) {
      console.log('Primeiros registros:', data.slice(0, 3));
    }

    // Calcular estatísticas
    const total = data.length;
    const soma = data.reduce((acc, d) => acc + (d.nivelGlicemia || 0), 0);
    const media = total > 0 ? soma / total : 0;
    const normais = data.filter(d => {
      const glicemia = d.nivelGlicemia || 0;
      return glicemia >= 70 && glicemia <= 100; // Valores normais de glicemia em jejum
    }).length;

    const response = { 
      paciente: paciente.nome || paciente.name,
      data,
      stats: {
        total,
        media: Math.round(media * 10) / 10, // Arredondar para 1 casa decimal
        normais
      }
    };
    
    console.log('✅ Resposta enviada:', { 
      paciente: response.paciente, 
      totalRegistros: response.data.length,
      stats: response.stats 
    });

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar dados de glicemia por CPF:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Paciente busca seus próprios dados
export const buscarDiabetesPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Diabetes.find({
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
      
      const dia = dataRegistro.getDate();
      const nivelGlicemia = r.glicemia || r.nivelGlicemia || r._doc?.glicemia || r._doc?.nivelGlicemia || 0;
      return { dia, nivelGlicemia };
    });

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados de glicemia do próprio paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};