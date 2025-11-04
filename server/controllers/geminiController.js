import { GoogleGenerativeAI } from '@google/generative-ai';
import Paciente from '../models/Paciente.js';
import Diabetes from '../models/Diabetes.js';
import Insonia from '../models/Insonia.js';
import PressaoArterial from '../models/PressaoArterial.js';
import AnotacaoMedica from '../models/AnotacaoMedica.js';
import EventoClinico from '../models/EventoClinico.js';
import { CriseGastrite } from '../models/criseGastriteModel.js';
import Enxaqueca from '../models/Enxaqueca.js';
import CicloMenstrual from '../models/CicloMenstrual.js';

// Inicializar Gemini AI (será recriado a cada requisição para garantir que a API key está atualizada)
let genAI = null;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY não configurada');
  }
  // Recriar a instância para garantir que está usando a API key atualizada
  genAI = new GoogleGenerativeAI(apiKey.trim());
  return genAI;
}

// Função para listar modelos disponíveis via API REST
async function listarModelosDisponiveis() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];
    
    // Tentar listar modelos via API REST diretamente
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      console.log(`⚠️ Não foi possível listar modelos via API (status ${response.status})`);
      return [];
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    console.log('📋 Total de modelos encontrados:', models.length);
    
    // Extrair nomes dos modelos que suportam generateContent
    const modelNames = [];
    for (const model of models) {
      if (model.name) {
        // Verificar se suporta generateContent
        const supportedMethods = model.supportedGenerationMethods || [];
        if (supportedMethods.includes('generateContent')) {
          modelNames.push(model.name);
          // Extrair nome curto
          const parts = model.name.split('/');
          if (parts.length > 1) {
            modelNames.push(parts[parts.length - 1]);
          }
          console.log(`  ✅ ${model.name} - suporta generateContent`);
        }
      }
    }
    
    console.log('📋 Modelos disponíveis com generateContent:', modelNames.slice(0, 10));
    return modelNames;
  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error.message);
    // Continuar mesmo se falhar ao listar
    return [];
  }
}

