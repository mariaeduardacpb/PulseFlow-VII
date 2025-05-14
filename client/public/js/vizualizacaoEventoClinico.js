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
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
        if (intensity === 'na') return 'Não se aplica';
        if (intensity === '0') return 'Sem dor';
        if (intensity === '1-3') return 'Leve';
        if (intensity === '4-6') return 'Moderada';
        if (intensity === '7-9') return 'Intensa';
        if (intensity === '10') return 'Insuportável';
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
        const idade = calcularIdade(evento.paciente.dataNascimento);
        document.getElementById('nomePaciente').textContent = `${evento.paciente.nome}, ${idade} anos`;
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
            `<span class="intensity ${intensityClass}">${intensityText}</span>` : 
            intensityText;
        
        document.getElementById('alivio').textContent = evento.alivio;
        document.getElementById('descricao').textContent = evento.descricao || 'Não especificada';
        document.getElementById('sintomas').textContent = evento.sintomas || 'Não especificados';

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes do evento: ' + error.message);
    }
}); 