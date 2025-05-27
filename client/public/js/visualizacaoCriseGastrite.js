document.addEventListener('DOMContentLoaded', async () => {
    // Função para formatar a data
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Função para determinar a classe de intensidade
    function getIntensityClass(intensity) {
        if (intensity <= 3) return 'low';
        if (intensity <= 6) return 'medium';
        return 'high';
    }

    // Função para determinar o texto de intensidade
    function getIntensityText(intensity) {
        if (intensity === 0) return 'Sem dor';
        if (intensity <= 3) return 'Leve';
        if (intensity <= 6) return 'Moderada';
        return 'Intensa';
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

        const response = await fetch(`http://localhost:5000/api/gastrite/crises/detalhes/${criseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
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
        alert('Erro ao carregar detalhes da crise: ' + error.message);
    }
});

// Função para carregar os dados da crise
async function carregarDadosCrise() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (!id) {
            console.error('ID da crise não fornecido');
            return;
        }

        const response = await fetch(`/api/crise-gastrite/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da crise');
        }

        const crise = await response.json();
        
        // Preencher os dados na página
        document.getElementById('dataCrise').textContent = new Date(crise.data).toLocaleDateString('pt-BR');
        document.getElementById('intensidadeDor').textContent = crise.intensidade;
        document.getElementById('alivioMedicacao').textContent = crise.alivioMedicacao ? 'Sim' : 'Não';
        document.getElementById('sintomas').textContent = crise.sintomas || 'Não informado';
        document.getElementById('alimentos').textContent = crise.alimentos || 'Não informado';
        document.getElementById('medicacao').textContent = crise.medicacao || 'Não informado';
        document.getElementById('observacoes').textContent = crise.observacoes || 'Não informado';
        document.getElementById('statusCrise').textContent = crise.status || 'Crise Registrada';

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados da crise');
    }
}

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
    
    // Carregar os dados da crise quando a página carregar
    carregarDadosCrise();
});

// Função para controlar o toggle da sidebar em mobile
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('active');
}); 