// Função para buscar todos os dados do paciente
export const buscarTodosDadosPaciente = async (cpf) => {
  try {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Validar se CPF tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      console.error('CPF inválido:', cpfLimpo);
      return null;
    }
    
    // Buscar paciente - tentar primeiro com CPF limpo
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    console.log('Tentativa 1 - CPF limpo:', cpfLimpo, 'Resultado:', paciente ? 'Encontrado' : 'Não encontrado');
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
      console.log('Tentativa 2 - CPF formatado:', cpfFormatado, 'Resultado:', paciente ? 'Encontrado' : 'Não encontrado');
    }
    
    // Se ainda não encontrar, tentar com o CPF original (caso já venha formatado)
    if (!paciente && cpf !== cpfLimpo) {
      paciente = await Paciente.findOne({ cpf: cpf });
      console.log('Tentativa 3 - CPF original:', cpf, 'Resultado:', paciente ? 'Encontrado' : 'Não encontrado');
    }
    
    if (!paciente) {
      // Buscar todos os CPFs no banco para debug (apenas os primeiros 5)
      const pacientesExemplo = await Paciente.find({}).limit(5).select('cpf name');
      console.error('Paciente não encontrado com CPF:', cpfLimpo, 'ou', cpf);
      console.error('Exemplos de CPFs no banco:', pacientesExemplo.map(p => ({ cpf: p.cpf, name: p.name || p.nome })));
      return null;
    }
    
    console.log('✅ Paciente encontrado:', paciente.name || paciente.nome, 'CPF:', paciente.cpf);

    // Buscar todos os dados relacionados
    const [
      diabetes,
      insonia,
      pressaoArterial,
      anotacoes,
      eventosClinicos,
      gastrite,
      enxaqueca,
      cicloMenstrual
    ] = await Promise.all([
      Diabetes.find({ paciente: paciente._id }).sort({ data: -1 }).limit(30),
      Insonia.find({ paciente: paciente._id }).sort({ data: -1 }).limit(30),
      PressaoArterial.find({ paciente: paciente._id }).sort({ data: -1 }).limit(30),
      AnotacaoMedica.find({ pacienteId: paciente._id }).sort({ data: -1 }).limit(20),
      EventoClinico.find({ paciente: paciente._id }).sort({ dataHora: -1 }).limit(20),
      CriseGastrite.find({ paciente: paciente._id }).sort({ data: -1 }).limit(20),
      Enxaqueca.find({ pacienteId: paciente._id.toString() }).sort({ data: -1 }).limit(20),
      CicloMenstrual.find({ pacienteId: paciente._id }).sort({ dataInicio: -1 }).limit(12)
    ]);

    return {
      perfil: {
        nome: paciente.name || paciente.nome,
        idade: calcularIdade(paciente.birthDate || paciente.dataNascimento),
        genero: paciente.gender || paciente.genero,
        altura: paciente.height || paciente.altura,
        peso: paciente.peso || paciente.weight,
        observacoes: paciente.observacoes
      },
      diabetes: diabetes.map(d => ({
        data: d.data,
        nivelGlicemia: d.nivelGlicemia || d.glicemia,
        observacoes: d.observacoes
      })),
      insonia: insonia.map(i => ({
        data: i.data,
        qualidade: i.qualidade,
        horasSono: i.horasSono,
        observacoes: i.observacoes
      })),
      pressaoArterial: pressaoArterial.map(p => ({
        data: p.data,
        sistolica: p.sistolica,
        diastolica: p.diastolica,
        observacoes: p.observacoes
      })),
      anotacoes: anotacoes.map(a => ({
        data: a.data,
        titulo: a.titulo,
        descricao: a.anotacao,
        categoria: a.categoria,
        medico: a.medico,
        tipoConsulta: a.tipoConsulta
      })),
      eventosClinicos: eventosClinicos.map(e => ({
        data: e.dataHora || e.data,
        tipo: e.tipoEvento || e.tipo,
        descricao: e.descricao,
        intensidadeDor: e.intensidadeDor,
        especialidade: e.especialidade,
        sintomas: e.sintomas
      })),
      gastrite: gastrite.map(g => ({
        data: g.data || g.dataCrise,
        intensidade: g.intensidadeDor,
        sintomas: g.sintomas,
        observacoes: g.observacoes,
        alimentosIngeridos: g.alimentosIngeridos
      })),
      enxaqueca: enxaqueca.map(e => ({
        data: e.data,
        intensidade: e.intensidade,
        duracao: e.duracao,
        sintomas: e.sintomas || ''
      })),
      cicloMenstrual: cicloMenstrual.map(c => ({
        data: c.dataInicio || c.data,
        tipo: Array.from(c.diasPorData?.values() || []).map(d => d.fluxo).join(', ') || 'Não informado',
        colica: Array.from(c.diasPorData?.values() || []).some(d => d.teveColica),
        humor: Array.from(c.diasPorData?.values() || []).map(d => d.humor).join(', ') || ''
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    throw error;
  }
};

// Função para calcular idade
function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    anos--;
  }
  return anos;
}

