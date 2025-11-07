// Configuração da API
const API_URL = window.API_URL || 'http://localhost:65432';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Página carregada, iniciando...');
  
  // Verificar se os elementos existem
  console.log('Verificando elementos:');
  console.log('btnVoltar:', document.getElementById('btnVoltar'));
  console.log('tituloEvento:', document.getElementById('tituloEvento'));
  console.log('dataHora:', document.getElementById('dataHora'));
  console.log('descricao:', document.getElementById('descricao'));
  
  await carregarDadosMedico();
  await carregarEventoClinico();
  inicializarEventos();
});

// Função para carregar dados do médico
async function carregarDadosMedico() {
    try {
        const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
      throw new Error('Erro ao carregar dados do médico');
        }

        const medico = await res.json();
        const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
        const nomeFormatado = `${prefixo} ${medico.nome}`;
        
        const tituloSidebar = document.getElementById('medicoNomeSidebar');
        if (tituloSidebar) {
            tituloSidebar.textContent = nomeFormatado;
        }

    return true;
    } catch (error) {
        console.error("Erro ao carregar dados do médico:", error);
        const fallback = document.getElementById('medicoNomeSidebar');
        if (fallback) {
            fallback.textContent = 'Dr(a). Nome não encontrado';
        }
    mostrarAviso("Erro ao carregar dados do médico. Por favor, faça login novamente.", 'error');
    return false;
  }
}

// Função para mostrar mensagem de aviso
function mostrarAviso(mensagem, tipo = 'info') {
  Swal.fire({
    title: tipo === 'error' ? 'Erro' : 'Informação',
    text: mensagem,
    icon: tipo === 'error' ? 'error' : 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#3b82f6'
  });
}

// Função para carregar evento clínico
async function carregarEventoClinico() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');

    console.log('ID do evento:', eventoId);

        if (!eventoId) {
      mostrarAviso('ID do evento não fornecido', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
      mostrarAviso('Token não encontrado. Faça login novamente.', 'error');
      return;
        }

    console.log('Fazendo requisição para:', `${API_URL}/api/eventos-clinicos/${eventoId}`);

    const response = await fetch(`${API_URL}/api/eventos-clinicos/${eventoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

    console.log('Status da resposta:', response.status);

        if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
      throw new Error(`Erro ao carregar detalhes do evento: ${response.status}`);
        }

        const evento = await response.json();
    console.log('Dados do evento recebidos:', evento);

    preencherDadosEvento(evento);

  } catch (error) {
    console.error('Erro ao carregar evento:', error);
    mostrarAviso('Erro ao carregar detalhes do evento: ' + error.message, 'error');
  }
}

// Função para preencher dados do evento
function preencherDadosEvento(evento) {
  console.log('Preenchendo dados do evento:', evento);
  console.log('Campos disponíveis:', Object.keys(evento));
  
  // Título do evento
  const tituloElement = document.getElementById('tituloEvento');
  if (tituloElement) {
    tituloElement.textContent = evento.titulo || 'Evento Clínico';
    console.log('Título definido:', evento.titulo);
  }
  
  // Tipo do evento
  const tipoEventoElement = document.getElementById('tipoEvento');
  const tipoEventoText = document.getElementById('tipoEventoText');
  if (tipoEventoElement && tipoEventoText) {
    tipoEventoText.textContent = evento.tipoEvento || 'Evento Clínico';
    tipoEventoElement.className = `event-type ${getEventTypeClass(evento.tipoEvento)}`;
    console.log('Tipo do evento definido:', evento.tipoEvento);
  }
  
  // Data e hora
  const dataHoraElement = document.getElementById('dataHora');
  if (dataHoraElement) {
    dataHoraElement.textContent = formatarDataHora(evento.dataHora);
    console.log('Data/Hora definida:', evento.dataHora);
  }
  
  // Especialidade
  const especialidadeElement = document.getElementById('especialidade');
  if (especialidadeElement) {
    especialidadeElement.textContent = evento.especialidade || 'Não informado';
    console.log('Especialidade definida:', evento.especialidade);
  }
  
  // Intensidade da dor
  const intensidadeDorElement = document.getElementById('intensidadeDor');
  if (intensidadeDorElement) {
    intensidadeDorElement.textContent = formatarIntensidadeDor(evento.intensidadeDor);
    console.log('Intensidade da dor definida:', evento.intensidadeDor);
  }
  
  // Alívio
  const alivioElement = document.getElementById('alivio');
  if (alivioElement) {
    alivioElement.textContent = evento.alivio || 'Não informado';
    console.log('Alívio definido:', evento.alivio);
  }
  
  // Médico responsável - verificar diferentes campos possíveis
  const medicoElement = document.getElementById('medicoResponsavel');
  if (medicoElement) {
    // Verificar se há informações do médico no objeto paciente
    let medicoNome = 'Não informado';
    
    if (evento.medico) {
      medicoNome = evento.medico;
    } else if (evento.medicoNome) {
      medicoNome = evento.medicoNome;
    } else if (evento.medicoResponsavel) {
      medicoNome = evento.medicoResponsavel;
    } else if (evento.createdBy) {
      medicoNome = evento.createdBy;
    } else if (evento.paciente && evento.paciente.medico) {
      medicoNome = evento.paciente.medico;
    } else if (evento.paciente && evento.paciente.medicoNome) {
      medicoNome = evento.paciente.medicoNome;
    } else if (evento.paciente && evento.paciente.medicoResponsavel) {
      medicoNome = evento.paciente.medicoResponsavel;
    }
    
    medicoElement.textContent = medicoNome;
    console.log('Médico definido:', medicoNome);
    console.log('Campos de médico disponíveis:', {
      medico: evento.medico,
      medicoNome: evento.medicoNome,
      medicoResponsavel: evento.medicoResponsavel,
      createdBy: evento.createdBy,
      paciente: evento.paciente
    });
  }
  
  // Descrição
  const descricaoElement = document.getElementById('descricao');
  if (descricaoElement) {
    descricaoElement.textContent = evento.descricao || 'Descrição não disponível.';
    console.log('Descrição definida:', evento.descricao);
  }
  
  // Sintomas
  const sintomasElement = document.getElementById('sintomas');
  if (sintomasElement) {
    sintomasElement.textContent = evento.sintomas || 'Sintomas não informados.';
    console.log('Sintomas definidos:', evento.sintomas);
  }
  
  // Observações
  const observacoesElement = document.getElementById('observacoes');
  if (observacoesElement) {
    observacoesElement.textContent = evento.observacoes || 'Nenhuma observação adicional registrada.';
    console.log('Observações definidas:', evento.observacoes);
  }
  
  console.log('Dados do evento preenchidos com sucesso');
}

// Função para formatar data e hora
function formatarDataHora(dataHora) {
  if (!dataHora) return 'Data não disponível';
  
  const date = new Date(dataHora);
  const dataFormatada = date.toLocaleDateString('pt-BR');
  const horaFormatada = date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${dataFormatada} às ${horaFormatada}`;
}

// Função para formatar intensidade da dor
function formatarIntensidadeDor(intensidade) {
  if (!intensidade) return 'Não informado';
  
  const value = parseInt(intensidade);
  if (isNaN(value)) return intensidade;
  
  if (value === 0) return 'Sem dor (0/10)';
  if (value >= 1 && value <= 3) return `Dor leve (${value}/10)`;
  if (value >= 4 && value <= 6) return `Dor moderada (${value}/10)`;
  if (value >= 7 && value <= 9) return `Dor intensa (${value}/10)`;
  if (value === 10) return 'Dor insuportável (10/10)';
  
  return `${value}/10`;
}

// Função para determinar a classe do tipo de evento
function getEventTypeClass(tipo) {
  switch (tipo) {
    case 'Crise / Emergência':
      return 'emergency';
    case 'Acompanhamento de Condição Crônica':
      return 'chronic';
    case 'Episódio Psicológico ou Emocional':
      return 'psychological';
    case 'Evento Relacionado à Medicação':
      return 'medication';
    default:
      return 'default';
  }
}

// Função para inicializar eventos
function inicializarEventos() {
  // Botão voltar
  const btnVoltar = document.getElementById('btnVoltar');
  if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
      // Tentar voltar para a página anterior, se não houver histórico, ir para histórico de eventos
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/client/views/historicoEventoClinico.html';
      }
    });
  }

  // Botão salvar PDF
  const btnSalvarPDF = document.getElementById('btnSalvarPDF');
  if (btnSalvarPDF) {
    btnSalvarPDF.addEventListener('click', gerarPDF);
  }

  // Botão imprimir
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', imprimirEvento);
  }
}

