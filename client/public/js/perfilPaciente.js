window.addEventListener('DOMContentLoaded', async () => {
    const pacienteData = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    const erroBox = document.getElementById('erroPerfil');
  
    if (!pacienteData || !pacienteData.id) {
      mostrarErro("Paciente não encontrado. Redirecionando para seleção...");
      setTimeout(() => window.location.href = "selecao.html", 2500);
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/pacientes/${pacienteData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      const paciente = await res.json();
  
      if (!res.ok) {
        throw new Error(paciente.message);
      }
  
      preencherPerfil(paciente);
    } catch (error) {
      console.error(error);
      mostrarErro("Erro ao carregar dados do paciente. Verifique sua conexão ou tente novamente.");
    }
  
    function mostrarErro(mensagem) {
      erroBox.textContent = `⚠️ ${mensagem}`;
      erroBox.classList.add('ativo');
    }
  
    function preencherPerfil(paciente) {
      document.querySelector('.profile-box img').src = paciente.fotoUrl || '../public/assets/perfilPhotoPadrao.png';
      document.querySelector('.info').innerHTML = `
        <p class="fade-in"><strong>Nome do Paciente:</strong> ${paciente.nome}</p>
        <p class="fade-in"><strong>Gênero:</strong> ${paciente.genero || '-'}</p>
        <p class="fade-in"><strong>Idade:</strong> ${calcularIdadeTexto(paciente.dataNascimento)}</p>
        <p class="fade-in"><strong>Nacionalidade:</strong> ${paciente.nacionalidade || '-'}</p>
        <p class="fade-in"><strong>Altura:</strong> ${paciente.altura || '-'} cm</p>
        <p class="fade-in"><strong>Peso:</strong> ${paciente.peso || '-'} kg</p>
        <p class="fade-in"><strong>Profissão:</strong> ${paciente.profissao || '-'}</p>
        <p class="fade-in"><strong>E-mail:</strong> ${paciente.email}</p>
        <p class="fade-in"><strong>Telefone:</strong> ${paciente.telefone || '-'}</p>
        <p class="fade-in"><strong>Observações:</strong> ${paciente.observacoes || 'Nenhuma'}</p>
      `;
    }
  
    function calcularIdadeTexto(dataISO) {
      if (!dataISO) return '-';
      const nascimento = new Date(dataISO);
      const hoje = new Date();
      let anos = hoje.getFullYear() - nascimento.getFullYear();
      let meses = hoje.getMonth() - nascimento.getMonth();
      if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
        anos--;
        meses += 12;
      }
      return `${anos} anos e ${meses} meses`;
    }
  });