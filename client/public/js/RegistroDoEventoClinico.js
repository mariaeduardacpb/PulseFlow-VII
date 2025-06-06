document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('form');
  const token = localStorage.getItem('token');

  // Chamada da função que exibe Dr(a). Nome na sidebar
  await carregarDadosMedico();

  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    if (!paciente || !paciente.cpf) {
      alert('Paciente não selecionado. Por favor, selecione um paciente primeiro.');
      window.location.href = '/selecao.html';
      return;
    }

    const formData = {
      cpfPaciente: paciente.cpf,
      titulo: document.getElementById('titulo').value,
      dataHora: document.getElementById('dataHora').value,
      tipoEvento: document.getElementById('tipoEvento').value,
      especialidade: document.getElementById('especialidade').value,
      intensidadeDor: document.getElementById('gravidade').value,
      alivio: document.getElementById('alivio').value,
      descricao: document.getElementById('descricao').value,
      sintomas: document.getElementById('sintomas').value
    };

    try {
      const response = await fetch('http://localhost:65432/api/eventos-clinicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar evento clínico');
      }

      alert('Evento clínico registrado com sucesso!');
      form.reset();
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message || 'Erro ao salvar evento clínico');
    }
  });
});

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