// Função para gerar PDF
function gerarPDF() {
  if (typeof html2pdf === 'undefined') {
    mostrarAviso('Biblioteca de PDF não carregada. Por favor, recarregue a página e tente novamente.', 'error');
    return;
  }

        Swal.fire({
            title: 'Gerando PDF...',
    text: 'Por favor, aguarde enquanto o PDF é gerado.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

  try {
    const element = document.querySelector('.event-card');
    if (!element) {
      throw new Error('Elemento do evento não encontrado');
    }

        const opt = {
            margin: 1,
      filename: `evento-clinico-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

    html2pdf().set(opt).from(element).save().then(() => {
        Swal.fire({
        title: 'Sucesso!',
        text: 'PDF gerado e baixado com sucesso.',
            icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6'
      });
    }).catch((error) => {
      console.error('Erro ao gerar PDF:', error);
      Swal.fire({
        title: 'Erro!',
        text: 'Erro ao gerar PDF. Tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6'
      });
        });

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        Swal.fire({
      title: 'Erro!',
      text: 'Erro ao gerar PDF. Tente novamente.',
            icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3b82f6'
        });
    }
}

// Função para imprimir evento
function imprimirEvento() {
    Swal.fire({
    title: 'Imprimindo...',
    text: 'Preparando para impressão.',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

  try {
    const element = document.querySelector('.event-card');
    if (!element) {
      throw new Error('Elemento do evento não encontrado');
    }

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    const printContent = element.cloneNode(true);

    // Adicionar estilos para impressão
    const printStyles = `
      <style>
        @media print {
                body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 20px;
                    background: white;
            color: black;
          }
          .event-card {
                    background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            box-shadow: none;
          }
          .card-header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .event-type {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 8px;
                    font-weight: 600;
            color: #1e293b;
          }
          .event-date {
            color: #64748b;
            font-size: 14px;
          }
          .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
                }
          .info-item {
                    display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .info-icon {
            color: #3b82f6;
          }
          .info-content strong {
                    display: block;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
          }
          .info-content span {
            color: #64748b;
          }
          .detail-section {
            margin-bottom: 20px;
          }
          .detail-section h3 {
            font-size: 16px;
                    font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
          }
          .detail-content {
            color: #475569;
            line-height: 1.6;
          }
          .detail-content p {
            margin: 0;
          }
        }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Evento Clínico - Impressão</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          ${printStyles}
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Aguardar o conteúdo carregar e imprimir
            setTimeout(() => {
      printWindow.print();
      printWindow.close();
                    Swal.close();
            }, 500);

  } catch (error) {
    console.error('Erro ao imprimir:', error);
    Swal.fire({
      title: 'Erro!',
      text: 'Erro ao imprimir. Tente novamente.',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3b82f6'
    });
  }
}