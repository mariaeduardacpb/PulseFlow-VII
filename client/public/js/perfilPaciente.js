window.addEventListener('DOMContentLoaded', async () => {
  // === 1. PUXA DADOS DO MÉDICO LOGADO ===
  async function carregarDadosMedico() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      const res = await fetch('http://localhost:5000/api/usuarios/perfil', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const medico = await res.json();
      if (!res.ok) throw new Error(medico.message);

      const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
      const nomeFormatado = `${prefixo} ${medico.nome}`;
      const tituloSidebar = document.querySelector('.sidebar .profile h3');
      if (tituloSidebar) {
        tituloSidebar.textContent = nomeFormatado;
      }
    } catch (error) {
      console.error("Erro ao carregar dados do médico:", error);
      const fallback = document.querySelector('.sidebar .profile h3');
      if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
      mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
    }
  }

  await carregarDadosMedico();

  // === 2. PUXA DADOS DO PACIENTE SELECIONADO ===
  const pacienteData = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const erroBox = document.getElementById('erroPerfil');

  if (!pacienteData || !pacienteData.id) {
    mostrarErro("Paciente não encontrado. Redirecionando para seleção...");
    setTimeout(() => window.location.href = "selecao.html", 2500);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Por favor, faça login novamente.');
    }

    const res = await fetch(`http://localhost:5000/api/pacientes/${pacienteData.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const paciente = await res.json();

    if (!res.ok) {
      throw new Error(paciente.message || 'Erro ao carregar dados do paciente');
    }

    preencherPerfil(paciente);
  } catch (error) {
    console.error("Erro ao carregar dados do paciente:", error);
    mostrarErro(error.message || "Erro ao carregar dados do paciente. Verifique sua conexão ou tente novamente.");
  }

  function mostrarErro(mensagem) {
    if (!erroBox) return;
    erroBox.textContent = `⚠️ ${mensagem}`;
    erroBox.style.display = 'block';
  }

  function preencherPerfil(paciente) {
    try {
      const imagemPerfil = document.querySelector('.profile-box img');
      if (imagemPerfil) {
        imagemPerfil.src = paciente.fotoPerfil || '../public/assets/perfilPhotoPadrao.png';
      }

      const infoContainer = document.querySelector('.info');
      if (infoContainer) {
        infoContainer.innerHTML = `
          <p class="fade-in"><strong>Nome do Paciente:</strong> ${paciente.nome || '-'}</p>
          <p class="fade-in"><strong>Gênero:</strong> ${paciente.genero || '-'}</p>
          <p class="fade-in"><strong>Idade:</strong> ${calcularIdadeTexto(paciente.dataNascimento)}</p>
          <p class="fade-in"><strong>Nacionalidade:</strong> ${paciente.nacionalidade || '-'}</p>
          <p class="fade-in"><strong>Altura:</strong> ${paciente.altura || '-'} cm</p>
          <p class="fade-in"><strong>Peso:</strong> ${paciente.peso || '-'} kg</p>
          <p class="fade-in"><strong>Profissão:</strong> ${paciente.profissao || '-'}</p>
          <p class="fade-in"><strong>E-mail:</strong> ${paciente.email || '-'}</p>
          <p class="fade-in"><strong>Telefone:</strong> ${paciente.telefone || '-'}</p>
          <p class="fade-in"><strong>Observações:</strong> ${paciente.observacoes || 'Nenhuma'}</p>
        `;
      }
    } catch (error) {
      console.error("Erro ao preencher perfil:", error);
      mostrarErro("Erro ao exibir dados do paciente. Por favor, recarregue a página.");
    }
  }

  function calcularIdadeTexto(dataISO) {
    if (!dataISO) return '-';
    try {
      const nascimento = new Date(dataISO);
      const hoje = new Date();
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
});