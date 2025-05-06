document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const anotacaoId = params.get('id');
  
    if (!anotacaoId) {
      alert("Anotação não encontrada");
      return;
    }

    console.log('Buscando anotação com ID:', anotacaoId);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      const response = await fetch(`http://localhost:5000/api/anotacoes/detalhe/${anotacaoId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar anotação');
      }
  
      const anotacao = await response.json();
      console.log('Anotação recebida:', anotacao);

      if (!anotacao) {
        throw new Error('Dados da anotação não encontrados');
      }
  
      document.querySelector('.titulo').innerHTML = `<strong>Título:</strong> ${anotacao.titulo || 'Não especificado'}`;
      document.querySelector('.data').innerHTML = `<strong>Data:</strong> ${anotacao.data ? new Date(anotacao.data).toLocaleDateString('pt-BR') : 'Não especificada'}`;
      document.querySelector('.categoria').innerHTML = `<strong>Categoria:</strong> ${anotacao.categoria || 'Não especificada'}`;
      document.querySelector('.medico').innerHTML = `<strong>Médico Responsável:</strong><br> Draª ${anotacao.medico || 'Não especificado'}`;
      document.querySelector('.note-card p:last-of-type').textContent = anotacao.anotacao || 'Nenhuma anotação registrada';
  
    } catch (error) {
      console.error('Erro detalhado:', error);
      alert(`Erro ao carregar anotação: ${error.message}`);
    }
  });
  