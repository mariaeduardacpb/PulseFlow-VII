document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get the patient's data from localStorage
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
      const response = await fetch('http://localhost:5000/api/eventos-clinicos', {
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
