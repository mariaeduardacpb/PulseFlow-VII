import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log('Página de batimentos cardíacos carregada, iniciando...');
    
    const validation = validateActivePatient();
    if (!validation.valid) {
        redirectToPatientSelection(validation.error);
        return;
    }
    
    // Aguardar carregamento dos componentes
    setTimeout(async () => {
        await carregarDadosMedico();
        await inicializarPagina();
    }, 500);
});

const API_URL = window.API_URL || 'http://localhost:65432';

function mostrarErro(mensagem) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        title: mensagem,
        icon: 'error',
        iconColor: '#ef4444'
    });
}

async function carregarDadosMedico() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado. Por favor, faça login novamente.');
        }

        const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
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
        console.log('Dados do médico carregados:', medico);
        
        return true;
    } catch (error) {
        console.error("Erro ao carregar dados do médico:", error);
        mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
        return false;
    }
}

async function buscarDadosBatimentos(mes, ano) {
    try {
        const tokenMedico = localStorage.getItem('token');
        
        let selectedPatient = localStorage.getItem('selectedPatient') || 
                             localStorage.getItem('pacienteSelecionado') || 
                             localStorage.getItem('selectedPatientData');
        
        if (!tokenMedico) {
            mostrarErro("Sessão expirada. Faça login novamente!");
            return null;
        }

        if (!selectedPatient) {
            console.log('Chaves disponíveis no localStorage:', Object.keys(localStorage));
            mostrarErro("Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.");
            return null;
        }

        let paciente;
        try {
            paciente = JSON.parse(selectedPatient);
        } catch (parseError) {
            console.error('Erro ao fazer parse do paciente:', parseError);
            mostrarErro("Erro ao processar dados do paciente selecionado.");
            return null;
        }

        const cpf = paciente.cpf?.replace(/[^\d]/g, '');

        if (!cpf) {
            console.log('Dados do paciente:', paciente);
            mostrarErro("CPF não encontrado no paciente selecionado.");
            return null;
        }

        console.log(`Buscando dados de batimentos cardíacos para CPF: ${cpf}, Mês: ${mes}, Ano: ${ano}`);

        const response = await fetch(`${API_URL}/api/batimentosCardiacos/medico?cpf=${cpf}&month=${mes}&year=${ano}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${tokenMedico}`,
                "Content-Type": "application/json"
            }
        });

        const handled = await handleApiError(response);
        if (handled) {
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro na resposta:', response.status, errorData);
            
            if (response.status === 404) {
                console.log('Nenhum dado de batimentos cardíacos encontrado para este período');
                return { data: [], stats: { total: 0, media: 0, normais: 0, elevados: 0 } };
            }
            
            if (response.status === 403) {
                mostrarErro(errorData.message || "Acesso negado. Você não tem uma conexão ativa com este paciente.");
                return null;
            }
            
            mostrarErro(errorData.message || "Erro ao buscar dados de batimentos cardíacos!");
            return null;
        }

        const data = await response.json();
        console.log('Dados de batimentos cardíacos recebidos:', data);
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados de batimentos cardíacos:', error);
        mostrarErro("Erro interno ao buscar dados de batimentos cardíacos.");
        return null;
    }
}

let mesAtual = new Date().getMonth() + 1;
let anoAtual = new Date().getFullYear();

function atualizarLabelMes() {
    const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const labelMes = document.querySelector('.month-label');
    if (labelMes) {
        labelMes.textContent = `${nomesMeses[mesAtual - 1]} • ${anoAtual}`;
    }
}

function classificarBatimentos(batimentos) {
    if (batimentos < 60) {
        return "Bradicardia";
    } else if (batimentos >= 60 && batimentos <= 100) {
        return "Normal";
    } else if (batimentos > 100 && batimentos <= 120) {
        return "Taquicardia leve";
    } else if (batimentos > 120 && batimentos <= 150) {
        return "Taquicardia moderada";
    } else {
        return "Taquicardia grave";
    }
}

