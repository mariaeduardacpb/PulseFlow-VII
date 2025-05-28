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

      const res = await fetch('http://localhost:5000/api/usuarios/perfil', {
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
      const res = await fetch(`http://localhost:5000/api/pacientes/${pacienteData.id}`, {
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
        imagemPerfil.src = paciente.fotoPerfil || '../public/assets/perfilPhotoPadrao.png';
        imagemPerfil.onerror = () => {
          imagemPerfil.src = '../public/assets/perfilPhotoPadrao.png';
        };
      }

      // Atualiza as informações
      const infoContainer = document.querySelector('.info');
      if (infoContainer) {
        // Adiciona classe para animação
        infoContainer.classList.add('fade-in');
        
        // Formata os dados antes de exibir
        const dadosFormatados = {
          nome: paciente.nome || '-',
          genero: paciente.genero || '-',
          idade: calcularIdadeTexto(paciente.dataNascimento),
          nacionalidade: paciente.nacionalidade || '-',
          altura: paciente.altura ? `${paciente.altura} cm` : '-',
          peso: paciente.peso ? `${paciente.peso} kg` : '-',
          profissao: paciente.profissao || '-',
          email: paciente.email || '-',
          telefone: formatarTelefone(paciente.telefone) || '-',
          observacoes: paciente.observacoes || 'Nenhuma'
        };

        // Atualiza o HTML com os dados formatados
        infoContainer.innerHTML = Object.entries(dadosFormatados)
          .map(([key, value]) => `
            <p class="fade-in">
              <strong>${formatarLabel(key)}:</strong> ${value}
            </p>
          `).join('');

        // Adiciona animação de fade-in para cada elemento
        setTimeout(() => {
          const elementos = infoContainer.querySelectorAll('p');
          elementos.forEach((el, index) => {
            el.style.animation = `fadeIn 0.3s ease-in ${index * 0.1}s`;
          });
        }, 100);
      }
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

  // Inicia o carregamento
  try {
    // Primeiro carrega os dados do médico
    const medicoCarregado = await carregarDadosMedico();
    if (!medicoCarregado) {
      throw new Error('Não foi possível carregar os dados do médico');
    }

    // Depois carrega os dados do paciente
    await carregarDadosPaciente();
  } catch (error) {
    console.error("Erro durante o carregamento:", error);
    mostrarErro(error.message || "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
  }
});