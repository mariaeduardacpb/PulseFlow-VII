document.addEventListener('DOMContentLoaded', async () => {
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

    // Não atualiza o campo médico responsável aqui - será atualizado depois com os dados da API

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
    console.log('Tipo de consulta recebido:', anotacao.tipoConsulta);
    console.log('Médico recebido:', anotacao.medico);

    // Atualiza os elementos com os dados da anotação
    // Atualiza o título no elemento oculto (para compatibilidade)
    const tituloElement = document.querySelector('.titulo');
    if (tituloElement) {
      tituloElement.innerHTML = `
        <strong>Motivo da Consulta</strong>
        <span>${anotacao.titulo || 'Sem título'}</span>
      `;
    }
    
    // Atualiza o título no elemento visível
    const tituloAnotacao = document.getElementById('tituloAnotacao');
    if (tituloAnotacao) {
      tituloAnotacao.textContent = anotacao.titulo || 'Registro Clínico';
    }
    
    // Formatação correta da data usando UTC
    const data = new Date(anotacao.data);
    const dataFormatada = `${data.getUTCDate().toString().padStart(2, '0')}/${(data.getUTCMonth() + 1).toString().padStart(2, '0')}/${data.getUTCFullYear()}`;
    const dataElement = document.querySelector('.data');
    if (dataElement) {
      dataElement.textContent = anotacao.data ? dataFormatada : 'Data não informada';
    }
    
    const categoriaElement = document.querySelector('.categoria');
    if (categoriaElement) {
      categoriaElement.textContent = anotacao.categoria || 'Categoria não informada';
    }
    
    // Função para formatar o tipo de consulta
    const formatarTipoConsulta = (tipo) => {
      if (!tipo) return 'Tipo não informado';
      
      const tipos = {
        'primeira': 'Primeira consulta',
        'rotina': 'Consulta de rotina',
        'preventiva': 'Consulta preventiva',
        'urgencia': 'Consulta de urgência/emergência',
        'retorno': 'Consulta de retorno',
        'segundaOpniao': 'Consulta de segunda opinião'
      };
      
      // Normaliza o valor para minúsculas para busca
      const tipoNormalizado = tipo.toLowerCase().trim();
      
      // Se encontrar no mapeamento, retorna o texto formatado
      if (tipos[tipoNormalizado]) {
        return tipos[tipoNormalizado];
      }
      
      // Se não encontrar no mapeamento, retorna o valor original formatado
      return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/([A-Z])/g, ' $1').trim();
    };
    
    // Usa tipoConsulta (camelCase) que é o nome correto do campo no modelo
    const tipoConsulta = anotacao.tipoConsulta || anotacao.tipo_consulta;
    const tipoConsultaElement = document.querySelector('.tipo-consulta');
    if (tipoConsultaElement) {
      const tipoFormatado = formatarTipoConsulta(tipoConsulta);
      tipoConsultaElement.textContent = tipoFormatado;
      console.log('Tipo de consulta formatado:', tipoFormatado);
    } else {
      console.error('Elemento .tipo-consulta não encontrado no DOM');
    }
    
    // Atualiza o nome do médico responsável usando o valor da API
    // Se a API retornar o nome do médico, usa ele, senão usa o médico logado como fallback
    const medicoNome = document.querySelector('.medico-nome');
    if (medicoNome) {
      if (anotacao.medico) {
        // Se a API já retornou o nome formatado do médico, usa ele
        medicoNome.textContent = anotacao.medico;
        console.log('Médico responsável definido da API:', anotacao.medico);
      } else if (medicoLogado) {
        // Fallback: usa o médico logado
        const prefixo = medicoLogado.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
        const nomeFormatado = `${prefixo} ${medicoLogado.nome}`;
        medicoNome.textContent = nomeFormatado;
        console.log('Médico responsável definido do médico logado:', nomeFormatado);
      } else {
        medicoNome.textContent = 'Médico não informado';
      }
    } else {
      console.error('Elemento .medico-nome não encontrado no DOM');
    }
    
    // Atualiza o conteúdo da anotação no elemento oculto (para compatibilidade)
    const anotacaoPElement = document.querySelector('.anotacao p');
    if (anotacaoPElement) {
      anotacaoPElement.textContent = anotacao.anotacao || 'Sem anotação';
    }
    
    // Atualiza o conteúdo da anotação no elemento visível
    const conteudoAnotacao = document.getElementById('conteudoAnotacao');
    if (conteudoAnotacao) {
      conteudoAnotacao.textContent = anotacao.anotacao || 'Sem anotação';
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

// Adicionar event listeners para os botões (aguarda o DOM estar pronto)
document.addEventListener('DOMContentLoaded', () => {
  const btnExcluir = document.getElementById('btnExcluir');
  if (btnExcluir) {
    // Remove o onclick inline se existir
    btnExcluir.removeAttribute('onclick');
    btnExcluir.addEventListener('click', () => {
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
        titleHeader.textContent = 'Registro Clínico';
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
            filename: `registro-clinico-${new Date().toISOString().split('T')[0]}.pdf`,
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