function calcularEstatisticas(dados) {
    if (!dados || !dados.data || dados.data.length === 0) {
        return {
            totalLeituras: 0,
            mediaBatimentos: 0,
            leiturasNormais: 0,
            leiturasElevadas: 0
        };
    }

    const leituras = dados.data;
    const totalLeituras = leituras.length;
    
    const somaBatimentos = leituras.reduce((acc, d) => acc + (d.batimentos || 0), 0);
    const mediaBatimentos = totalLeituras > 0 ? Math.round(somaBatimentos / totalLeituras) : 0;
    
    const leiturasNormais = leituras.filter(d => {
        const bpm = d.batimentos || 0;
        return bpm >= 60 && bpm <= 100;
    }).length;
    
    const leiturasElevadas = leituras.filter(d => {
        const bpm = d.batimentos || 0;
        return bpm > 100;
    }).length;

    return {
        totalLeituras,
        mediaBatimentos,
        leiturasNormais,
        leiturasElevadas
    };
}

function atualizarEstatisticas(dados) {
    const stats = dados.stats || calcularEstatisticas(dados);
    
    const totalElement = document.getElementById('totalReadingsCount');
    const mediaElement = document.getElementById('avgHeartRate');
    const normaisElement = document.getElementById('normalReadingsCount');
    const elevadosElement = document.getElementById('elevatedReadingsCount');

    if (totalElement) totalElement.textContent = stats.total || stats.totalLeituras || 0;
    if (mediaElement) mediaElement.textContent = stats.media ? `${stats.media.toFixed(1)} bpm` : (stats.mediaBatimentos ? `${stats.mediaBatimentos} bpm` : '0 bpm');
    if (normaisElement) normaisElement.textContent = stats.normais || stats.leiturasNormais || 0;
    if (elevadosElement) elevadosElement.textContent = stats.elevados || stats.leiturasElevadas || 0;
}

async function carregarDadosGrafico() {
    const dados = await buscarDadosBatimentos(mesAtual, anoAtual);
    if (!dados) return;

    atualizarEstatisticas(dados);
    atualizarGrafico(dados);
}

function configurarNavegacaoMes() {
    const btnAnterior = document.querySelector('[data-direction="prev"]');
    const btnProximo = document.querySelector('[data-direction="next"]');

    if (btnAnterior) {
        btnAnterior.addEventListener('click', async () => {
            mesAtual--;
            if (mesAtual < 1) {
                mesAtual = 12;
                anoAtual--;
            }
            atualizarLabelMes();
            await carregarDadosGrafico();
        });
    }

    if (btnProximo) {
        btnProximo.addEventListener('click', async () => {
            mesAtual++;
            if (mesAtual > 12) {
                mesAtual = 1;
                anoAtual++;
            }
            atualizarLabelMes();
            await carregarDadosGrafico();
        });
    }
}

function atualizarGrafico(dados) {
    const chartContainer = document.querySelector('.chart-container');
    const mensagemSemDados = document.getElementById('no-data-msg-batimentos');
    
    if (!dados || !dados.data || dados.data.length === 0) {
        // Esconder apenas o container do gráfico quando não houver dados
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
        if (mensagemSemDados) {
            mensagemSemDados.style.display = 'flex';
        }
        // Limpar dados do gráfico
        graficoBatimentos.data.labels = [];
        graficoBatimentos.data.datasets[0].data = [];
        graficoBatimentos.update();
        return;
    }

    // Mostrar o container do gráfico quando houver dados
    if (chartContainer) {
        chartContainer.style.display = 'flex';
    }
    if (mensagemSemDados) {
        mensagemSemDados.style.display = 'none';
    }

    // Extrair dias e valores de batimentos (igual ao de insônia)
    const dias = dados.data.map(d => d.dia);
    const valoresBatimentos = dados.data.map(d => ({
        x: d.dia,
        y: d.batimentos
    }));

    // Atualizar dados do gráfico
    graficoBatimentos.data.labels = dias;
    graficoBatimentos.data.datasets[0].data = valoresBatimentos;

    // Atualizar o gráfico
    graficoBatimentos.update();
}

