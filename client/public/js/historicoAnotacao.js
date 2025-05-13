document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');

  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const cpf = paciente?.cpf;

  if (!cpf) {
    recordList.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
  }

  try {
    const response = await fetch(`http://localhost:5500/api/anotacoes/${cpf}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar anotações');
    }

    const anotacoes = await response.json();
    recordList.innerHTML = '';

    if (anotacoes.length === 0) {
      recordList.innerHTML = '<p>Nenhuma anotação encontrada.</p>';
      return;
    }

    anotacoes.forEach(anotacao => {
      const dataFormatada = new Date(anotacao.data).toLocaleDateString('pt-BR');
      const item = document.createElement('div');
      item.className = 'record-item';
      item.innerHTML = `
        <div class="info">
          <p class="titulo"><strong>Título:</strong> ${anotacao.titulo}</p>
          <p class="data"><strong>Data:</strong> ${dataFormatada}</p>
          <p class="categoria"><strong>Categoria:</strong> ${anotacao.categoria}</p>
          <p class="medico"><strong>Médico Responsável:</strong> Draª ${anotacao.medico}</p>
        </div>
        <a href="/client/views/vizualizacaoAnotacao.html?id=${anotacao._id}">Visualizar Prontuário</a>
      `;
      recordList.appendChild(item);
    });
  } catch (error) {
    console.error(error);
    recordList.innerHTML = '<p style="color: red;">Erro ao carregar anotações.</p>';
  }
});
