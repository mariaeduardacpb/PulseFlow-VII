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