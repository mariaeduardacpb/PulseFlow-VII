document.addEventListener('DOMContentLoaded', async () => {
  // Toggle da Sidebar
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Fechar sidebar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
    }
  });

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const anotacaoId = urlParams.get('id');
    console.log('Buscando anotação com ID:', anotacaoId);

    if (!anotacaoId) {
      mostrarAviso('ID da anotação não encontrado na URL');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAviso('Token não encontrado');
      return;
    }

    const response = await fetch(`http://localhost:65432/api/anotacoes/detalhe/${anotacaoId}`, {
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
    document.querySelector('.titulo').innerHTML = `
      <strong>Motivo da Consulta</strong>
      <span>${anotacao.titulo || 'Sem título'}</span>
    `;
    document.querySelector('.data').textContent = anotacao.data ? new Date(anotacao.data).toLocaleDateString('pt-BR') : 'Data não informada';
    document.querySelector('.categoria').textContent = anotacao.categoria || 'Categoria não informada';
    document.querySelector('.medico-nome').textContent = anotacao.medico || 'Médico não informado';
    document.querySelector('.anotacao p').textContent = anotacao.anotacao || 'Sem anotação';

    // Adiciona event listener para o botão Salvar PDF
    const savePdfButton = document.querySelector('.card-footer .btn-secondary:nth-child(2)');
    if (savePdfButton) {
      savePdfButton.addEventListener('click', downloadClinicalRecordAsPdf);
    }

  } catch (error) {
    console.error('Erro:', error);
    mostrarAviso(error.message || 'Erro ao carregar os detalhes da anotação');
  }
});

// Função para baixar o registro clínico como PDF
function downloadClinicalRecordAsPdf() {
  console.log('Botão Salvar PDF clicado.');
  const element = document.querySelector('.note-card');

  if (element) {
    console.log('Elemento .note-card encontrado. Iniciando conversão para PDF.', element);

    // Hide buttons before generating PDF
    const buttonsToHide = element.querySelectorAll('.card-footer button, .btn-primary, .btn-secondary');
    buttonsToHide.forEach(button => {
      button.style.display = 'none';
    });

    // Configurações para html2pdf
    const options = {
      margin: 10,
      filename: 'registro_clinico.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        logging: true, 
        dpi: 192, 
        letterRendering: true, 
        useCORS: true,
        onclone: function(clonedDoc) {
          // Hide buttons in the cloned document
          const clonedButtons = clonedDoc.querySelectorAll('.card-footer button, .btn-primary, .btn-secondary');
          clonedButtons.forEach(button => {
            button.style.display = 'none';
          });
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(options).save().then(() => {
      // Show buttons again after PDF is generated
      buttonsToHide.forEach(button => {
        button.style.display = '';
      });
    });

  } else {
    console.log('Elemento .note-card não encontrado.');
    mostrarAviso('Não foi possível encontrar o conteúdo do registro clínico para salvar como PDF.');
  }
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