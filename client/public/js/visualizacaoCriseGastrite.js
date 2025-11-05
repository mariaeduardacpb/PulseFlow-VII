
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
        return ''; // Default or fallback
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
            console.error('ID da crise não fornecido');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
        if (!paciente || !paciente.cpf) {
            throw new Error('Paciente não selecionado');
        }

        console.log('Buscando crise:', {
            cpf: paciente.cpf,
            criseId: criseId,
            url: `http://localhost:65432/api/gastrite/crises/${paciente.cpf}/${criseId}`
        });

        const response = await fetch(`http://localhost:65432/api/gastrite/crises/${paciente.cpf}/${criseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Crise não encontrada');
            }
            throw new Error('Erro ao carregar detalhes da crise');
        }

        const crise = await response.json();
        console.log('Dados da crise:', crise); // Para debug

        // Preencher os dados da crise
        document.getElementById('dataCrise').textContent = formatDate(crise.data);
        
        const intensidadeDor = document.getElementById('intensidadeDor');
        const intensityClass = getIntensityClass(crise.intensidadeDor);
        const intensityText = getIntensityText(crise.intensidadeDor);
        intensidadeDor.innerHTML = `<span class="intensity ${intensityClass}">${intensityText} (${crise.intensidadeDor}/10)</span>`;
        
        document.getElementById('alivioMedicacao').textContent = crise.alivioMedicacao ? 'Sim' : 'Não';
        document.getElementById('sintomas').textContent = crise.sintomas || 'Não especificados';
        document.getElementById('alimentos').textContent = crise.alimentosIngeridos || 'Não especificados';
        document.getElementById('medicacao').textContent = crise.medicacao || 'Não especificada';
        document.getElementById('observacoes').textContent = crise.observacoes || 'Não especificadas';

    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
});

// Função para gerar e salvar o PDF
function gerarPDF() {
    const element = document.querySelector('.note-card');
    const logo = document.querySelector('.logo img');
    
    // Criar um clone do elemento para manipulação
    const clone = element.cloneNode(true);
    
    // Criar um container para o PDF
    const container = document.createElement('div');
    container.style.padding = '20px';
    
    // Adicionar o logo
    const logoContainer = document.createElement('div');
    logoContainer.style.textAlign = 'center';
    logoContainer.style.marginBottom = '20px';
    const logoClone = logo.cloneNode(true);
    logoClone.style.height = '60px';
    logoContainer.appendChild(logoClone);
    
    // Adicionar o título
    const title = document.createElement('h1');
    title.textContent = 'Detalhes da Crise de Gastrite';
    title.style.textAlign = 'center';
    title.style.color = '#002A42';
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';
    
    // Montar o container
    container.appendChild(logoContainer);
    container.appendChild(title);
    container.appendChild(clone);
    
    // Configurações do PDF
    const opt = {
        margin: 1,
        filename: 'crise-gastrite.pdf',
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

    // Remover temporariamente os botões antes de gerar o PDF
    const cardFooter = clone.querySelector('.card-footer');
    if (cardFooter) {
        cardFooter.style.display = 'none';
    }

    // Gerar o PDF
    html2pdf().set(opt).from(container).save().then(() => {
        // Limpar o container após a geração
        container.remove();
    });
}

// Adicionar evento de clique ao botão de salvar PDF
document.addEventListener('DOMContentLoaded', () => {
    const btnSalvarPDF = document.querySelector('.btn-secondary:nth-child(2)');
    if (btnSalvarPDF) {
        btnSalvarPDF.addEventListener('click', gerarPDF);
    }
});

// Função para controlar o toggle da sidebar em mobile
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('active');
});

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
            filename: 'crise-gastrite.pdf',
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
        text: 'Deseja imprimir este registro de crise de gastrite?',
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
                    grid-template-columns: repeat(2, 1fr);
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
                    margin: 0 0 0.3cm 0;
                }
                .print-detail-content {
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
            title.textContent = 'Registro de Crise de Gastrite';
            
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

            // Formatar grid de detalhes
            const detailsGrid = cardContent.querySelector('.details-grid');
            if (detailsGrid) {
                detailsGrid.className = 'print-details-grid';
                detailsGrid.querySelectorAll('.detail-section').forEach(section => {
                    section.className = 'print-detail-section';
                    const title = section.querySelector('h3');
                    const content = section.querySelector('.detail-content');
                    if (title) title.className = 'print-detail-section-title';
                    if (content) content.className = 'print-detail-content';
                });
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