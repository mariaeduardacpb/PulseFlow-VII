import { API_URL } from './config.js';

let ciclos = [];
let registrosMenstruacao = [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar carregamento dos componentes
    setTimeout(async () => {
        await carregarDadosMedico();
        await inicializarPagina();
    }, 500);
});

function mostrarAviso(mensagem, tipo = 'info') {
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

    const config = {
        info: { icon: 'info', iconColor: '#3b82f6' },
        success: { icon: 'success', iconColor: '#10b981' },
        error: { icon: 'error', iconColor: '#ef4444' },
        warning: { icon: 'warning', iconColor: '#f59e0b' }
    };

    Toast.fire({
        title: mensagem,
        ...config[tipo]
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
        mostrarAviso("Erro ao carregar dados do médico. Por favor, faça login novamente.", 'error');
        return false;
    }
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function calcularEstatisticas(registros, ciclos) {
    if (!registros || registros.length === 0) {
        return {
            totalRecords: 0,
            avgCycleLength: 0,
            avgDuration: 0,
            lastMenstruationDays: 0
        };
    }

    const totalRecords = registros.length;
    
    // Calcular duração média
    const totalDuration = registros.reduce((sum, registro) => {
        const inicio = new Date(registro.dataInicio);
        const fim = new Date(registro.dataFim);
        const durationMs = fim.getTime() - inicio.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
        return sum + durationDays;
    }, 0);
    const avgDuration = Math.round(totalDuration / registros.length);

    // Calcular ciclo médio
    let avgCycleLength = 0;
    if (registros.length > 1) {
        const sortedRegistros = [...registros].sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
        const cycleLengths = [];
        
        for (let i = 1; i < sortedRegistros.length; i++) {
            const prevStart = new Date(sortedRegistros[i - 1].dataInicio);
            const currStart = new Date(sortedRegistros[i].dataInicio);
            const cycleLength = Math.ceil((currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
            cycleLengths.push(cycleLength);
        }
        
        if (cycleLengths.length > 0) {
            avgCycleLength = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
        }
    }

    // Calcular dias desde última menstruação
    const sortedRegistros = [...registros].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
    const ultimoRegistro = sortedRegistros[0];
    const ultimaData = new Date(ultimoRegistro.dataInicio);
    const hoje = new Date();
    const diasDesdeUltima = Math.ceil((hoje.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24));

    return {
        totalRecords,
        avgCycleLength,
        avgDuration,
        lastMenstruationDays: Math.max(0, diasDesdeUltima)
    };
}

function atualizarEstatisticas(registros, ciclos) {
    const stats = calcularEstatisticas(registros, ciclos);
    
    const totalRecordsEl = document.getElementById('totalRecords');
    const avgCycleLengthEl = document.getElementById('avgCycleLength');
    const avgDurationEl = document.getElementById('avgDuration');
    const lastMenstruationDaysEl = document.getElementById('lastMenstruationDays');

    if (totalRecordsEl) totalRecordsEl.textContent = stats.totalRecords;
    if (avgCycleLengthEl) avgCycleLengthEl.textContent = `${stats.avgCycleLength} dias`;
    if (avgDurationEl) avgDurationEl.textContent = `${stats.avgDuration} dias`;
    if (lastMenstruationDaysEl) lastMenstruationDaysEl.textContent = `${stats.lastMenstruationDays} dias`;
}

async function buscarDadosMenstruacao(cpf) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');

        console.log('Buscando dados para CPF:', cpf);
        console.log('API URL:', API_URL);

        // Buscar ciclos e registros em paralelo
        const [resCiclos, resMenstruacao] = await Promise.all([
            fetch(`${API_URL}/api/ciclo/medico?cpf=${cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${API_URL}/api/menstruacao/${cpf}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        console.log('Status da resposta ciclos:', resCiclos.status);
        console.log('Status da resposta menstruação:', resMenstruacao.status);

        let ciclosResponse = [];
        let registrosResponse = [];

        // Processar resposta de ciclos
        if (resCiclos.ok) {
            ciclosResponse = await resCiclos.json();
            console.log('Ciclos carregados com sucesso:', ciclosResponse);
        } else {
            const errorText = await resCiclos.text();
            console.warn('Erro ao carregar ciclos:', resCiclos.status, errorText);
            // Não falhar completamente, apenas logar o erro
        }

        // Processar resposta de menstruação
        if (resMenstruacao.ok) {
            registrosResponse = await resMenstruacao.json();
            console.log('Registros de menstruação carregados com sucesso:', registrosResponse);
        } else {
            const errorText = await resMenstruacao.text();
            console.warn('Erro ao carregar registros de menstruação:', resMenstruacao.status, errorText);
            // Se for 404, significa que não há registros para este paciente
            if (resMenstruacao.status === 404) {
                console.log('Paciente não possui registros de menstruação ainda');
                registrosResponse = [];
            }
        }

        return {
            ciclos: Array.isArray(ciclosResponse) ? ciclosResponse : [],
            registros: Array.isArray(registrosResponse) ? registrosResponse : []
        };

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        mostrarAviso(`Erro ao carregar dados: ${error.message}`, 'error');
        return { ciclos: [], registros: [] };
    }
}

function renderizarCalendario(date, ciclos, registros) {
    const monthYear = document.getElementById('monthYear');
    const calendarBody = document.getElementById('calendarBody');

    if (!monthYear || !calendarBody) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    calendarBody.innerHTML = '';

    // Criar dias vazios para o início do mês
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarBody.appendChild(emptyDay);
    }

    // Criar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);

        let isMenstrual = false;
        let isCycle = false;
        let isToday = currentDate.getTime() === today.setHours(0, 0, 0, 0);

        // Verificar se é dia de menstruação
        for (const registro of registros) {
            const periodStart = new Date(registro.dataInicio);
            const periodEnd = new Date(registro.dataFim);
            const dayAfterPeriodEnd = new Date(periodEnd);
            dayAfterPeriodEnd.setUTCDate(periodEnd.getUTCDate() + 1);

            if (currentDate >= periodStart && currentDate < dayAfterPeriodEnd) {
                isMenstrual = true;
                break;
            }
        }

        // Verificar se é período do ciclo
        if (!isMenstrual) {
            for (const ciclo of ciclos) {
                const periodStart = new Date(ciclo.dataInicio);
                const periodEnd = new Date(ciclo.dataFim);
                const dayAfterPeriodEnd = new Date(periodEnd);
                dayAfterPeriodEnd.setUTCDate(periodEnd.getUTCDate() + 1);

                if (currentDate >= periodStart && currentDate < dayAfterPeriodEnd) {
                    isCycle = true;
                    break;
                }
            }
        }

        // Aplicar classes CSS
        if (isMenstrual) {
            dayElement.className = 'calendar-day menstrual';
        } else if (isCycle) {
            dayElement.className = 'calendar-day cycle';
        } else if (isToday) {
            dayElement.className = 'calendar-day today';
        } else {
            dayElement.className = 'calendar-day';
        }

        dayElement.innerHTML = `
            <span class="day-number">${day}</span>
            ${isMenstrual || isCycle ? '<div class="day-indicator"></div>' : ''}
        `;

        calendarBody.appendChild(dayElement);
    }
}

function renderizarRegistros(registros) {
    const recordsGrid = document.getElementById('recordsGrid');
    const noRecords = document.getElementById('noRecords');
    const recordsCount = document.getElementById('recordsCount');

    if (!recordsGrid || !noRecords) return;

    // Atualizar contador
    if (recordsCount) recordsCount.textContent = registros.length;

    // Limpar grid
    recordsGrid.innerHTML = '';

    if (registros.length === 0) {
        noRecords.style.display = 'block';
        return;
    }

    noRecords.style.display = 'none';

    // Ordenar registros por data (mais recente primeiro)
    const sortedRegistros = [...registros].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));

    sortedRegistros.forEach(registro => {
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';

        const dataInicio = formatarData(registro.dataInicio);
        const dataFim = formatarData(registro.dataFim);
        const periodo = `${dataInicio} - ${dataFim}`;
        const fluxo = registro.fluxo || 'Não informado';
        const humor = registro.humor || 'Não informado';
        const colica = registro.teveColica ? 'Sim' : 'Não';
        const intensidade = registro.teveColica && registro.intensidadeColica ? `${registro.intensidadeColica}/10` : '-';

        recordCard.innerHTML = `
            <div class="record-header">
                <div>
                    <div class="record-title">Menstruação</div>
                    <div class="record-date">${dataInicio}</div>
                </div>
                <div class="record-badge">MENSTRUAÇÃO</div>
            </div>

            <div class="record-info">
                <div class="record-info-item">
                    <div class="record-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="record-info-label">Período:</div>
                    <div class="record-info-value">${periodo}</div>
                </div>

                <div class="record-info-item">
                    <div class="record-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 9a2 2 0 0 0-2-2V3a2 2 0 0 0-2 2v2a2 2 0 0 0-2 2"/>
                        </svg>
                    </div>
                    <div class="record-info-label">Fluxo:</div>
                    <div class="record-info-value">${fluxo}</div>
                </div>

                <div class="record-info-item">
                    <div class="record-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20v-6"/>
                        </svg>
                    </div>
                    <div class="record-info-label">Cólica:</div>
                    <div class="record-info-value">${colica}${registro.teveColica ? ` — Intensidade ${intensidade}` : ''}</div>
                </div>

                <div class="record-info-item">
                    <div class="record-info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    </div>
                    <div class="record-info-label">Humor:</div>
                    <div class="record-info-value">${humor}</div>
                </div>
            </div>

            ${registro.observacoes ? `
                <div class="record-description">${registro.observacoes}</div>
            ` : ''}
        `;

        recordsGrid.appendChild(recordCard);
    });
}

function configurarEventListeners() {
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            renderizarCalendario(currentDate, ciclos, registrosMenstruacao);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            renderizarCalendario(currentDate, ciclos, registrosMenstruacao);
        });
    }
}

async function inicializarPagina() {
    try {
        console.log('Iniciando página de ciclo menstrual...');
        
        const pacienteData = localStorage.getItem("pacienteSelecionado");
        console.log('Dados do paciente no localStorage:', pacienteData);

        if (!pacienteData) {
            mostrarAviso('Nenhum paciente selecionado', 'error');
            return;
        }

        const paciente = JSON.parse(pacienteData);
        const cpf = paciente?.cpf;
        
        console.log('Paciente selecionado:', paciente);
        console.log('CPF:', cpf);

        if (!cpf) {
            mostrarAviso('CPF do paciente não encontrado', 'error');
            return;
        }

        // Configurar event listeners
        configurarEventListeners();

        // Mostrar loading
        mostrarAviso('Carregando dados do ciclo menstrual...', 'info');

        // Buscar dados
        const dados = await buscarDadosMenstruacao(cpf);
        ciclos = dados.ciclos;
        registrosMenstruacao = dados.registros;

        console.log('Dados carregados - Ciclos:', ciclos.length, 'Registros:', registrosMenstruacao.length);

        // Renderizar componentes
        renderizarCalendario(currentDate, ciclos, registrosMenstruacao);
        renderizarRegistros(registrosMenstruacao);
        atualizarEstatisticas(registrosMenstruacao, ciclos);

        if (ciclos.length === 0 && registrosMenstruacao.length === 0) {
            mostrarAviso('Este paciente ainda não possui registros de ciclo menstrual. Os dados aparecerão aqui quando forem adicionados.', 'info');
        } else {
            const totalDados = ciclos.length + registrosMenstruacao.length;
            mostrarAviso(`${totalDados} registro(s) de ciclo menstrual carregado(s) com sucesso!`, 'success');
        }

        console.log('Página de ciclo menstrual inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarAviso(`Erro ao carregar dados do ciclo menstrual: ${error.message}`, 'error');
    }
}

// Funções globais para debug
window.debugCicloMenstrual = function() {
    console.log('=== DEBUG CICLO MENSTRUAL ===');
    console.log('Ciclos:', ciclos);
    console.log('Registros:', registrosMenstruacao);
    console.log('Data atual:', currentDate);
    console.log('Token:', localStorage.getItem('token'));
    console.log('Paciente:', localStorage.getItem('pacienteSelecionado'));
    console.log('API URL:', API_URL);
};

window.forcarCarregamentoDados = async function() {
    console.log('Forçando carregamento de dados...');
    await inicializarPagina();
};

window.testarAPI = async function() {
    try {
        console.log('=== TESTE DE CONECTIVIDADE API ===');
        const token = localStorage.getItem('token');
        const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
        
        if (!token) {
            console.error('Token não encontrado');
            return;
        }
        
        if (!paciente?.cpf) {
            console.error('Paciente não encontrado');
            return;
        }
        
        console.log('Testando endpoint de ciclos...');
        const resCiclos = await fetch(`${API_URL}/api/ciclo/medico?cpf=${paciente.cpf}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Status ciclos:', resCiclos.status);
        console.log('Headers ciclos:', resCiclos.headers);
        
        if (resCiclos.ok) {
            const dados = await resCiclos.json();
            console.log('Dados de ciclos:', dados);
        } else {
            const errorText = await resCiclos.text();
            console.error('Erro ciclos:', errorText);
        }
        
        console.log('Testando endpoint de menstruação...');
        const resMenstruacao = await fetch(`${API_URL}/api/menstruacao/${paciente.cpf}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Status menstruação:', resMenstruacao.status);
        console.log('Headers menstruação:', resMenstruacao.headers);
        
        if (resMenstruacao.ok) {
            const dados = await resMenstruacao.json();
            console.log('Dados de menstruação:', dados);
        } else {
            const errorText = await resMenstruacao.text();
            console.error('Erro menstruação:', errorText);
        }
        
    } catch (error) {
        console.error('Erro no teste da API:', error);
    }
};