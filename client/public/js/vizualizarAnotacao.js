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

  // Carrega dados do médico logado primeiro
  let medicoLogado = null;
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

    medicoLogado = await res.json();
    const prefixo = medicoLogado.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
    const nomeFormatado = `${prefixo} ${medicoLogado.nome}`;
    
    // Atualiza o nome na sidebar
    const tituloSidebar = document.getElementById('medicoNomeSidebar');
    if (tituloSidebar) {
      tituloSidebar.textContent = nomeFormatado;
    }

    // Atualiza o nome no campo de médico responsável
    const medicoNome = document.querySelector('.medico-nome');
    if (medicoNome) {
      medicoNome.textContent = nomeFormatado;
    }

  } catch (error) {
    console.error("Erro ao carregar dados do médico:", error);
    const fallback = document.getElementById('medicoNomeSidebar');
    if (fallback) {
      fallback.textContent = 'Dr(a). Nome não encontrado';
    }
    mostrarAviso("Erro ao carregar dados do médico. Por favor, faça login novamente.");
  }

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
    
    // Formatação correta da data usando UTC
    const data = new Date(anotacao.data);
    const dataFormatada = `${data.getUTCDate().toString().padStart(2, '0')}/${(data.getUTCMonth() + 1).toString().padStart(2, '0')}/${data.getUTCFullYear()}`;
    document.querySelector('.data').textContent = anotacao.data ? dataFormatada : 'Data não informada';
    
    document.querySelector('.categoria').textContent = anotacao.categoria || 'Categoria não informada';
    document.querySelector('.tipo-consulta').textContent = anotacao.tipo_consulta || 'Tipo não informado';
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

    const clone = element.cloneNode(true);
    const container = document.createElement('div');
    container.style.padding = '20px';

    // Remover o logo duplicado do clone
    const duplicateLogo = clone.querySelector('.logo');
    if (duplicateLogo) {
        duplicateLogo.remove();
    }

    // Adicionar o logo e nome da empresa
    const logoElement = document.querySelector('.header .logo img');
    if (logoElement) {
        const headerContent = document.createElement('div');
        headerContent.style.textAlign = 'center';
        headerContent.style.marginBottom = '20px';
        
        const logoClone = logoElement.cloneNode(true);
        logoClone.style.height = '60px';
        headerContent.appendChild(logoClone);
        container.appendChild(headerContent);
    }

    // Hide buttons before generating PDF - apply to the cloned element
    const buttonsToHide = clone.querySelectorAll('.card-footer button, .btn-primary, .btn-secondary');
    buttonsToHide.forEach(button => {
      button.style.display = 'none';
    });

    container.appendChild(clone);

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
        useCORS: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(container).set(options).save().then(() => {
      // Show buttons again after PDF is generated (on the original element)
      const originalButtons = element.querySelectorAll('.card-footer button, .btn-primary, .btn-secondary');
      originalButtons.forEach(button => {
        button.style.display = '';
      });
      container.remove(); // Clean up the temporary container
    }).catch(error => {
        console.error('Erro ao gerar PDF:', error);
        mostrarAviso('Ocorreu um erro ao gerar o PDF.');
        container.remove(); // Ensure container is removed even on error
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

async function deleteAnnotation() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const anotacaoId = urlParams.get('id');
    
    if (!anotacaoId) {
      mostrarAviso('ID da anotação não encontrado');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAviso('Token não encontrado');
      return;
    }

    const confirmacao = confirm('Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.');
    if (!confirmacao) {
      return;
    }

    const response = await fetch(`http://localhost:65432/api/anotacoes/${anotacaoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao excluir anotação');
    }

    mostrarAviso('Anotação excluída com sucesso!');
    setTimeout(() => {
      window.location.href = 'historicoProntuario.html';
    }, 1500);

  } catch (error) {
    console.error('Erro:', error);
    mostrarAviso(error.message || 'Erro ao excluir anotação');
  }
}

// Adicionar event listeners para os botões
document.getElementById('btnExcluir').addEventListener('click', () => {
    Swal.fire({
        title: 'Excluir Anotação',
        text: 'Tem certeza que deseja excluir esta anotação?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, Excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteAnnotation();
        }
    });
});

document.getElementById('btnSalvarPDF').addEventListener('click', async () => {
    try {
        // Mostrar popup de carregamento
        Swal.fire({
            title: 'Gerando PDF...',
            text: 'Por favor, aguarde enquanto preparamos seu documento.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Configurações do PDF
        const element = document.querySelector('.note-card');
        const opt = {
            margin: 1,
            filename: 'registro-clinico.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Gerar PDF
        await html2pdf().set(opt).from(element).save();

        // Mostrar popup de sucesso
        Swal.fire({
            icon: 'success',
            title: 'PDF Gerado!',
            text: 'O documento foi salvo com sucesso.',
            confirmButtonColor: '#002A42'
        });

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível gerar o PDF. Por favor, tente novamente.',
            confirmButtonColor: '#002A42'
        });
    }
});

document.getElementById('btnImprimir').addEventListener('click', () => {
    Swal.fire({
        title: 'Imprimir Registro',
        text: 'Deseja imprimir este registro clínico?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, Imprimir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#002A42',
        cancelButtonColor: '#dc3545'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar popup de carregamento
            Swal.fire({
                title: 'Preparando impressão...',
                text: 'Por favor, aguarde enquanto preparamos o documento.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Criar um elemento temporário para impressão
            const printContent = document.createElement('div');
            printContent.className = 'print-content';
            
            // Adicionar estilos base
            const baseStyles = document.createElement('style');
            baseStyles.textContent = `
                @page {
                    size: A4;
                    margin: 1.5cm;
                }
                body {
                    font-family: 'Montserrat', Arial, sans-serif;
                    line-height: 1.5;
                    color: #333;
                    background: white;
                }
                .print-content {
                    max-width: 21cm;
                    margin: 0 auto;
                    padding: 0;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 1cm;
                    padding-bottom: 0.5cm;
                    border-bottom: 1px solid #002A42;
                }
                .print-header img {
                    height: 1.5cm;
                    margin-bottom: 0.3cm;
                }
                .print-header h1 {
                    color: #002A42;
                    font-size: 0.7cm;
                    margin: 0;
                    font-weight: 600;
                }
                .print-card {
                    background: white;
                    padding: 0.6cm;
                    margin-bottom: 0.6cm;
                }
                .print-card-header {
                    margin-bottom: 0.6cm;
                    padding-bottom: 0.3cm;
                    border-bottom: 1px solid #eee;
                }
                .print-card-title {
                    font-size: 0.6cm;
                    color: #002A42;
                    font-weight: 600;
                    margin: 0;
                }
                .print-card-subtitle {
                    color: #666;
                    font-size: 0.35cm;
                    margin-top: 0.1cm;
                }
                .print-status-badge {
                    display: inline-block;
                    padding: 0.15cm 0.3cm;
                    border-radius: 0.15cm;
                    font-size: 0.3cm;
                    font-weight: 500;
                    background: #f8f9fa;
                    color: #002A42;
                }
                .print-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.6cm;
                    margin-bottom: 0.8cm;
                }
                .print-info-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.3cm;
                }
                .print-info-icon {
                    color: #002A42;
                    width: 0.4cm;
                    height: 0.4cm;
                }
                .print-info-content {
                    flex: 1;
                }
                .print-info-content strong {
                    display: block;
                    color: #002A42;
                    margin-bottom: 0.1cm;
                    font-size: 0.3cm;
                }
                .print-info-content span {
                    color: #333;
                    font-size: 0.35cm;
                }
                .print-anotacao {
                    background: #f8f9fa;
                    padding: 0.4cm;
                    border-radius: 0.15cm;
                    margin-top: 0.6cm;
                }
                .print-anotacao-header {
                    display: flex;
                    align-items: center;
                    gap: 0.3cm;
                    margin-bottom: 0.3cm;
                }
                .print-anotacao-header strong {
                    color: #002A42;
                    font-size: 0.35cm;
                    font-weight: 600;
                }
                .print-anotacao-content {
                    color: #333;
                    font-size: 0.3cm;
                    line-height: 1.5;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-content, .print-content * {
                        visibility: visible;
                    }
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print-card {
                        box-shadow: none;
                        border: 1px solid #ddd;
                    }
                }
            `;
            
            // Criar o cabeçalho
            const header = document.createElement('div');
            header.className = 'print-header';
            
            const logo = document.querySelector('.logo img').cloneNode(true);
            const title = document.createElement('h1');
            title.textContent = 'Registro Clínico';
            
            header.appendChild(logo);
            header.appendChild(title);
            printContent.appendChild(header);

            // Clonar e formatar o conteúdo do registro
            const cardContent = document.querySelector('.note-card').cloneNode(true);
            cardContent.className = 'print-card';
            
            // Remover os botões do footer
            const footer = cardContent.querySelector('.card-footer');
            if (footer) {
                footer.remove();
            }

            // Aplicar classes de impressão
            const cardHeader = cardContent.querySelector('.card-header');
            cardHeader.className = 'print-card-header';
            
            const titleDiv = cardHeader.querySelector('.titulo');
            if (titleDiv) {
                const title = titleDiv.querySelector('strong');
                const subtitle = titleDiv.querySelector('span');
                if (title) title.className = 'print-card-title';
                if (subtitle) subtitle.className = 'print-card-subtitle';
            }

            const statusBadge = cardHeader.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'print-status-badge';
            }

            // Formatar grid de informações
            const infoGrid = cardContent.querySelector('.info-grid');
            if (infoGrid) {
                infoGrid.className = 'print-info-grid';
                infoGrid.querySelectorAll('.info-item').forEach(item => {
                    item.className = 'print-info-item';
                    const icon = item.querySelector('.info-icon');
                    const content = item.querySelector('.info-content');
                    if (icon) icon.className = 'print-info-icon';
                    if (content) content.className = 'print-info-content';
                });
            }

            // Formatar anotação
            const anotacao = cardContent.querySelector('.anotacao');
            if (anotacao) {
                anotacao.className = 'print-anotacao';
                const header = anotacao.querySelector('.anotacao-header');
                const content = anotacao.querySelector('.anotacao-content');
                if (header) header.className = 'print-anotacao-header';
                if (content) content.className = 'print-anotacao-content';
            }

            printContent.appendChild(cardContent);

            // Criar um iframe para impressão
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Adicionar estilos e conteúdo ao iframe
            iframe.contentDocument.head.appendChild(baseStyles);
            iframe.contentDocument.body.appendChild(printContent);

            // Pequeno delay para garantir que o conteúdo seja carregado
            setTimeout(() => {
                iframe.contentWindow.print();
                // Limpar após a impressão
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    Swal.close();
                }, 1000);
            }, 500);
        }
    });
});