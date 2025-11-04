import { API_URL } from './config.js';

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

  function mostrarErro(mensagem, tipo = 'error') {
    const aviso = document.createElement('div');
    const isSuccess = tipo === 'success';
    aviso.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${isSuccess ? '#e8f5e9' : '#ffffff'};
      color: ${isSuccess ? '#2e7d32' : '#002A42'};
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px ${isSuccess ? 'rgba(46, 125, 50, 0.2)' : 'rgba(0, 42, 66, 0.1)'};
      z-index: 1000;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      border: 1px solid ${isSuccess ? '#4caf50' : '#e1e5eb'};
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    const icon = document.createElement('div');
    if (isSuccess) {
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #4caf50;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else {
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }

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

  let pacienteAtual = null; // Armazenar dados do paciente

  function preencherPerfil(paciente) {
    if (!paciente) return;
    
    pacienteAtual = paciente; // Salvar dados do paciente

    // Atualiza a foto do perfil
    const imagemPerfil = document.getElementById('fotoPaciente');
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

    // Preenche valores exibidos
    Object.entries(dadosFormatados).forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento && elemento.classList.contains('info-value')) {
        elemento.textContent = valor;
      }
    });

    // Preenche inputs com valores brutos (sem formatação)
    document.getElementById('inputNomePaciente').value = paciente.nome || '';
    document.getElementById('inputGeneroPaciente').value = paciente.genero || '';
    document.getElementById('inputNacionalidadePaciente').value = paciente.nacionalidade || '';
    document.getElementById('inputAlturaPaciente').value = paciente.altura ? paciente.altura.toString().replace(' cm', '') : '';
    document.getElementById('inputPesoPaciente').value = paciente.peso ? paciente.peso.toString().replace(' kg', '') : '';
    document.getElementById('inputProfissaoPaciente').value = paciente.profissao || '';
    document.getElementById('inputEmailPaciente').value = paciente.email || '';
    document.getElementById('inputTelefonePaciente').value = paciente.telefone ? paciente.telefone.replace(/\D/g, '') : '';
    document.getElementById('inputObservacoesPaciente').value = paciente.observacoes || '';
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

  // Função para formatar os insights
  function formatarInsights(texto) {
    // Converter quebras de linha em <br>
    let formatado = texto.replace(/\n/g, '<br>');
    
    // Converter títulos (linhas que começam com números ou são muito curtas e em maiúsculas)
    formatado = formatado.replace(/<br>(<br>)?([A-ZÁÉÍÓÚÂÊÔÇ][^:]+):/g, '<br><h3>$2</h3>');
    
    // Converter listas
    formatado = formatado.replace(/(\d+\.\s+[^<]+)/g, '<li>$1</li>');
    
    // Envolver listas em <ul>
    formatado = formatado.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
    
    // Remover <br> duplicados
    formatado = formatado.replace(/<br><br>/g, '<br>');
    
    return formatado;
  }

  // Event listener para o botão de gerar insights
  const gerarInsightsBtn = document.getElementById('gerarInsightsBtn');
  if (gerarInsightsBtn) {
    gerarInsightsBtn.addEventListener('click', gerarInsights);
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
      
      // Atualizar dados do paciente
      pacienteAtual = { ...pacienteAtual, ...dadosAtualizados };
      
      // Recarregar dados do paciente
      await carregarDadosPaciente();
      
      // Desabilitar edição
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

  // Inicializar
  try {
    await carregarDadosMedico();
    await carregarDadosPaciente();
    await carregarUltimosRegistros();
  } catch (error) {
    console.error("Erro durante a inicialização:", error);
    mostrarErro("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
  }
});