// Configurar o gráfico de batimentos cardíacos (igual ao de insônia)
const ctxBatimentos = document.getElementById('chartBatimentos');
const graficoBatimentos = new Chart(ctxBatimentos, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Batimentos Cardíacos",
            data: [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            spanGaps: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1200,
            easing: 'easeOutQuart',
            animations: {
                y: {
                    type: 'number',
                    easing: 'easeOutBounce',
                    from: 0
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                displayColors: false,
                callbacks: {
                    title: context => `Dia ${context[0].parsed.x}`,
                    label: () => '',
                    afterBody: context => {
                        const valor = context[0].parsed.y;
                        const classificacao = classificarBatimentos(valor);
                        return [
                            `Batimentos: ${valor} bpm`,
                            `Classificação: ${classificacao}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                title: { display: true, text: 'Dia do Mês' },
                ticks: { precision: 0 }
            },
            y: {
                min: 40,
                max: 200,
                title: { display: true, text: 'Batimentos Cardíacos (bpm)' },
                ticks: { 
                    stepSize: 20,
                    callback: function(value) {
                        return `${value} bpm`;
                    }
                }
            }
        }
    }
});

async function inicializarPagina() {
    try {
        atualizarLabelMes();
        configurarNavegacaoMes();
        await carregarDadosGrafico();
        
        console.log('Página de batimentos cardíacos inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarErro('Erro ao inicializar a página');
    }
}

// Funções globais para debug
window.debugBatimentosCardiacos = function() {
    console.log('=== DEBUG BATIMENTOS CARDÍACOS ===');
    console.log('Mês atual:', mesAtual);
    console.log('Ano atual:', anoAtual);
    console.log('Token médico:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    console.log('Gráfico inicializado:', graficoBatimentos ? 'Sim' : 'Não');
    
    console.log('\n=== LOCALSTORAGE ===');
    console.log('Todas as chaves:', Object.keys(localStorage));
    console.log('selectedPatient:', localStorage.getItem('selectedPatient'));
    console.log('pacienteSelecionado:', localStorage.getItem('pacienteSelecionado'));
    console.log('selectedPatientData:', localStorage.getItem('selectedPatientData'));
    
    const possibleKeys = ['selectedPatient', 'pacienteSelecionado', 'selectedPatientData'];
    for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                console.log(`Dados do paciente (${key}):`, parsed);
                if (parsed.cpf) {
                    console.log(`CPF encontrado: ${parsed.cpf}`);
                }
            } catch (e) {
                console.log(`Erro ao fazer parse de ${key}:`, e);
            }
        }
    }
    
    console.log('\n=== TESTE DE CARREGAMENTO ===');
    carregarDadosGrafico().then(() => {
        console.log('Dados carregados com sucesso');
    }).catch((error) => {
        console.error('Erro ao carregar dados:', error);
    });
};

window.simularPaciente = function() {
    const pacienteTeste = {
        id: "68a3b77a5b36b8a11580651f",
        nome: "Manuela Tagliatti",
        cpf: "512.320.568-39",
        email: "manuellatagliatti@gmail.com",
        genero: "Feminino",
        dataNascimento: "2002-10-19T00:00:00.000",
        nacionalidade: "Brasileiro",
        telefone: "(19) 98443-6637"
    };
    
    localStorage.setItem('selectedPatient', JSON.stringify(pacienteTeste));
    console.log('Paciente simulado salvo:', pacienteTeste);
    
    carregarDadosGrafico().then(() => {
        console.log('Dados recarregados com paciente simulado');
    }).catch((error) => {
        console.error('Erro ao recarregar dados:', error);
    });
};

