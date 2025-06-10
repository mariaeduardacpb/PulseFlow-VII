document.addEventListener('DOMContentLoaded', async () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
    }
  });

  await carregarDadosMedico(); // <- Exibe "Dr(a). Nome" na sidebar

  const recordList = document.querySelector('.record-list');
  const filterCategory = document.getElementById('filterCategory');
  const filterDoctor = document.getElementById('filterDoctor');
  const customSelect = document.querySelector('.custom-select');
  const selectOptions = document.getElementById('especialidadesList');
  let allAnotacoes = [];
  let originalSpecialtyOptions = [];

  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const cpf = paciente?.cpf;

  if (!cpf) {
    recordList.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
  }

  originalSpecialtyOptions = Array.from(selectOptions.querySelectorAll('.option'));

  function formatarNomeMedico(nome) {
    nome = nome.replace(/^(Dra\.|Draª|Dr\.)\s*/i, '');
    return `Draª ${nome}`;
  }

  function mostrarAviso(mensagem) {
    const aviso = document.createElement('div');
    aviso.style.cssText = `
      position: fixed; top: 20px; right: 20px; background-color: #fff;
      color: #002A42; padding: 16px 20px; border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 42, 66, 0.1); z-index: 1000;
      font-family: 'Montserrat', sans-serif; font-size: 14px;
      border: 1px solid #e1e5eb; display: flex; align-items: center;
      gap: 12px; min-width: 300px; max-width: 400px; animation: slideIn 0.3s ease-out;
    `;

    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg width="24" height="24" stroke="currentColor"><circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    `;

    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';
    textContainer.textContent = mensagem;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `background: none; border: none; cursor: pointer; color: #94a3b8;`;
    closeButton.innerHTML = `<svg width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeButton.onclick = () => aviso.remove();

    aviso.append(icon, textContainer, closeButton);
    document.body.appendChild(aviso);

    setTimeout(() => aviso.remove(), 5000);
  }

  function renderAnotacoes(anotacoes) {
    recordList.innerHTML = '';

    if (anotacoes.length === 0) {
      recordList.innerHTML = '<p>Nenhum Registro Clinico encontrado.</p>';
      return;
    }

    anotacoes.forEach(anotacao => {
      const data = new Date(anotacao.data);
      const dataFormatada = `${data.getUTCDate().toString().padStart(2, '0')}/${(data.getUTCMonth() + 1).toString().padStart(2, '0')}/${data.getUTCFullYear()}`;
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

  function filtrarAnotacoes() {
    const especialidadeFiltro = filterCategory.value.toLowerCase();
    const medicoFiltro = filterDoctor.value.toLowerCase();

    const anotacoesFiltradas = allAnotacoes.filter(anotacao => {
      const especialidadeMatch = (especialidadeFiltro === 'todas as especialidades' || especialidadeFiltro === '') ||
                                 anotacao.categoria.toLowerCase().includes(especialidadeFiltro);
      
      const medicoMatch = !medicoFiltro || anotacao.medico.toLowerCase().includes(medicoFiltro);
      return especialidadeMatch && medicoMatch;
    });

    renderAnotacoes(anotacoesFiltradas);
  }

  function filterSpecialtyOptions(inputText) {
    const lowerInput = inputText.toLowerCase();
    selectOptions.innerHTML = '';

    const filteredOptions = originalSpecialtyOptions.filter(option =>
      option.textContent.toLowerCase().includes(lowerInput)
    );

    if (filteredOptions.length > 0) {
      filteredOptions.forEach(option => selectOptions.appendChild(option));
      customSelect.classList.add('active');
    } else {
      customSelect.classList.remove('active');
    }
  }

  filterCategory.addEventListener('input', () => {
    filterSpecialtyOptions(filterCategory.value);
    filtrarAnotacoes();
  });

  filterCategory.addEventListener('click', () => {
    if (filterCategory.value === '') {
      filterSpecialtyOptions('');
    }
    customSelect.classList.add('active');
  });

  selectOptions.addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (option) {
      filterCategory.value = option.dataset.value;
      customSelect.classList.remove('active');
      document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      filtrarAnotacoes();
    }
  });

  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target) && e.target !== filterCategory) {
      customSelect.classList.remove('active');
    }
  });

  filterDoctor.addEventListener('input', filtrarAnotacoes);

  try {
    const response = await fetch(`http://localhost:65432/api/anotacoes/${cpf}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Erro ao buscar Registro Clinico');

    allAnotacoes = await response.json();
    renderAnotacoes(allAnotacoes);

  } catch (error) {
    console.error(error);
    recordList.innerHTML = '<p style="color: red;">Erro ao carregar anotações.</p>';
  }

  // Adicionar event listener para o botão de novo registro
  document.getElementById('btnNovoRegistro').addEventListener('click', () => {
    Swal.fire({
      title: 'Novo Registro Clínico',
      text: 'Deseja criar um novo registro clínico?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, Criar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#002A42',
      cancelButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar popup de carregamento
        Swal.fire({
          title: 'Preparando formulário...',
          text: 'Por favor, aguarde enquanto preparamos o formulário.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Pequeno delay para garantir que o popup seja mostrado
        setTimeout(() => {
          window.location.href = 'criarAnotações.html';
        }, 1000);
      }
    });
  });
});

// Função padrão para exibir nome do(a) médico(a) na sidebar
async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado. Por favor, faça login novamente.');

    const res = await fetch('http://localhost:65432/api/usuarios/perfil', {
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
    return false;
  }
}