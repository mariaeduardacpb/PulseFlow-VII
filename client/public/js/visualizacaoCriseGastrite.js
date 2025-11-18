document.addEventListener('DOMContentLoaded', async () => {
  // Função para formatar a data
  function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
  }

  // Função para determinar a classe de intensidade
  function getIntensityClass(intensity) {
    if (intensity === 0) return 'sem-dor';
    if (intensity >= 1 && intensity <= 3) return 'leve';
    if (intensity >= 4 && intensity <= 6) return 'moderada';
    if (intensity >= 7 && intensity <= 9) return 'intensa';
    if (intensity === 10) return 'insuportavel';
    return '';
  }

  // Função para determinar o texto de intensidade
  function getIntensityText(intensity) {
    if (intensity === 0) return 'Sem dor';
    if (intensity >= 1 && intensity <= 3) return 'Dor leve';
    if (intensity >= 4 && intensity <= 6) return 'Dor Moderada';
    if (intensity >= 7 && intensity <= 9) return 'Dor Intensa';
    if (intensity === 10) return 'Dor insuportável';
    return 'Intensidade não especificada';
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const criseId = urlParams.get('id');

    if (!criseId) {
      mostrarAviso('ID da crise não encontrado na URL');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAviso('Token não encontrado');
      return;
    }

    const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    if (!paciente || !paciente.cpf) {
      mostrarAviso('Paciente não selecionado');
      return;
    }

    const API_URL = window.API_URL || 'http://localhost:65432';
    console.log('Buscando crise:', {
      cpf: paciente.cpf,
      criseId: criseId,
      url: `${API_URL}/api/gastrite/crises/${paciente.cpf}/${criseId}`
    });

    const response = await fetch(`${API_URL}/api/gastrite/crises/${paciente.cpf}/${criseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Crise não encontrada');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao carregar detalhes da crise');
    }

    const crise = await response.json();
    console.log('Dados da crise:', crise);

    // Preencher os dados da crise
    const dataElement = document.getElementById('dataCrise');
    if (dataElement) {
      dataElement.textContent = crise.data ? formatDate(crise.data) : 'Data não disponível';
    }
    
    const intensidadeDor = document.getElementById('intensidadeDor');
    if (intensidadeDor) {
      const intensityClass = getIntensityClass(crise.intensidadeDor);
      const intensityText = getIntensityText(crise.intensidadeDor);
      intensidadeDor.innerHTML = `<span class="intensity ${intensityClass}">${intensityText} (${crise.intensidadeDor}/10)</span>`;
    }
    
    const alivioMedicacao = document.getElementById('alivioMedicacao');
    if (alivioMedicacao) {
      alivioMedicacao.textContent = crise.alivioMedicacao ? 'Sim' : 'Não';
    }
    
    const sintomas = document.getElementById('sintomas');
    if (sintomas) {
      sintomas.textContent = crise.sintomas || 'Não informados.';
    }
    
    const alimentos = document.getElementById('alimentos');
    if (alimentos) {
      alimentos.textContent = crise.alimentosIngeridos || 'Não informados.';
    }
    
    const medicacao = document.getElementById('medicacao');
    if (medicacao) {
      medicacao.textContent = crise.medicacao || 'Não informada.';
    }
    
    const observacoes = document.getElementById('observacoes');
    if (observacoes) {
      observacoes.textContent = crise.observacoes || 'Nenhuma observação adicional registrada.';
    }

  } catch (error) {
    console.error('Erro:', error);
    mostrarAviso(error.message || 'Erro ao carregar os detalhes da crise');
  }
});

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
      if (document.body.contains(aviso)) {
        document.body.removeChild(aviso);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
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
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 300);
    }
  }, 5000);
}

async function deleteCrise() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const criseId = urlParams.get('id');
    
    if (!criseId) {
      mostrarAviso('ID da crise não encontrado');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAviso('Token não encontrado');
      return;
    }

    const API_URL = window.API_URL || 'http://localhost:65432';

    const response = await fetch(`${API_URL}/api/gastrite/crises/${criseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao excluir crise');
    }

    mostrarAviso('Crise excluída com sucesso!');
    setTimeout(() => {
      window.location.href = 'historicoCriseGastrite.html';
    }, 1500);

  } catch (error) {
    console.error('Erro:', error);
    mostrarAviso(error.message || 'Erro ao excluir crise');
  }
}

// Adicionar event listeners para os botões (aguarda o DOM estar pronto)
document.addEventListener('DOMContentLoaded', () => {
  const btnExcluir = document.getElementById('btnExcluir');
  if (btnExcluir) {
    // Remove o onclick inline se existir
    btnExcluir.removeAttribute('onclick');
    btnExcluir.addEventListener('click', () => {
      Swal.fire({
        title: 'Excluir Crise',
        text: 'Tem certeza que deseja excluir esta crise de gastrite?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, Excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteCrise();
        }
      });
    });
  }

  const btnSalvarPDF = document.getElementById('btnSalvarPDF');
  if (btnSalvarPDF) {
    btnSalvarPDF.addEventListener('click', async () => {
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

        // Obter o elemento original
        const element = document.querySelector('.note-card');
        if (!element) {
          throw new Error('Elemento .note-card não encontrado');
        }
        
        // Salvar estilos originais dos botões para restaurar depois
        const cardActions = element.querySelector('.card-actions');
        const originalActionsDisplay = cardActions ? cardActions.style.display : '';
        
        // Esconder botões temporariamente
        if (cardActions) {
          cardActions.style.display = 'none';
        }
        
        // Criar container profissional para o PDF
        const pdfContainer = document.createElement('div');
        pdfContainer.id = 'pdf-professional-container';
        pdfContainer.style.width = '210mm';
        pdfContainer.style.minHeight = '297mm';
        pdfContainer.style.backgroundColor = '#ffffff';
        pdfContainer.style.padding = '20mm 25mm';
        pdfContainer.style.fontFamily = 'Inter, sans-serif';
        pdfContainer.style.color = '#0f172a';
        pdfContainer.style.margin = '0 auto';
        pdfContainer.style.boxSizing = 'border-box';
        pdfContainer.style.lineHeight = '1.6';
        
        // Criar cabeçalho profissional
        const header = document.createElement('div');
        header.style.borderBottom = '2px solid #002A42';
        header.style.paddingBottom = '12px';
        header.style.marginBottom = '25px';
        
        const titleHeader = document.createElement('h1');
        titleHeader.textContent = 'Crise de Gastrite';
        titleHeader.style.fontSize = '24px';
        titleHeader.style.fontWeight = '700';
        titleHeader.style.color = '#002A42';
        titleHeader.style.margin = '0 0 6px 0';
        titleHeader.style.textAlign = 'center';
        titleHeader.style.letterSpacing = '-0.5px';
        
        const docInfo = document.createElement('div');
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        docInfo.textContent = `Documento gerado em ${dataFormatada} às ${horaFormatada}`;
        docInfo.style.fontSize = '10px';
        docInfo.style.color = '#64748b';
        docInfo.style.textAlign = 'center';
        docInfo.style.fontWeight = '500';
        docInfo.style.letterSpacing = '0.3px';
        
        header.appendChild(titleHeader);
        header.appendChild(docInfo);
        
        // Clonar o conteúdo do card para manter formatação
        const contentClone = element.cloneNode(true);
        
        // Remover botões do clone também
        const cloneActions = contentClone.querySelector('.card-actions');
        if (cloneActions) {
          cloneActions.remove();
        }
        
        // Ajustar estilos do clone para PDF profissional
        contentClone.style.boxShadow = 'none';
        contentClone.style.border = 'none';
        contentClone.style.borderRadius = '0';
        contentClone.style.padding = '0';
        contentClone.style.margin = '0';
        contentClone.style.background = 'transparent';
        contentClone.style.fontSize = '13px';
        
        // Remover a barra superior do clone e melhorar espaçamento
        const styleElement = document.createElement('style');
        styleElement.id = 'pdf-style-temp';
        styleElement.textContent = `
          #pdf-professional-container .note-card::before {
            display: none !important;
            content: none !important;
          }
          #pdf-professional-container .note-card {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          #pdf-professional-container .card-header {
            margin-bottom: 20px !important;
            padding-bottom: 15px !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          #pdf-professional-container .card-title {
            font-size: 20px !important;
            color: #0f172a !important;
            margin-bottom: 0 !important;
          }
          #pdf-professional-container .info-grid {
            gap: 16px !important;
            margin-bottom: 24px !important;
          }
          #pdf-professional-container .info-item {
            padding: 16px 20px !important;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          #pdf-professional-container .detail-section {
            margin-top: 24px !important;
            padding-top: 20px !important;
            border-top: 1px solid #e2e8f0 !important;
          }
          #pdf-professional-container .detail-section h3 {
            font-size: 13px !important;
            margin-bottom: 12px !important;
          }
        `;
        document.head.appendChild(styleElement);
        
        // Montar container
        pdfContainer.appendChild(header);
        pdfContainer.appendChild(contentClone);
        
        // Adicionar ao body temporariamente (visível para html2canvas capturar)
        pdfContainer.style.position = 'fixed';
        pdfContainer.style.top = '0';
        pdfContainer.style.left = '0';
        pdfContainer.style.zIndex = '-9999';
        pdfContainer.style.opacity = '0';
        document.body.appendChild(pdfContainer);
        
        // Aguardar renderização
        await new Promise(resolve => setTimeout(resolve, 300));

        // Configurações do PDF profissionais
        const opt = {
            margin: 0,
            filename: `crise-gastrite-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowWidth: 794,
              windowHeight: 1123
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true
            }
        };

        // Gerar PDF do container profissional
        await html2pdf().set(opt).from(pdfContainer).save();

        // Limpar: remover container temporário
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
        }
        
        // Restaurar estilos originais dos botões
        if (cardActions) {
          cardActions.style.display = originalActionsDisplay || '';
        }
        
        // Remover estilo temporário
        setTimeout(() => {
          const tempStyle = document.getElementById('pdf-style-temp');
          if (tempStyle && document.head.contains(tempStyle)) {
            document.head.removeChild(tempStyle);
          }
        }, 100);

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
  }

  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', () => {
      window.print();
    });
  }
});
