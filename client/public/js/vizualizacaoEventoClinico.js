document.addEventListener('DOMContentLoaded', async () => {
    // Carrega dados do médico logado primeiro
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
        
        const tituloSidebar = document.getElementById('medicoNomeSidebar');
        if (tituloSidebar) {
            tituloSidebar.textContent = nomeFormatado;
        }
    } catch (error) {
        console.error("Erro ao carregar dados do médico:", error);
        const fallback = document.getElementById('medicoNomeSidebar');
        if (fallback) {
            fallback.textContent = 'Dr(a). Nome não encontrado';
        }
        alert("Erro ao carregar dados do médico. Por favor, faça login novamente.");
    }

    // Função para calcular idade
    function calcularIdade(dataNascimento) {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = nascimento.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade;
    }

    // Função para formatar a data
    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
    }

    // Função para determinar a classe de intensidade
    function getIntensityClass(intensity) {
        if (intensity === 'na') return '';
        const value = parseInt(intensity.split('-')[0]);
        if (value <= 3) return 'low';
        if (value <= 6) return 'medium';
        return 'high';
    }

    // Função para determinar o texto de intensidade
    function getIntensityText(intensity) {
        const value = parseInt(intensity);
        if (isNaN(value)) return intensity;
        if (value === 0) return 'Sem dor';
        if (value >= 1 && value <= 3) return 'Dor leve';
        if (value >= 4 && value <= 6) return 'Dor Moderada';
        if (value >= 7 && value <= 9) return 'Dor Intensa';
        if (value === 10) return 'Dor insuportável';
        return intensity;
    }

    // Função para determinar a classe do tipo de evento
    function getEventTypeClass(tipo) {
        switch (tipo) {
            case 'Crise / Emergência':
                return 'crise';
            case 'Acompanhamento de Condição Crônica':
                return 'acompanhamento';
            case 'Episódio Psicológico ou Emocional':
                return 'psicologico';
            case 'Evento Relacionado à Medicação':
                return 'medicacao';
            default:
                return '';
        }
    }

    // Check if html2pdf library is loaded - Moved check outside try/catch
    if (typeof html2pdf === 'undefined') {
        console.error('html2pdf library not loaded.');
        alert('Erro: Biblioteca de PDF não carregada. A função Salvar PDF não está disponível.');
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');

        if (!eventoId) {
            console.error('ID do evento não fornecido');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        const response = await fetch(`http://localhost:65432/api/eventos-clinicos/${eventoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar detalhes do evento');
        }

        const evento = await response.json();
        console.log('Dados do evento:', evento); // Para debug

        // Preencher os dados do evento
        // Removed paciente info from header as per HTML update
        // const idade = calcularIdade(evento.paciente.dataNascimento);
        // document.getElementById('nomePaciente').textContent = `${evento.paciente.nome}, ${idade} anos`;
        document.getElementById('tituloEvento').textContent = evento.titulo;
        
        const tipoEvento = document.getElementById('tipoEvento');
        tipoEvento.textContent = evento.tipoEvento;
        tipoEvento.className = `status-badge ${getEventTypeClass(evento.tipoEvento)}`;
        
        document.getElementById('dataHora').textContent = formatDate(evento.dataHora);
        
        document.getElementById('especialidade').textContent = evento.especialidade;
        
        const intensidadeDor = document.getElementById('intensidadeDor');
        const intensityClass = getIntensityClass(evento.intensidadeDor);
        const intensityText = getIntensityText(evento.intensidadeDor);
        intensidadeDor.innerHTML = intensityClass ? 
            `<span class="intensity ${intensityClass}">${intensityText} (${evento.intensidadeDor}/10)</span>` : 
            intensityText;
        
        document.getElementById('alivio').textContent = evento.alivio || 'Não especificado';
        document.getElementById('descricao').textContent = evento.descricao || 'Não especificada';
        document.getElementById('sintomas').textContent = evento.sintomas || 'Não especificados';

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes do evento: ' + error.message);
    }

    // Add click event to the Save PDF button
    const btnSalvarPDF = document.querySelector('.card-footer .btn-secondary');
    if (btnSalvarPDF) {
        console.log('Save PDF button found, adding event listener.');
        btnSalvarPDF.addEventListener('click', gerarPDF);
    } else {
        console.error('Save PDF button not found in the DOM');
    }

    // Add sidebar toggle functionality for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
});

// Function to generate and save PDF - Moved to global scope
function gerarPDF() {
    console.log('gerarPDF function called.');

    // Verificar se a biblioteca html2pdf está carregada
    if (typeof html2pdf === 'undefined') {
        console.error('html2pdf is not defined inside gerarPDF.');
        alert('Erro: Biblioteca de PDF não carregada. Por favor, recarregue a página e tente novamente.');
        return;
    }

    try {
        const element = document.querySelector('.note-card');
        if (!element) {
            throw new Error('Elemento .note-card não encontrado');
        }

        const logo = document.querySelector('.logo img');
        const clone = element.cloneNode(true);
        const container = document.createElement('div');
        container.style.padding = '20px';

        if (logo) {
            const logoContainer = document.createElement('div');
            logoContainer.style.textAlign = 'center';
            logoContainer.style.marginBottom = '20px';
            const logoClone = logo.cloneNode(true);
            logoClone.style.height = '60px';
            logoContainer.appendChild(logoClone);
            container.appendChild(logoContainer);
        }

        const title = document.createElement('h1');
        title.textContent = 'Detalhes do Evento Clínico';
        title.style.textAlign = 'center';
        title.style.color = '#002A42';
        title.style.marginBottom = '20px';
        title.style.fontSize = '24px';

        container.appendChild(title);
        container.appendChild(clone);

        const opt = {
            margin: 1,
            filename: 'evento-clinico.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: true
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        const cardFooter = clone.querySelector('.card-footer');
        if (cardFooter) {
            cardFooter.style.display = 'none';
        }

        html2pdf().set(opt).from(container).save()
            .then(() => {
                console.log('PDF gerado com sucesso');
                container.remove();
            })
            .catch(error => {
                console.error('Erro ao gerar PDF:', error);
                alert('Erro ao gerar o PDF. Por favor, tente novamente.');
                container.remove();
            });
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar o PDF: ' + error.message);
    }
}

// Adicionar event listeners para os botões
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
            filename: 'evento-clinico.pdf',
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
                .print-details-grid {
                    display: grid;
                    gap: 0.6cm;
                }
                .print-detail-section {
                    background: #f8f9fa;
                    padding: 0.4cm;
                    border-radius: 0.15cm;
                }
                .print-detail-section h3 {
                    color: #002A42;
                    font-size: 0.35cm;
                    margin: 0 0 0.2cm 0;
                    font-weight: 600;
                }
                .print-detail-content {
                    color: #333;
                    font-size: 0.3cm;
                    line-height: 1.5;
                }
                .print-intensity {
                    display: inline-block;
                    padding: 0.08cm 0.2cm;
                    border-radius: 0.1cm;
                    font-weight: 500;
                    font-size: 0.3cm;
                }
                .print-intensity.low { background: #e3f2fd; color: #1976d2; }
                .print-intensity.medium { background: #fff3e0; color: #f57c00; }
                .print-intensity.high { background: #fce4ec; color: #c2185b; }
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
            title.textContent = 'Detalhes do Evento Clínico';
            
            header.appendChild(logo);
            header.appendChild(title);
            printContent.appendChild(header);

            // Clonar e formatar o conteúdo do evento
            const eventContent = document.querySelector('.note-card').cloneNode(true);
            eventContent.className = 'print-card';
            
            // Remover os botões do footer
            const footer = eventContent.querySelector('.card-footer');
            if (footer) {
                footer.remove();
            }

            // Aplicar classes de impressão
            const cardHeader = eventContent.querySelector('.card-header');
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
            const infoGrid = eventContent.querySelector('.info-grid');
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

            // Formatar grid de detalhes
            const detailsGrid = eventContent.querySelector('.details-grid');
            if (detailsGrid) {
                detailsGrid.className = 'print-details-grid';
                detailsGrid.querySelectorAll('.detail-section').forEach(section => {
                    section.className = 'print-detail-section';
                    const content = section.querySelector('.detail-content');
                    if (content) content.className = 'print-detail-content';
                });
            }

            // Formatar intensidade
            eventContent.querySelectorAll('.intensity').forEach(intensity => {
                intensity.className = `print-intensity ${intensity.className.split(' ')[1]}`;
            });

            printContent.appendChild(eventContent);

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