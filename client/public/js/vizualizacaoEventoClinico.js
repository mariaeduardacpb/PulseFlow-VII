document.addEventListener('DOMContentLoaded', async () => {
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
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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

        const response = await fetch(`http://localhost:5000/api/eventos-clinicos/${eventoId}`, {
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
    const btnSalvarPDF = document.querySelector('.card-footer .btn-secondary:nth-child(2)');
    if (btnSalvarPDF) {
        console.log('Save PDF button found, adding event listener.');
        btnSalvarPDF.addEventListener('click', gerarPDF);
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

    // Check if html2pdf is defined right before using it
    if (typeof html2pdf === 'undefined') {
        console.error('html2pdf is not defined inside gerarPDF.');
        alert('Erro interno: Biblioteca de PDF não disponível.');
        return;
    }

    const element = document.querySelector('.note-card');
    // Check if element exists before proceeding
    if (!element) {
        console.error('Elemento .note-card não encontrado para gerar PDF.');
        alert('Não foi possível gerar o PDF: Detalhes do evento não encontrados.');
        return;
    }

    const logo = document.querySelector('.logo img');

    // Criar um clone do elemento para manipulação
    const clone = element.cloneNode(true);

    // Criar um container para o PDF
    const container = document.createElement('div');
    container.style.padding = '20px';

    // Adicionar o logo
    if (logo) { // Check if logo exists
        const logoContainer = document.createElement('div');
        logoContainer.style.textAlign = 'center';
        logoContainer.style.marginBottom = '20px';
        const logoClone = logo.cloneNode(true);
        logoClone.style.height = '60px';
        logoContainer.appendChild(logoClone);
        container.appendChild(logoContainer);
    }

    // Adicionar o título
    const title = document.createElement('h1');
    title.textContent = 'Detalhes do Evento Clínico'; // Updated title
    title.style.textAlign = 'center';
    title.style.color = '#002A42';
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';

    container.appendChild(title);
    container.appendChild(clone);

    // Configurações do PDF
    const opt = {
        margin: 1,
        filename: 'evento-clinico.pdf', // Updated filename
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

    // Generate the PDF from the container
    html2pdf().set(opt).from(container).save().then(() => {
        // Clean up the container after generation
        container.remove();
    }).catch(error => {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF.');
        container.remove(); // Ensure container is removed even on error
    });
} 