import { API_URL } from './config.js';
// import { iniciarVerificacaoConexao, pararVerificacaoConexao } from './conexaoMonitor.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar se os elementos existem antes de adicionar event listeners
  const toggleButton = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (toggleButton && sidebar) {
    toggleButton.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      toggleButton.classList.toggle("shifted");
    });
  }

  function mostrarErro(mensagem) {
    const aviso = document.createElement('div');
    aviso.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ffffff;
      color: #002A42;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 42, 66, 0.1);
      z-index: 1000;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      border: 1px solid #e1e5eb;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;

    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
    textContainer.textContent = mensagem;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    `;
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeButton.onclick = () => {
      aviso.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(aviso);
        document.head.removeChild(style);
      }, 300);
    };

    aviso.appendChild(icon);
    aviso.appendChild(textContainer);
    aviso.appendChild(closeButton);
    document.body.appendChild(aviso);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      if (document.body.contains(aviso)) {
        aviso.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(aviso)) {
            document.body.removeChild(aviso);
            document.head.removeChild(style);
          }
        }, 300);
      }
    }, 5000);
  }

  async function carregarDadosMedico() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar dados do médico');
      }

      const medico = await res.json();
      const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
      const nomeFormatado = `${prefixo} ${medico.nome}`;
      
      const tituloSidebar = document.querySelector('.sidebar .profile h3');
      if (tituloSidebar) {
        tituloSidebar.textContent = nomeFormatado;
      }

      return true;
    } catch (error) {
      console.error("Erro ao carregar dados do médico:", error);
      const fallback = document.querySelector('.sidebar .profile h3');
      if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
      mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
      return false;
    }
  }

  async function carregarDadosPaciente() {
    try {
      const tokenPaciente = localStorage.getItem('tokenPaciente');
      if (!tokenPaciente) {
        throw new Error('Token do paciente não encontrado. Por favor, selecione um paciente.');
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        throw new Error('CPF não encontrado no token do paciente.');
      }

      const tokenMedico = localStorage.getItem('token');
      if (!tokenMedico) {
        throw new Error('Token do médico não encontrado. Por favor, faça login novamente.');
      }

      const response = await fetch(`${API_URL}/api/pacientes/perfil/${cpf}`, {
        headers: {
          'Authorization': `Bearer ${tokenMedico}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do paciente.');
      }

      const paciente = await response.json();
      preencherPerfil(paciente);
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
      mostrarErro(error.message);
      return false;
    }
  }

  function preencherPerfil(paciente) {
    if (!paciente) return;

    // Atualiza a foto do perfil
    const imagemPerfil = document.querySelector('.profile-box img');
    if (imagemPerfil) {
      imagemPerfil.src = paciente.fotoPerfil || '/client/public/assets/User_logonegativo.png';
      imagemPerfil.onerror = () => {
        imagemPerfil.src = '/client/public/assets/User_logonegativo.png';
      };
    }

    // Formata os dados antes de exibir
    const dadosFormatados = {
      nomePaciente: paciente.nome || '-',
      generoPaciente: paciente.genero || '-',
      idadePaciente: calcularIdadeTexto(paciente.dataNascimento),
      nacionalidadePaciente: paciente.nacionalidade || '-',
      alturaPaciente: paciente.altura ? `${paciente.altura} cm` : '-',
      pesoPaciente: paciente.peso ? `${paciente.peso} kg` : '-',
      profissaoPaciente: paciente.profissao || '-',
      emailPaciente: paciente.email || '-',
      telefonePaciente: formatarTelefone(paciente.telefone) || '-',
      observacoesPaciente: paciente.observacoes || 'Nenhuma'
    };

    // Atualiza cada campo individualmente
    Object.entries(dadosFormatados).forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = valor;
      }
    });
  }

  function formatarTelefone(telefone) {
    if (!telefone) return '-';
    const numeros = telefone.replace(/\D/g, '');
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  function calcularIdadeTexto(dataISO) {
    if (!dataISO) return '-';
    try {
      const nascimento = new Date(dataISO);
      const hoje = new Date();
      
      if (isNaN(nascimento.getTime()) || nascimento > hoje) {
        return '-';
      }

      let anos = hoje.getFullYear() - nascimento.getFullYear();
      let meses = hoje.getMonth() - nascimento.getMonth();
      
      if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
        anos--;
        meses += 12;
      }

      return `${anos} anos e ${meses} meses`;
    } catch (error) {
      console.error("Erro ao calcular idade:", error);
      return '-';
    }
  }

  async function carregarUltimosRegistros() {
    try {
      const tokenMedico = localStorage.getItem('token');
      const tokenPaciente = localStorage.getItem('tokenPaciente');

      if (!tokenMedico || !tokenPaciente) {
        mostrarErro("Sessão expirada. Faça login novamente!");
        return;
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        mostrarErro("CPF não encontrado no token do paciente.");
        return;
      }

      const response = await fetch(`${API_URL}/api/anotacoes/${cpf}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar anotações!");
        return;
      }

      const data = await response.json();
      renderizarRegistros(data);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      mostrarErro("Erro interno ao carregar anotações.");
    }
  }

  function renderizarRegistros(registros) {
    const shortcutGrid = document.querySelector('.shortcut-grid');
    if (!shortcutGrid) return;

    shortcutGrid.innerHTML = '';

    if (!registros || registros.length === 0) {
      shortcutGrid.innerHTML = `
        <div class="no-data-msg">
          ⚠️ <span>Nenhuma anotação encontrada.</span>
        </div>
      `;
      return;
    }

    // Pega apenas os 3 registros mais recentes
    const registrosRecentes = registros.slice(0, 3);

    registrosRecentes.forEach(registro => {
      const card = document.createElement('div');
      card.className = 'shortcut-card';
      card.innerHTML = `
        <p>
          <strong>Motivo da Consulta:</strong> ${registro.titulo || 'Não informado'}<br>
          <strong>Médico Responsável:</strong> ${registro.medico || 'Não informado'}<br>
          <strong>Especialidade:</strong> ${registro.categoria || 'Não informada'}<br>
          <strong>Data:</strong> ${new Date(registro.data).toLocaleDateString()}
        </p>
        <button onclick="visualizarRegistro('${registro._id}')">Visualizar</button>
      `;
      shortcutGrid.appendChild(card);
    });
  }

  // Função para visualizar um registro específico
  window.visualizarRegistro = function(id) {
    if (!id) return;
    window.location.href = `vizualizacaoAnotacao.html?id=${encodeURIComponent(id)}`;
  };

  // Função para gerar insights
  async function gerarInsights() {
    try {
      const tokenPaciente = localStorage.getItem('tokenPaciente');
      if (!tokenPaciente) {
        mostrarErro('Token do paciente não encontrado.');
        return;
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        mostrarErro('CPF não encontrado no token do paciente.');
        return;
      }

      if (cpf.length !== 11) {
        mostrarErro('CPF inválido. O CPF deve ter 11 dígitos.');
        return;
      }

      const tokenMedico = localStorage.getItem('token');
      if (!tokenMedico) {
        mostrarErro('Token do médico não encontrado.');
        return;
      }

      // Mostrar loading
      const loadingEl = document.getElementById('insightsLoading');
      const contentEl = document.getElementById('insightsContent');
      const errorEl = document.getElementById('insightsError');
      const btnEl = document.getElementById('gerarInsightsBtn');

      loadingEl.style.display = 'block';
      contentEl.style.display = 'none';
      errorEl.style.display = 'none';
      btnEl.disabled = true;

      console.log('📤 Enviando requisição para:', `${API_URL}/api/gemini/insights/${cpf}`);
      
      const response = await fetch(`${API_URL}/api/gemini/insights/${cpf}`, {
        headers: {
          'Authorization': `Bearer ${tokenMedico}`,
          'Content-Type': 'application/json'
        }
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text.substring(0, 200));
        throw new Error('Resposta inválida do servidor. Verifique se a rota está configurada corretamente.');
      }

            if (!response.ok) {
              let errorData;
              try {
                errorData = await response.json();
              } catch (parseError) {
                const text = await response.text();
                console.error('Erro ao parsear resposta JSON:', text);
                throw new Error(`Erro ${response.status}: ${text.substring(0, 200)}`);
              }
              
              // Priorizar mensagens de erro específicas do servidor
              const errorMessage = errorData.error || errorData.message || 'Erro ao gerar insights';
              console.error('Erro do servidor:', errorData);
              throw new Error(errorMessage);
            }

      const data = await response.json();

      // Esconder loading e mostrar conteúdo
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';

      // Exibir insights
      const summaryEl = contentEl.querySelector('.insights-summary');
      const textEl = contentEl.querySelector('.insights-text');

      if (data.dadosResumo) {
        summaryEl.innerHTML = `
          <h3 style="margin-top: 0; color: #002A42;">Resumo dos Dados Analisados</h3>
          <p><strong>Registros de Glicemia:</strong> ${data.dadosResumo.totalRegistros.diabetes}</p>
          <p><strong>Registros de Insônia:</strong> ${data.dadosResumo.totalRegistros.insonia}</p>
          <p><strong>Registros de Pressão Arterial:</strong> ${data.dadosResumo.totalRegistros.pressaoArterial}</p>
          <p><strong>Anotações Clínicas:</strong> ${data.dadosResumo.totalRegistros.anotacoes}</p>
          <p><strong>Eventos Clínicos:</strong> ${data.dadosResumo.totalRegistros.eventosClinicos}</p>
          <p style="margin-top: 10px; font-size: 12px; color: #666;">Última atualização: ${new Date(data.dadosResumo.ultimaAtualizacao).toLocaleString('pt-BR')}</p>
        `;
      }

      // Formatar e exibir os insights
      const insightsFormatados = formatarInsights(data.insights);
      textEl.innerHTML = insightsFormatados;
      
      // Limpar chat anterior e armazenar contexto dos insights
      const chatMessagesEl = document.getElementById('chatMessages');
      if (chatMessagesEl) {
        chatMessagesEl.innerHTML = '';
        // Armazenar contexto dos insights para usar nas perguntas
        chatMessagesEl.dataset.contextoInsights = data.insights;
      }

      btnEl.disabled = false;
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      const loadingEl = document.getElementById('insightsLoading');
      const errorEl = document.getElementById('insightsError');
      const btnEl = document.getElementById('gerarInsightsBtn');

      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      
      // Mensagem de erro mais detalhada
      let errorMessage = error.message || 'Erro desconhecido ao gerar insights';
      let detalhesTecnicos = error.message;
      
      // Mapear mensagens de erro para mensagens mais amigáveis
      if (errorMessage.includes('Erro ao chamar API do Gemini')) {
        errorMessage = 'Erro ao processar com IA. Verifique se a API key do Gemini está configurada corretamente.';
      } else if (errorMessage.includes('autenticação') || errorMessage.includes('API_KEY') || errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'Erro de autenticação com a API do Gemini. Verifique se a API key está correta e ativa.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        errorMessage = 'Limite de requisições excedido no plano gratuito. Aguarde alguns minutos ou considere atualizar seu plano.';
      } else if (errorMessage.includes('Modelo não disponível')) {
        errorMessage = 'O modelo de IA não está disponível no seu plano. Verifique as configurações da API.';
      } else if (errorMessage.includes('Paciente não encontrado')) {
        errorMessage = 'Paciente não encontrado. Verifique se o paciente está selecionado corretamente.';
      } else if (errorMessage.includes('Resposta inválida') || errorMessage.includes('connection')) {
        errorMessage = 'Erro de conexão com o servidor. Verifique se o servidor está rodando.';
      } else if (errorMessage.includes('Erro ao gerar insights')) {
        // Manter a mensagem genérica mas mostrar detalhes técnicos
        errorMessage = 'Erro ao gerar insights. Verifique os logs do servidor para mais detalhes.';
      }
      
      errorEl.innerHTML = `
        <strong>❌ Erro:</strong> ${errorMessage}
        <br><small style="margin-top: 8px; display: block; opacity: 0.7;">Detalhes técnicos: ${detalhesTecnicos}</small>
      `;
      btnEl.disabled = false;
    }
  }

  // Função para formatar os insights (markdown básico para HTML)
  function formatarInsights(texto) {
    if (!texto) return '';
    
    let formatado = texto;
    
    // Escape HTML primeiro
    formatado = formatado.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Converter títulos (## Título ou linhas em maiúsculas seguidas de :)
    formatado = formatado.replace(/^##\s+(.+)$/gm, '<h3 class="insight-title">$1</h3>');
    formatado = formatado.replace(/^###\s+(.+)$/gm, '<h4 class="insight-subtitle">$1</h4>');
    
    // Títulos sem markdown (linhas que são curtas e terminam com :)
    formatado = formatado.replace(/^([A-ZÁÉÍÓÚÂÊÔÇ][^:]{2,50}):$/gm, '<h3 class="insight-title">$1</h3>');
    
    // Converter listas numeradas (1. item ou - item)
    formatado = formatado.replace(/^\d+\.\s+(.+)$/gm, '<li class="insight-item">$1</li>');
    formatado = formatado.replace(/^[-•]\s+(.+)$/gm, '<li class="insight-item">$1</li>');
    
    // Envolver listas consecutivas em <ul>
    formatado = formatado.replace(/(<li class="insight-item">.*?<\/li>)(\s*<li class="insight-item">)/g, 
      function(match, first, second) {
        return '<ul class="insight-list">' + first;
      });
    formatado = formatado.replace(/(<\/li>)(\s*)(?!<li|<h|<p)/g, '</li></ul>$2');
    
    // Converter negrito **texto** ou __texto__
    formatado = formatado.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatado = formatado.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Converter itálico *texto* ou _texto_
    formatado = formatado.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatado = formatado.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Converter quebras de linha
    formatado = formatado.replace(/\n/g, '<br>');
    
    // Converter parágrafos (quebras duplas)
    formatado = formatado.replace(/(<br>\s*){2,}/g, '</p><p class="insight-paragraph">');
    formatado = '<p class="insight-paragraph">' + formatado + '</p>';
    
    // Limpar tags vazias
    formatado = formatado.replace(/<p class="insight-paragraph"><\/p>/g, '');
    formatado = formatado.replace(/<p class="insight-paragraph">(<h[34])/g, '$1');
    formatado = formatado.replace(/(<\/h[34]>)<\/p>/g, '$1');
    formatado = formatado.replace(/<p class="insight-paragraph">(<ul)/g, '$1');
    formatado = formatado.replace(/(<\/ul>)<\/p>/g, '$1');
    
    // Remover <br> antes de tags de bloco
    formatado = formatado.replace(/<br>\s*(<h[34]|<ul|<p)/g, '$1');
    
    return formatado;
  }

  // Event listener para o botão de gerar insights
  const gerarInsightsBtn = document.getElementById('gerarInsightsBtn');
  if (gerarInsightsBtn) {
    gerarInsightsBtn.addEventListener('click', gerarInsights);
  }

  // ========== FUNCIONALIDADE DE CHAT/PERGUNTAS ==========
  
  // Função para enviar pergunta
  async function enviarPergunta() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendQuestionBtn');
    const chatLoading = document.getElementById('chatLoading');
    
    if (!chatInput || !chatMessages || !sendBtn) return;
    
    const pergunta = chatInput.value.trim();
    
    if (!pergunta) {
      chatInput.focus();
      return;
    }
    
    // Obter CPF do paciente (mesma lógica do gerarInsights)
    const tokenPaciente = localStorage.getItem('tokenPaciente');
    if (!tokenPaciente) {
      alert('Token do paciente não encontrado. Faça login como paciente primeiro.');
      return;
    }
    
    let cpf;
    try {
      const decodedPayload = JSON.parse(atob(tokenPaciente));
      cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');
      
      if (!cpf) {
        throw new Error('CPF não encontrado no token do paciente');
      }
      
      if (cpf.length !== 11) {
        throw new Error('CPF inválido. O CPF deve ter 11 dígitos.');
      }
    } catch (error) {
      console.error('Erro ao obter CPF:', error);
      alert(error.message || 'Erro ao obter CPF do paciente. Faça login novamente.');
      return;
    }
    
    // Desabilitar input e botão
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatLoading.style.display = 'flex';
    
    // Adicionar pergunta ao chat
    const perguntaHTML = `
      <div class="chat-message chat-message-user">
        <div class="chat-message-content">
          <strong>Você:</strong>
          <p>${escapeHtml(pergunta)}</p>
        </div>
      </div>
    `;
    chatMessages.innerHTML += perguntaHTML;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Limpar input
    chatInput.value = '';
    
    try {
      const tokenMedico = localStorage.getItem('token');
      if (!tokenMedico) {
        throw new Error('Token do médico não encontrado');
      }
      
      // Obter contexto dos insights se disponível
      const contextoInsights = chatMessages.dataset.contextoInsights || '';
      
      const response = await fetch(`${API_URL}/api/gemini/pergunta/${cpf}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenMedico}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pergunta: pergunta,
          contextoInsights: contextoInsights
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || errorData.message || 'Erro ao processar pergunta');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pergunta');
      }
      
      // Adicionar resposta ao chat
      const respostaFormatada = formatarInsights(data.resposta);
      const respostaHTML = `
        <div class="chat-message chat-message-ai">
          <div class="chat-message-content">
            <strong>🤖 IA:</strong>
            <div class="chat-response">${respostaFormatada}</div>
          </div>
        </div>
      `;
      chatMessages.innerHTML += respostaHTML;
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      const errorHTML = `
        <div class="chat-message chat-message-error">
          <div class="chat-message-content">
            <strong>❌ Erro:</strong>
            <p>${escapeHtml(error.message || 'Erro ao processar pergunta')}</p>
          </div>
        </div>
      `;
      chatMessages.innerHTML += errorHTML;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } finally {
      // Reabilitar input e botão
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatLoading.style.display = 'none';
      chatInput.focus();
    }
  }
  
  // Função auxiliar para escapar HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Event listeners para o chat
  const sendQuestionBtn = document.getElementById('sendQuestionBtn');
  const chatInput = document.getElementById('chatInput');
  
  if (sendQuestionBtn) {
    sendQuestionBtn.addEventListener('click', enviarPergunta);
  }
  
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarPergunta();
      }
    });
  }

  // ========== FUNCIONALIDADE DE EDIÇÃO ==========
  let modoEdicao = false;

  function habilitarEdicao() {
    modoEdicao = true;
    
    // Esconder valores e mostrar inputs
    document.querySelectorAll('.info-value').forEach(el => {
      el.style.display = 'none';
    });
    
    document.querySelectorAll('.info-input').forEach(el => {
      el.style.display = 'block';
    });
    
    document.getElementById('profileActions').style.display = 'flex';
    document.getElementById('editarPerfilBtn').style.display = 'none';
  }

  function desabilitarEdicao() {
    modoEdicao = false;
    
    // Mostrar valores e esconder inputs
    document.querySelectorAll('.info-value').forEach(el => {
      el.style.display = 'block';
    });
    
    document.querySelectorAll('.info-input').forEach(el => {
      el.style.display = 'none';
    });
    
    document.getElementById('profileActions').style.display = 'none';
    const editarBtn = document.getElementById('editarPerfilBtn');
    if (editarBtn) {
      editarBtn.style.display = 'flex';
    }
    
    // Restaurar valores originais
    if (pacienteAtual) {
      preencherPerfil(pacienteAtual);
    }
  }

  async function salvarAlteracoes() {
    try {
      const tokenMedico = localStorage.getItem('token');
      if (!tokenMedico) {
        mostrarErro('Token do médico não encontrado. Faça login novamente.');
        return;
      }

      const tokenPaciente = localStorage.getItem('tokenPaciente');
      if (!tokenPaciente) {
        mostrarErro('Token do paciente não encontrado.');
        return;
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf || cpf.length !== 11) {
        mostrarErro('CPF inválido.');
        return;
      }

      const dadosAtualizados = {
        nome: document.getElementById('inputNomePaciente').value.trim(),
        genero: document.getElementById('inputGeneroPaciente').value,
        nacionalidade: document.getElementById('inputNacionalidadePaciente').value.trim(),
        altura: document.getElementById('inputAlturaPaciente').value.trim(),
        peso: document.getElementById('inputPesoPaciente').value.trim(),
        profissao: document.getElementById('inputProfissaoPaciente').value.trim(),
        email: document.getElementById('inputEmailPaciente').value.trim(),
        telefone: document.getElementById('inputTelefonePaciente').value.trim(),
        observacoes: document.getElementById('inputObservacoesPaciente').value.trim()
      };

      // Validações básicas
      if (!dadosAtualizados.nome) {
        mostrarErro('Nome é obrigatório.');
        return;
      }

      if (dadosAtualizados.email && !dadosAtualizados.email.includes('@')) {
        mostrarErro('E-mail inválido.');
        return;
      }

      const response = await fetch(`${API_URL}/api/pacientes/perfil/${cpf}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenMedico}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizados)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar alterações' }));
        throw new Error(errorData.message || 'Erro ao salvar alterações');
      }

      const data = await response.json();
      
      pacienteAtual = JSON.parse(localStorage.getItem('pacienteSelecionado'));
      if (pacienteAtual) {
        pacienteAtual = { ...pacienteAtual, ...dadosAtualizados };
        localStorage.setItem('pacienteSelecionado', JSON.stringify(pacienteAtual));
      }
      
      await carregarDadosPaciente();
      
      desabilitarEdicao();
      
      mostrarErro('Dados atualizados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      mostrarErro(error.message || 'Erro ao salvar alterações. Tente novamente.');
    }
  }

  // Event listeners
  const editarPerfilBtn = document.getElementById('editarPerfilBtn');
  if (editarPerfilBtn) {
    editarPerfilBtn.addEventListener('click', habilitarEdicao);
  }

  const salvarPerfilBtn = document.getElementById('salvarPerfilBtn');
  if (salvarPerfilBtn) {
    salvarPerfilBtn.addEventListener('click', salvarAlteracoes);
  }

  const cancelarEdicaoBtn = document.getElementById('cancelarEdicaoBtn');
  if (cancelarEdicaoBtn) {
    cancelarEdicaoBtn.addEventListener('click', desabilitarEdicao);
  }

  let pacienteAtual = null;

  window.addEventListener('beforeunload', () => {
    // pararVerificacaoConexao();
  });

  // Inicializar
  try {
    await carregarDadosMedico();
    await carregarDadosPaciente();
    await carregarUltimosRegistros();
    
    pacienteAtual = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    
    if (localStorage.getItem('tokenPaciente')) {
      // iniciarVerificacaoConexao();
    }
  } catch (error) {
    console.error("Erro durante a inicialização:", error);
    mostrarErro("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
  }
});