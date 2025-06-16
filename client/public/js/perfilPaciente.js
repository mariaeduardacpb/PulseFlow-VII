import { API_URL } from './config.js';

window.addEventListener('DOMContentLoaded', async () => {
  // Elementos da UI
  const erroBox = document.getElementById('erroPerfil');
  const profileBox = document.querySelector('.profile-box');
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="spinner"></div>
    <p>Carregando informações do paciente...</p>
  `;
  loadingIndicator.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
  `;

  // === 1. PUXA DADOS DO MÉDICO LOGADO ===
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

      // Armazena o nome do médico para usar nos atalhos
      localStorage.setItem('nomeMedico', nomeFormatado);

      return true;
    } catch (error) {
      console.error("Erro ao carregar dados do médico:", error);
      const fallback = document.querySelector('.sidebar .profile h3');
      if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
      mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
      return false;
    }
  }

  // === 2. PUXA DADOS DO PACIENTE SELECIONADO ===
  async function carregarDadosPaciente() {
    try {
      // Verifica se há um paciente selecionado
      const pacienteData = JSON.parse(localStorage.getItem('pacienteSelecionado'));
      if (!pacienteData || !pacienteData.id) {
        throw new Error("Paciente não encontrado. Redirecionando para seleção...");
      }

      // Verifica token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      // Mostra indicador de carregamento
      if (profileBox) {
        profileBox.style.position = 'relative';
        profileBox.appendChild(loadingIndicator);
      }

      // Faz a requisição
      const res = await fetch(`${API_URL}/api/pacientes/${pacienteData.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar dados do paciente');
      }

      const paciente = await res.json();
      
      // Valida dados obrigatórios
      if (!paciente.nome) {
        throw new Error('Dados do paciente incompletos');
      }

      // Remove indicador de carregamento
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }

      // Preenche os dados
      await preencherPerfil(paciente);
      return true;

    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
      mostrarErro(error.message || "Erro ao carregar dados do paciente. Verifique sua conexão ou tente novamente.");
      
      // Remove indicador de carregamento em caso de erro
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }

      // Se for erro de paciente não encontrado, redireciona
      if (error.message.includes("Paciente não encontrado")) {
        setTimeout(() => window.location.href = "selecao.html", 2500);
      }
      return false;
    }
  }

  function mostrarErro(mensagem) {
    if (!erroBox) return;
    erroBox.textContent = `⚠️ ${mensagem}`;
    erroBox.style.display = 'block';
    
    // Adiciona animação de fade-in
    erroBox.style.animation = 'fadeIn 0.3s ease-in';
  }

  async function preencherPerfil(paciente) {
    try {
      // Validação dos dados do paciente
      if (!paciente || typeof paciente !== 'object') {
        throw new Error('Dados do paciente inválidos');
      }

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
          elemento.style.animation = 'fadeIn 0.3s ease-in';
        }
      });

    } catch (error) {
      console.error("Erro ao preencher perfil:", error);
      mostrarErro("Erro ao exibir dados do paciente. Por favor, recarregue a página.");
      throw error;
    }
  }

  function formatarLabel(key) {
    const labels = {
      nome: 'Nome do Paciente',
      genero: 'Gênero',
      idade: 'Idade',
      nacionalidade: 'Nacionalidade',
      altura: 'Altura',
      peso: 'Peso',
      profissao: 'Profissão',
      email: 'E-mail',
      telefone: 'Telefone',
      observacoes: 'Observações'
    };
    return labels[key] || key;
  }

  function formatarTelefone(telefone) {
    if (!telefone) return '-';
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    // Formata como (XX) XXXXX-XXXX
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  function calcularIdadeTexto(dataISO) {
    if (!dataISO) return '-';
    try {
      const nascimento = new Date(dataISO);
      const hoje = new Date();
      
      // Validação da data
      if (isNaN(nascimento.getTime())) {
        throw new Error('Data de nascimento inválida');
      }
      
      // Verifica se a data é futura
      if (nascimento > hoje) {
        throw new Error('Data de nascimento inválida');
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
      const token = localStorage.getItem('token');
      const pacienteData = JSON.parse(localStorage.getItem('pacienteSelecionado'));
      
      if (!token || !pacienteData || !pacienteData.id) {
        console.error('Dados necessários:', { token: !!token, pacienteData });
        throw new Error('Dados necessários não encontrados');
      }

      // Ajustando a rota da API para buscar as anotações médicas
      const res = await fetch(`http://localhost:65432/api/anotacoes/${pacienteData.cpf}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro na resposta da API:', errorData);
        throw new Error(errorData.message || 'Erro ao carregar registros clínicos');
      }

      const registros = await res.json();
      console.log('Registros recebidos:', registros); // Debug

      const shortcutGrid = document.querySelector('.shortcut-grid');
      if (!shortcutGrid) {
        console.error('Elemento .shortcut-grid não encontrado');
        return;
      }

      // Limpa os atalhos existentes
      shortcutGrid.innerHTML = '';

      if (!registros || registros.length === 0) {
        shortcutGrid.innerHTML = '<p class="no-records">Nenhum registro clínico encontrado</p>';
        return;
      }

      // Pega apenas os 3 registros mais recentes
      const registrosRecentes = registros.slice(0, 3);

      // Cria os cards para cada registro
      registrosRecentes.forEach(registro => {
        try {
          const dataFormatada = registro.data ? new Date(registro.data).toLocaleDateString('pt-BR') : 'Data não informada';
          const card = document.createElement('div');
          card.className = 'shortcut-card';
          card.innerHTML = `
            <p>
              <strong>Motivo da Consulta:</strong> ${registro.titulo || 'Não informado'}<br>
              <strong>Médico Responsável:</strong> ${registro.medico || 'Não informado'}<br>
              <strong>Especialidade:</strong> ${registro.categoria || 'Não informada'}<br>
              <strong>Data:</strong> ${dataFormatada}
            </p>
            <button onclick="visualizarRegistro('${registro._id}')">Visualizar</button>
          `;
          shortcutGrid.appendChild(card);
        } catch (error) {
          console.error('Erro ao criar card para registro:', registro, error);
        }
      });

    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      mostrarErro('Erro ao carregar registros clínicos. Por favor, tente novamente.');
      
      // Mostra uma mensagem de erro mais amigável na interface
      const shortcutGrid = document.querySelector('.shortcut-grid');
      if (shortcutGrid) {
        shortcutGrid.innerHTML = `
          <div class="error-message">
            <p>Não foi possível carregar os registros clínicos.</p>
            <p>Por favor, tente novamente mais tarde.</p>
          </div>
        `;
      }
    }
  }

  // Função para visualizar um registro específico
  window.visualizarRegistro = function(id) {
    console.log('Visualizando registro com ID:', id); // Debug
    if (!id) {
      console.error('ID do registro não fornecido');
      return;
    }
    window.location.href = `vizualizacaoAnotacao.html?id=${encodeURIComponent(id)}`;
  };

  // Inicia o carregamento
  try {
    // Primeiro carrega os dados do médico
    const medicoCarregado = await carregarDadosMedico();
    if (!medicoCarregado) {
      throw new Error('Não foi possível carregar os dados do médico');
    }

    // Depois carrega os dados do paciente
    await carregarDadosPaciente();

    // Carrega os últimos registros clínicos
    await carregarUltimosRegistros();
  } catch (error) {
    console.error("Erro durante o carregamento:", error);
    mostrarErro(error.message || "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
  }
});