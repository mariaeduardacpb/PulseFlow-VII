import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log('Página de contagem de passos carregada, iniciando...');
    
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

async function buscarDadosPassos(mes, ano) {
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

        console.log(`Buscando dados de passos para CPF: ${cpf}, Mês: ${mes}, Ano: ${ano}`);

        const response = await fetch(`${API_URL}/api/passos/medico?cpf=${cpf}&month=${mes}&year=${ano}`, {
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
                console.log('Nenhum dado de passos encontrado para este período');
                return { data: [], stats: { total: 0, media: 0, meta: 0, acima: 0 } };
            }
            
            if (response.status === 403) {
                mostrarErro(errorData.message || "Acesso negado. Você não tem uma conexão ativa com este paciente.");
                return null;
            }
            
            mostrarErro(errorData.message || "Erro ao buscar dados de passos!");
            return null;
        }

        const data = await response.json();
        console.log('Dados de passos recebidos:', data);
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados de passos:', error);
        mostrarErro("Erro interno ao buscar dados de passos.");
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

function classificarPassos(passos) {
    if (passos < 5000) {
        return "Sedentário";
    } else if (passos >= 5000 && passos < 7500) {
        return "Pouco ativo";
    } else if (passos >= 7500 && passos < 10000) {
        return "Moderadamente ativo";
    } else if (passos >= 10000 && passos < 12500) {
        return "Ativo";
    } else {
        return "Muito ativo";
    }
}

function calcularEstatisticas(dados) {
    if (!dados || !dados.data || dados.data.length === 0) {
        return {
            totalRegistros: 0,
            mediaPassos: 0,
            diasNaMeta: 0,
            acimaDaMeta: 0
        };
    }

    const registros = dados.data;
    const totalRegistros = registros.length;
    
    const somaPassos = registros.reduce((acc, d) => acc + (d.passos || 0), 0);
    const mediaPassos = totalRegistros > 0 ? Math.round(somaPassos / totalRegistros) : 0;
    
    const diasNaMeta = registros.filter(d => {
        const p = d.passos || 0;
        return p >= 10000; // Meta de 10.000 passos
    }).length;
    
    const acimaDaMeta = registros.filter(d => {
        const p = d.passos || 0;
        return p > 10000; // Acima da meta
    }).length;

    return {
        totalRegistros,
        mediaPassos,
        diasNaMeta,
        acimaDaMeta
    };
}

function atualizarEstatisticas(dados) {
    const stats = dados.stats || calcularEstatisticas(dados);
    
    const totalElement = document.getElementById('totalReadingsCount');
    const mediaElement = document.getElementById('avgSteps');
    const metaElement = document.getElementById('metaCount');
    const acimaElement = document.getElementById('acimaMetaCount');

    if (totalElement) totalElement.textContent = stats.total || stats.totalRegistros || 0;
    if (mediaElement) mediaElement.textContent = stats.media ? `${stats.media.toLocaleString('pt-BR')}` : (stats.mediaPassos ? `${stats.mediaPassos.toLocaleString('pt-BR')}` : '0');
    if (metaElement) metaElement.textContent = stats.meta || stats.diasNaMeta || 0;
    if (acimaElement) acimaElement.textContent = stats.acima || stats.acimaDaMeta || 0;
}

async function carregarDadosGrafico() {
    const dados = await buscarDadosPassos(mesAtual, anoAtual);
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
    const mensagemSemDados = document.getElementById('no-data-msg-passos');
    
    if (!dados || !dados.data || dados.data.length === 0) {
        // Esconder apenas o container do gráfico quando não houver dados
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
        if (mensagemSemDados) {
            mensagemSemDados.style.display = 'flex';
        }
        // Limpar dados do gráfico
        graficoPassos.data.labels = [];
        graficoPassos.data.datasets[0].data = [];
        graficoPassos.update();
        return;
    }

    // Mostrar o container do gráfico quando houver dados
    if (chartContainer) {
        chartContainer.style.display = 'flex';
    }
    if (mensagemSemDados) {
        mensagemSemDados.style.display = 'none';
    }

    // Extrair dias e valores de passos (igual ao de insônia)
    const dias = dados.data.map(d => d.dia);
    const valoresPassos = dados.data.map(d => ({
        x: d.dia,
        y: d.passos
    }));

    // Atualizar dados do gráfico
    graficoPassos.data.labels = dias;
    graficoPassos.data.datasets[0].data = valoresPassos;

    // Atualizar o gráfico
    graficoPassos.update();
}

// Configurar o gráfico de passos (igual ao de insônia)
const ctxPassos = document.getElementById('chartPassos');
const graficoPassos = new Chart(ctxPassos, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Contagem de Passos",
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
                        const classificacao = classificarPassos(valor);
                        return [
                            `Passos: ${valor.toLocaleString('pt-BR')}`,
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
                min: 0,
                max: 20000,
                title: { display: true, text: 'Passos' },
                ticks: { 
                    stepSize: 2000,
                    callback: function(value) {
                        return `${value.toLocaleString('pt-BR')}`;
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
        
        console.log('Página de contagem de passos inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarErro('Erro ao inicializar a página');
    }
}

