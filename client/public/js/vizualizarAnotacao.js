document.addEventListener('DOMContentLoaded', async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const anotacaoId = urlParams.get('id');
    console.log('Buscando anotação com ID:', anotacaoId);

    if (!anotacaoId) {
      throw new Error('ID da anotação não encontrado na URL');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`http://localhost:5000/api/anotacoes/detalhe/${anotacaoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar detalhes da anotação');
    }

    const anotacao = await response.json();
    console.log('Dados da anotação:', anotacao);

    // Atualiza os elementos com os dados da anotação
    document.querySelector('.titulo strong').textContent = anotacao.titulo || 'Sem título';
    document.querySelector('.data').textContent = anotacao.data ? new Date(anotacao.data).toLocaleDateString('pt-BR') : 'Data não informada';
    document.querySelector('.categoria').textContent = anotacao.categoria || 'Categoria não informada';
    document.querySelector('.medico-nome').textContent = anotacao.medico || 'Médico não informado';
    document.querySelector('.anotacao p').textContent = anotacao.anotacao || 'Sem anotação';

  } catch (error) {
    console.error('Erro:', error);
    alert(error.message || 'Erro ao carregar os detalhes da anotação');
  }
});
  