document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterCategory = document.getElementById('filterCategory');
  const filterDoctor = document.getElementById('filterDoctor');
  const filterButton = document.getElementById('filterButton');
  const customSelect = document.querySelector('.custom-select');
  const selectOptions = document.getElementById('especialidadesList');
  let allAnotacoes = [];

  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const cpf = paciente?.cpf;

  if (!cpf) {
    recordList.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
  }

  // Função para formatar o nome do médico
  function formatarNomeMedico(nome) {
    // Remove qualquer prefixo existente (Dra., Draª, Dr., etc)
    nome = nome.replace(/^(Dra\.|Draª|Dr\.)\s*/i, '');
    // Adiciona o prefixo Draª
    return `Draª ${nome}`;
  }

  // Função para mostrar mensagem de aviso
  function mostrarAviso(mensagem) {
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

    // Ícone de alerta
    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;

    // Container do texto
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
    textContainer.textContent = mensagem;

    // Botão de fechar
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

    // Adiciona os elementos ao aviso
    aviso.appendChild(icon);
    aviso.appendChild(textContainer);
    aviso.appendChild(closeButton);
    document.body.appendChild(aviso);

    // Adiciona estilo para a animação
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

    // Remove o aviso após 5 segundos
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

  // Função para renderizar as anotações
  function renderAnotacoes(anotacoes) {
    recordList.innerHTML = '';

    if (anotacoes.length === 0) {
      recordList.innerHTML = '<p>Nenhum Registro Clinico encontrado.</p>';
      return;
    }

    anotacoes.forEach(anotacao => {
      const dataFormatada = new Date(anotacao.data).toLocaleDateString('pt-BR');
      const nomeMedicoFormatado = formatarNomeMedico(anotacao.medico);
      const item = document.createElement('div');
      item.className = 'record-item';
      item.innerHTML = `
        <div class="info">
          <p class="titulo"><strong>Motivo da Consulta:</strong> ${anotacao.titulo}</p>
          <p class="data"><strong>Data:</strong> ${dataFormatada}</p>
          <p class="especialidade"><strong>Especialidade:</strong> ${anotacao.categoria}</p>
          <p class="medico"><strong>Médico Responsável:</strong> ${nomeMedicoFormatado}</p>
        </div>
        <a href="/client/views/vizualizacaoAnotacao.html?id=${anotacao._id}">Visualizar Registro Clinico</a>
      `;
      recordList.appendChild(item);
    });
  }

  // Função para filtrar as anotações
  function filtrarAnotacoes() {
    const especialidadeFiltro = filterCategory.value.toLowerCase();
    const medicoFiltro = filterDoctor.value.toLowerCase();

    // Verifica se nenhum filtro foi preenchido
    if (!especialidadeFiltro && !medicoFiltro) {
      mostrarAviso('Por favor, selecione pelo menos um filtro para buscar.');
      return;
    }

    const anotacoesFiltradas = allAnotacoes.filter(anotacao => {
      // Se "Todas as Especialidades" estiver selecionado, não filtra por especialidade
      const especialidadeMatch = especialidadeFiltro === 'todas as especialidades' || 
        !especialidadeFiltro || 
        anotacao.categoria.toLowerCase().includes(especialidadeFiltro);
      
      const medicoMatch = !medicoFiltro || 
        anotacao.medico.toLowerCase().includes(medicoFiltro);
      
      return especialidadeMatch && medicoMatch;
    });

    renderAnotacoes(anotacoesFiltradas);
  }

  // Event listeners para o dropdown customizado
  filterCategory.addEventListener('click', (e) => {
    e.preventDefault();
    customSelect.classList.toggle('active');
  });

  selectOptions.addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (option) {
      const value = option.dataset.value;
      filterCategory.value = value;
      customSelect.classList.remove('active');
      
      // Remove a classe selected de todas as opções
      document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      // Adiciona a classe selected à opção clicada
      option.classList.add('selected');
      
      filtrarAnotacoes();
    }
  });

  // Fechar o dropdown quando clicar fora
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('active');
    }
  });

  // Event listeners para os filtros
  filterButton.addEventListener('click', filtrarAnotacoes);
  
  // Filtro ao pressionar Enter nos campos
  filterDoctor.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filtrarAnotacoes();
  });

  // Limpar filtro de especialidade ao selecionar "Todas as Especialidades"
  filterCategory.addEventListener('change', (e) => {
    if (e.target.value.toLowerCase() === 'todas as especialidades') {
      e.target.value = '';
      filtrarAnotacoes();
    }
  });

  try {
    const response = await fetch(`http://localhost:5000/api/anotacoes/${cpf}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar Registro Clinico');
    }

    allAnotacoes = await response.json();
    renderAnotacoes(allAnotacoes);

  } catch (error) {
    console.error(error);
    recordList.innerHTML = '<p style="color: red;">Erro ao carregar anotações.</p>';
  }
});