// Função para gerar insights com Gemini
export const gerarInsightsPaciente = async (req, res) => {
  try {
    const { cpf } = req.params;
    
    console.log('🔍 Buscando insights para CPF:', cpf);

    // Buscar todos os dados do paciente
    const dadosPaciente = await buscarTodosDadosPaciente(cpf);

    if (!dadosPaciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Verificar se a API key do Gemini está configurada
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.error('❌ GEMINI_API_KEY não encontrada ou vazia');
      return res.status(500).json({ 
        message: 'API key do Gemini não configurada. Configure a variável GEMINI_API_KEY no arquivo .env' 
      });
    }
    
    console.log('🔑 API Key encontrada:', process.env.GEMINI_API_KEY.substring(0, 15) + '...');

    // Preparar prompt para o Gemini
    console.log('📝 Criando prompt para Gemini...');
    const prompt = criarPromptInsights(dadosPaciente);
    console.log('✅ Prompt criado, tamanho:', prompt.length, 'caracteres');

    // Gerar insights com Gemini
    console.log('🤖 Chamando API do Gemini...');
    console.log('📏 Tamanho do prompt:', prompt.length, 'caracteres');
    
    // Limitar o tamanho do prompt se for muito grande (limite do plano gratuito)
    const maxPromptLength = 30000; // Limite conservador para plano gratuito
    let promptFinal = prompt;
    if (prompt.length > maxPromptLength) {
      console.log('⚠️ Prompt muito grande, truncando para', maxPromptLength, 'caracteres');
      promptFinal = prompt.substring(0, maxPromptLength) + '\n\n[Nota: Dados truncados devido ao limite de tamanho]';
    }
    
    let insights;
    try {
      // Obter instância do Gemini AI com a API key atualizada
      const genAIInstance = getGenAI();
      
      // Primeiro, tentar listar modelos disponíveis
      console.log('📋 Listando modelos disponíveis...');
      const modelosDisponiveis = await listarModelosDisponiveis();
      
      // Lista de modelos para tentar (ordem de preferência)
      // Tentar diferentes formatos e versões
      const modelosParaTentar = [];
      
      // Se temos modelos disponíveis da lista, usar apenas esses
      if (modelosDisponiveis.length > 0) {
        // Priorizar modelos que suportam generateContent
        const modelosComGenerateContent = modelosDisponiveis.filter(name => 
          name.includes('gemini') && !name.includes('embedding') && !name.includes('embed')
        );
        
        if (modelosComGenerateContent.length > 0) {
          modelosParaTentar.push(...modelosComGenerateContent);
        } else {
          modelosParaTentar.push(...modelosDisponiveis);
        }
      }
      
      // Adicionar modelos padrão como fallback (removendo gemini-pro que não funciona)
      // Priorizando modelos mais recentes que estão disponíveis
      modelosParaTentar.push(
        'gemini-1.5-flash',           // Modelo mais rápido e comum no plano gratuito
        'gemini-1.5-flash-002',       // Versão específica mais recente
        'gemini-1.5-flash-001',       // Versão específica anterior
        'gemini-1.5-pro',             // Modelo mais poderoso
        'gemini-1.5-pro-002',         // Versão específica mais recente
        'gemini-1.5-pro-001',         // Versão específica anterior
        'gemini-1.5-flash-latest',    // Alias para versão mais recente
        'gemini-1.5-pro-latest'       // Alias para versão mais recente
      );
      
      // Remover duplicatas mantendo a ordem
      const modelosUnicos = [...new Set(modelosParaTentar)];
      
      let model = null;
      let ultimoErro = null;
      
      console.log(`🔄 Tentando ${modelosUnicos.length} modelos...`);
      
      for (const nomeModelo of modelosUnicos) {
        try {
          console.log(`📦 Tentando modelo: ${nomeModelo}...`);
          model = genAIInstance.getGenerativeModel({ model: nomeModelo });
          console.log(`✅ Modelo ${nomeModelo} inicializado com sucesso`);
          break;
        } catch (modelError) {
          console.log(`⚠️ Modelo ${nomeModelo} não disponível:`, modelError.message?.substring(0, 150));
          ultimoErro = modelError;
          continue;
        }
      }
      
      if (!model) {
        const mensagemErro = ultimoErro?.message || 'Desconhecido';
        console.error('❌ Nenhum modelo disponível. Último erro:', mensagemErro);
        
        // Se conseguiu listar modelos, mostrar quais estão disponíveis
        if (modelosDisponiveis.length > 0) {
          throw new Error(`Nenhum dos modelos tentados está disponível. Modelos disponíveis na sua conta: ${modelosDisponiveis.slice(0, 5).join(', ')}. Verifique o Google AI Studio para mais detalhes.`);
        } else {
          throw new Error(`Nenhum modelo disponível. Verifique se sua API key está correta e tem acesso aos modelos Gemini. Último erro: ${mensagemErro.substring(0, 200)}`);
        }
      }
      
      console.log(`🎯 Usando modelo: ${model.model || 'modelo selecionado'}`);
      
      console.log('🔄 Enviando requisição para o Gemini...');
      const result = await model.generateContent(promptFinal);
      const response = await result.response;
      
      // Verificar se há bloqueios de segurança
      if (response.candidates && response.candidates[0] && response.candidates[0].finishReason) {
        const finishReason = response.candidates[0].finishReason;
        if (finishReason !== 'STOP') {
          console.warn('⚠️ Finish reason:', finishReason);
          if (finishReason === 'SAFETY') {
            throw new Error('A resposta foi bloqueada por filtros de segurança do Gemini. Tente ajustar o prompt.');
          }
        }
      }
      
      insights = response.text();
      
      if (!insights || insights.trim() === '') {
        throw new Error('A resposta do Gemini está vazia');
      }
      
      console.log('✅ Insights gerados com sucesso, tamanho:', insights.length, 'caracteres');
    } catch (geminiError) {
      console.error('❌ Erro na API do Gemini:');
      console.error('   Tipo:', geminiError.constructor.name);
      console.error('   Mensagem:', geminiError.message);
      console.error('   Código:', geminiError.code);
      console.error('   Status:', geminiError.status);
      console.error('   Status Code:', geminiError.statusCode);
      if (geminiError.response) {
        console.error('   Response:', JSON.stringify(geminiError.response, null, 2));
      }
      if (geminiError.stack) {
        console.error('   Stack:', geminiError.stack.substring(0, 500));
      }
      
      // Extrair mensagem de erro mais específica
      let errorMessage = geminiError.message || geminiError.toString();
      
      // Verificar se há informações de erro no response
      if (geminiError.response) {
        const responseData = geminiError.response;
        if (responseData.error) {
          errorMessage = responseData.error.message || responseData.error || errorMessage;
        }
      }
      
      // Verificar se é erro de autenticação
      if (errorMessage && (
        errorMessage.includes('API_KEY') || 
        errorMessage.includes('authentication') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('API key not valid') ||
        errorMessage.includes('INVALID_API_KEY')
      )) {
        throw new Error('Erro de autenticação com a API do Gemini. Verifique se a API key está correta e ativa no Google AI Studio.');
      }
      
      // Verificar se é erro de quota
      if (errorMessage && (
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      )) {
        throw new Error('Limite de requisições excedido no plano gratuito. Aguarde alguns minutos ou considere atualizar seu plano no Google AI Studio.');
      }
      
      // Verificar se é erro de modelo não disponível
      if (errorMessage && (
        errorMessage.includes('model') ||
        errorMessage.includes('MODEL_NOT_FOUND') ||
        errorMessage.includes('not found')
      )) {
        throw new Error(`Modelo não disponível no seu plano: ${errorMessage}`);
      }
      
      // Verificar se é erro de segurança/bloqueio
      if (errorMessage && (
        errorMessage.includes('SAFETY') ||
        errorMessage.includes('safety') ||
        errorMessage.includes('blocked')
      )) {
        throw new Error('A resposta foi bloqueada por filtros de segurança do Gemini. O conteúdo pode ter sido considerado sensível.');
      }
      
      // Erro genérico com a mensagem específica
      throw new Error(`Erro ao chamar API do Gemini: ${errorMessage}`);
    }

    res.json({
      success: true,
      insights: insights,
      dadosResumo: {
        totalRegistros: {
          diabetes: dadosPaciente.diabetes.length,
          insonia: dadosPaciente.insonia.length,
          pressaoArterial: dadosPaciente.pressaoArterial.length,
          anotacoes: dadosPaciente.anotacoes.length,
          eventosClinicos: dadosPaciente.eventosClinicos.length
        },
        ultimaAtualizacao: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao gerar insights:', error);
    console.error('❌ Tipo do erro:', error.constructor.name);
    console.error('❌ Mensagem do erro:', error.message);
    if (error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    
    // Garantir que sempre retorna JSON, não HTML
    if (!res.headersSent) {
      // Usar a mensagem de erro específica se disponível, caso contrário usar a genérica
      const errorMessage = error.message || 'Erro desconhecido ao gerar insights';
      
      res.status(500).json({ 
        success: false,
        message: 'Erro ao gerar insights', 
        error: errorMessage, // Mensagem específica do erro
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        type: error.constructor.name
      });
    } else {
      console.error('⚠️ Resposta já foi enviada, não é possível retornar erro');
    }
  }
};

// Função para criar o prompt de insights
function criarPromptInsights(dados) {
  const { perfil, diabetes, insonia, pressaoArterial, anotacoes, eventosClinicos, gastrite, enxaqueca, cicloMenstrual } = dados;

  return `Você é um assistente médico especializado em análise de dados de saúde. Analise os seguintes dados do paciente e forneça insights relevantes, recomendações e alertas importantes.

DADOS DO PACIENTE:
- Nome: ${perfil.nome}
- Idade: ${perfil.idade || 'Não informado'} anos
- Gênero: ${perfil.genero || 'Não informado'}
- Altura: ${perfil.altura || 'Não informado'} cm
- Peso: ${perfil.peso || 'Não informado'} kg
- Observações: ${perfil.observacoes || 'Nenhuma'}

${diabetes.length > 0 ? `
REGISTROS DE GLICEMIA (últimos ${diabetes.length} registros):
${diabetes.map(d => `- Data: ${new Date(d.data).toLocaleDateString('pt-BR')}, Glicemia: ${d.nivelGlicemia} mg/dL${d.observacoes ? `, Observações: ${d.observacoes}` : ''}`).join('\n')}
` : 'Nenhum registro de glicemia encontrado.'}

${insonia.length > 0 ? `
REGISTROS DE INSÔNIA (últimos ${insonia.length} registros):
${insonia.map(i => `- Data: ${new Date(i.data).toLocaleDateString('pt-BR')}, Qualidade: ${i.qualidade}, Horas de sono: ${i.horasSono}${i.observacoes ? `, Observações: ${i.observacoes}` : ''}`).join('\n')}
` : 'Nenhum registro de insônia encontrado.'}

${pressaoArterial.length > 0 ? `
REGISTROS DE PRESSÃO ARTERIAL (últimos ${pressaoArterial.length} registros):
${pressaoArterial.map(p => `- Data: ${new Date(p.data).toLocaleDateString('pt-BR')}, ${p.sistolica}/${p.diastolica} mmHg${p.observacoes ? `, Observações: ${p.observacoes}` : ''}`).join('\n')}
` : 'Nenhum registro de pressão arterial encontrado.'}

${gastrite.length > 0 ? `
CRISES DE GASTRITE (últimas ${gastrite.length}):
${gastrite.map(g => `- Data: ${new Date(g.data).toLocaleDateString('pt-BR')}, Intensidade da dor: ${g.intensidade}/10, Sintomas: ${g.sintomas || 'Não informado'}${g.alimentosIngeridos ? `, Alimentos ingeridos: ${g.alimentosIngeridos}` : ''}${g.observacoes ? `, Observações: ${g.observacoes}` : ''}`).join('\n')}
` : 'Nenhuma crise de gastrite registrada.'}

${enxaqueca.length > 0 ? `
REGISTROS DE ENXAQUECA (últimos ${enxaqueca.length}):
${enxaqueca.map(e => `- Data: ${new Date(e.data).toLocaleDateString('pt-BR')}, Intensidade: ${e.intensidade}, Duração: ${e.duracao}${e.sintomas ? `, Sintomas: ${e.sintomas}` : ''}`).join('\n')}
` : 'Nenhum registro de enxaqueca encontrado.'}

${eventosClinicos.length > 0 ? `
EVENTOS CLÍNICOS (últimos ${eventosClinicos.length}):
${eventosClinicos.map(e => `- Data: ${new Date(e.data).toLocaleDateString('pt-BR')}, Tipo: ${e.tipo}, Especialidade: ${e.especialidade}, Intensidade da dor: ${e.intensidadeDor}, Sintomas: ${e.sintomas}, Descrição: ${e.descricao}`).join('\n')}
` : 'Nenhum evento clínico registrado.'}

${anotacoes.length > 0 ? `
ANOTAÇÕES CLÍNICAS (últimas ${anotacoes.length}):
${anotacoes.map(a => `- Data: ${new Date(a.data).toLocaleDateString('pt-BR')}, Categoria: ${a.categoria}, Médico: ${a.medico}, Título: ${a.titulo}, Anotação: ${a.descricao}`).join('\n')}
` : 'Nenhuma anotação clínica encontrada.'}

${cicloMenstrual.length > 0 ? `
CICLO MENSTRUAL (últimos ${cicloMenstrual.length} registros):
${cicloMenstrual.map(c => `- Data início: ${new Date(c.data).toLocaleDateString('pt-BR')}, Fluxo: ${c.tipo}${c.colica ? `, Teve cólica: Sim` : ', Teve cólica: Não'}${c.humor ? `, Humor: ${c.humor}` : ''}`).join('\n')}
` : 'Nenhum registro de ciclo menstrual encontrado.'}

INSTRUÇÕES:
1. Analise todos os dados fornecidos de forma integrada
2. Identifique padrões, tendências e anomalias
3. Forneça insights relevantes para o médico
4. Inclua alertas importantes (valores fora do normal, padrões preocupantes)
5. Sugira recomendações baseadas nos dados
6. Seja objetivo e claro, usando linguagem médica apropriada
7. Organize a resposta em seções como: "Análise Geral", "Padrões Identificados", "Alertas Importantes", "Recomendações"
8. Se houver poucos dados, mencione isso e sugira a importância de mais registros

Formate a resposta em português brasileiro, de forma clara e profissional.`;

}

