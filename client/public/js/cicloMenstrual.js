import { validateActivePatient, redirectToPatientSelection } from './utils/patientValidation.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de ciclo menstrual carregada, iniciando...');
    
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

function formatarData(dataString) {
    if (typeof dataString === 'string') {
        const dataLimpa = dataString.split('.')[0];
        const data = new Date(dataLimpa);
        if (!isNaN(data.getTime())) {
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    if (dataString instanceof Date) {
        return dataString.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    console.error('Formato de data inválido:', dataString);
    return 'Data não disponível';
}

function calcularEstatisticas(registros) {
    if (!registros || registros.length === 0) {
        return {
            totalRegistros: 0,
            cicloMedio: 0,
            duracaoMedia: 0,
            diasDesdeUltima: 0
        };
    }

    const totalRegistros = registros.length;
    
    // Ordenar registros por data de início (mais antigo primeiro)
    const registrosOrdenados = [...registros].sort((a, b) => {
        const dataA = new Date(a.dataInicio);
        const dataB = new Date(b.dataInicio);
        return dataA - dataB;
    });
    
    // Calcular ciclo médio (diferença entre dataInicio dos registros consecutivos)
    let ciclos = [];
    for (let i = 1; i < registrosOrdenados.length; i++) {
        const dataAtual = new Date(registrosOrdenados[i].dataInicio);
        const dataAnterior = new Date(registrosOrdenados[i-1].dataInicio);
        const diferencaDias = Math.floor((dataAtual - dataAnterior) / (1000 * 60 * 60 * 24));
        
        // Filtrar ciclos válidos (entre 15 e 45 dias é razoável)
        if (diferencaDias > 0 && diferencaDias <= 45) {
            ciclos.push(diferencaDias);
        }
    }
    
    const cicloMedio = ciclos.length > 0 ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : 0;
    
    // Calcular duração média baseada nos registros
    const duracoes = registrosOrdenados.map(registro => {
        // Se tem diasPorData, usar o número de dias registrados
        if (registro.diasPorData && Object.keys(registro.diasPorData).length > 0) {
            return Object.keys(registro.diasPorData).length;
        }
        
        // Senão, calcular pela diferença entre dataInicio e dataFim
        const dataInicio = new Date(registro.dataInicio);
        const dataFim = new Date(registro.dataFim);
        const duracao = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;
        return duracao;
    });
    
    const duracaoMedia = duracoes.length > 0 ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length) : 0;
    
    // Calcular dias desde última menstruação (usar dataFim do último registro)
    const agora = new Date();
    agora.setHours(0, 0, 0, 0);
    
    const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];
    let ultimaDataMenstruacao = null;
    
    if (ultimoRegistro) {
        // Se tem diasPorData, pegar a última data registrada
        if (ultimoRegistro.diasPorData && Object.keys(ultimoRegistro.diasPorData).length > 0) {
            const datas = Object.keys(ultimoRegistro.diasPorData).sort();
            if (datas.length > 0) {
                ultimaDataMenstruacao = new Date(datas[datas.length - 1]);
            }
        }
        
        // Fallback: usar dataFim do registro
        if (!ultimaDataMenstruacao) {
            ultimaDataMenstruacao = new Date(ultimoRegistro.dataFim);
        }
        
        ultimaDataMenstruacao.setHours(0, 0, 0, 0);
    }
    
    const diasDesdeUltima = ultimaDataMenstruacao ? Math.floor((agora - ultimaDataMenstruacao) / (1000 * 60 * 60 * 24)) : 0;

    return {
        totalRegistros,
        cicloMedio,
        duracaoMedia,
        diasDesdeUltima
    };
}

function atualizarEstatisticas(registros) {
    const stats = calcularEstatisticas(registros);
    
    const totalElement = document.getElementById('totalRecords');
    const cicloElement = document.getElementById('avgCycleLength');
    const duracaoElement = document.getElementById('avgDuration');
    const diasElement = document.getElementById('lastMenstruationDays');

    if (totalElement) totalElement.textContent = stats.totalRegistros;
    if (cicloElement) cicloElement.textContent = `${stats.cicloMedio} dias`;
    if (duracaoElement) duracaoElement.textContent = `${stats.duracaoMedia} dias`;
    if (diasElement) diasElement.textContent = `${stats.diasDesdeUltima} dias`;
}

async function buscarRegistrosMenstruais() {
    try {
        const tokenMedico = localStorage.getItem('token');
        
        let selectedPatient = localStorage.getItem('selectedPatient') || 
                             localStorage.getItem('pacienteSelecionado') || 
                             localStorage.getItem('selectedPatientData');
        
        if (!tokenMedico) {
            mostrarErro("Sessão expirada. Faça login novamente!");
            return [];
        }

        if (!selectedPatient) {
            console.log('Chaves disponíveis no localStorage:', Object.keys(localStorage));
            mostrarErro("Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.");
            return [];
        }

        let paciente;
        try {
            paciente = JSON.parse(selectedPatient);
        } catch (parseError) {
            console.error('Erro ao fazer parse do paciente:', parseError);
            mostrarErro("Erro ao processar dados do paciente selecionado.");
            return [];
        }

        const cpf = paciente.cpf?.replace(/[^\d]/g, '');

        if (!cpf) {
            console.log('Dados do paciente:', paciente);
            mostrarErro("CPF não encontrado no paciente selecionado.");
            return [];
        }

        console.log(`Buscando registros menstruais para CPF: ${cpf}`);

        const response = await fetch(`${API_URL}/api/menstruacao/medico?cpf=${cpf}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${tokenMedico}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('Nenhum registro menstrual encontrado');
                return [];
            }
            mostrarErro("Erro ao buscar registros menstruais!");
            return [];
        }

        const data = await response.json();
        console.log('Registros menstruais recebidos:', data);
        return data;
    } catch (error) {
        console.error('Erro ao buscar registros menstruais:', error);
        mostrarErro("Erro interno ao buscar registros menstruais.");
        return [];
    }
}

let currentDate = new Date();
let registrosMenstruais = [];

function formatarDataParaComparacao(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isDiaMenstruacao(year, month, day, registros) {
    if (!registros || registros.length === 0) return false;
    
    const dataAtual = new Date(year, month, day);
    const dataFormatada = formatarDataParaComparacao(dataAtual);
    
    for (const registro of registros) {
        // Verificar se existe diasPorData e se a data está lá
        if (registro.diasPorData && registro.diasPorData[dataFormatada]) {
            return true;
        }
        
        // Fallback: verificar se está dentro do período de menstruação
        const dataInicio = new Date(registro.dataInicio);
        const dataFim = new Date(registro.dataFim);
        
        // Normalizar para meia-noite para comparação correta
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        
        // Verificar se o dia está dentro do período de menstruação
        if (dataAtual >= dataInicio && dataAtual <= dataFim) {
            return true;
        }
    }
    
    return false;
}

function isDiaCiclo(year, month, day, registros) {
    if (!registros || registros.length === 0) return false;
    
    const dataAtual = new Date(year, month, day);
    dataAtual.setHours(0, 0, 0, 0);
    
    // Se já é dia de menstruação, não é dia de ciclo
    if (isDiaMenstruacao(year, month, day, registros)) {
        return false;
    }
    
    // Ordenar registros por data de início
    const registrosOrdenados = [...registros].sort((a, b) => {
        const dataA = new Date(a.dataInicio);
        const dataB = new Date(b.dataInicio);
        return dataA - dataB;
    });
    
    // Calcular ciclo médio
    let ciclos = [];
    for (let i = 1; i < registrosOrdenados.length; i++) {
        const dataAtualReg = new Date(registrosOrdenados[i].dataInicio);
        const dataAnterior = new Date(registrosOrdenados[i-1].dataInicio);
        const diferencaDias = Math.floor((dataAtualReg - dataAnterior) / (1000 * 60 * 60 * 24));
        
        if (diferencaDias > 0 && diferencaDias <= 45) {
            ciclos.push(diferencaDias);
        }
    }
    
    const cicloMedio = ciclos.length > 0 ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : 28;
    
    // Verificar se o dia está no período fértil de algum registro
    for (const registro of registrosOrdenados) {
        const dataInicio = new Date(registro.dataInicio);
        dataInicio.setHours(0, 0, 0, 0);
        
        // Calcular período fértil: geralmente ocorre no meio do ciclo
        // Ovulação ocorre aproximadamente 14 dias antes da próxima menstruação
        // Período fértil: 5 dias antes e 2 dias depois da ovulação (total ~7 dias)
        const diaOvulacao = Math.floor(cicloMedio / 2);
        const inicioPeriodoFertil = new Date(dataInicio);
        inicioPeriodoFertil.setDate(inicioPeriodoFertil.getDate() + Math.max(10, diaOvulacao - 3));
        
        const fimPeriodoFertil = new Date(dataInicio);
        fimPeriodoFertil.setDate(fimPeriodoFertil.getDate() + Math.min(diaOvulacao + 3, cicloMedio - 10));
        
        inicioPeriodoFertil.setHours(0, 0, 0, 0);
        fimPeriodoFertil.setHours(0, 0, 0, 0);
        
        // Verificar se está dentro do período fértil
        if (dataAtual >= inicioPeriodoFertil && dataAtual <= fimPeriodoFertil) {
            return true;
        }
        
        // Verificar período pré-menstrual (últimos 3-5 dias antes da próxima menstruação esperada)
        const proximaMenstruacaoEsperada = new Date(dataInicio);
        proximaMenstruacaoEsperada.setDate(proximaMenstruacaoEsperada.getDate() + cicloMedio);
        
        const inicioPreMenstrual = new Date(proximaMenstruacaoEsperada);
        inicioPreMenstrual.setDate(inicioPreMenstrual.getDate() - 5);
        
        proximaMenstruacaoEsperada.setHours(0, 0, 0, 0);
        inicioPreMenstrual.setHours(0, 0, 0, 0);
        
        // Verificar se está no período pré-menstrual e não há outra menstruação antes
        if (dataAtual >= inicioPreMenstrual && dataAtual < proximaMenstruacaoEsperada) {
            // Verificar se não há menstruação entre o início pré-menstrual e a data atual
            let temMenstruacaoAntes = false;
            for (const outroRegistro of registrosOrdenados) {
                const outroInicio = new Date(outroRegistro.dataInicio);
                outroInicio.setHours(0, 0, 0, 0);
                if (outroInicio > inicioPreMenstrual && outroInicio <= dataAtual) {
                    temMenstruacaoAntes = true;
                    break;
                }
            }
            
            if (!temMenstruacaoAntes) {
                return true;
            }
        }
    }
    
    return false;
}

function renderizarCalendario(date, registros = []) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const monthYearElement = document.getElementById('monthYear');
    if (monthYearElement) {
        monthYearElement.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarBody = document.getElementById('calendarBody');
    if (!calendarBody) return;

    calendarBody.innerHTML = '';

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = daysInPrevMonth - i;
        calendarBody.appendChild(dayElement);
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const isMenstrual = isDiaMenstruacao(year, month, day, registros);
        const isCiclo = isDiaCiclo(year, month, day, registros);
        
        // Marcar dia atual
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Adicionar ícone de coração nos dias de menstruação (sem fundo vermelho)
        if (isMenstrual) {
            // Criar container para número e ícone
            dayElement.innerHTML = `
                <div class="day-content">
                    <span class="day-number">${day}</span>
                    <span class="heart-icon menstrual-heart">♥</span>
                </div>
            `;
        } else if (isCiclo) {
            // Marcar dias do ciclo (período fértil e pré-menstrual)
            dayElement.classList.add('cycle');
            dayElement.textContent = day;
        } else {
            dayElement.textContent = day;
        }
        
        calendarBody.appendChild(dayElement);
    }

    // Dias do próximo mês para completar a grade
    const totalCells = calendarBody.children.length;
    const remainingCells = 42 - totalCells; // 6 semanas * 7 dias
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarBody.appendChild(dayElement);
    }
}

function renderizarRegistros(registros) {
    const recordsGrid = document.getElementById('recordsGrid');
    const noRecords = document.getElementById('noRecords');
    const recordsCount = document.getElementById('recordsCount');

    if (!recordsGrid || !noRecords || !recordsCount) return;

    // Atualizar estatísticas
    atualizarEstatisticas(registros);

    // Atualizar contador
    recordsCount.textContent = registros.length;

    // Limpar grid
    recordsGrid.innerHTML = '';

    if (registros.length === 0) {
        noRecords.style.display = 'block';
        return;
    }

    noRecords.style.display = 'none';

    registros.forEach(registro => {
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';

        // Calcular duração do período
        const dataInicio = new Date(registro.dataInicio);
        const dataFim = new Date(registro.dataFim);
        const duracao = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;

        // Obter informações do registro - usar diasPorData se disponível
        let fluxos = [];
        let humores = [];
        let temColica = false;
        
        if (registro.diasPorData && Object.keys(registro.diasPorData).length > 0) {
            Object.values(registro.diasPorData).forEach(dia => {
                if (dia.fluxo && dia.fluxo.trim() !== '') {
                    fluxos.push(dia.fluxo);
                }
                if (dia.humor && dia.humor.trim() !== '') {
                    humores.push(dia.humor);
                }
                if (dia.teveColica) {
                    temColica = true;
                }
            });
        }
        
        // Determinar intensidade do fluxo - usar mais comum ou primeira
        const intensidadeFluxo = fluxos.length > 0 ? fluxos[0] : 'Não especificada';
        
        // Determinar humor - usar mais comum ou primeiro
        const humor = humores.length > 0 ? humores[0] : 'Não especificado';
        const humorIcon = humor === 'Feliz' ? '😊' : 
                         humor === 'Normal' ? '😐' : 
                         humor === 'Cansado' ? '😴' : 
                         humor === 'Irritável' ? '😠' : 
                         humor === 'Ansioso' ? '😰' : 
                         humor === 'Deprimido' ? '😔' : '😐';

        recordCard.innerHTML = `
            <div class="record-header">
                <div class="record-date">${formatarData(registro.dataInicio)}</div>
                <div class="record-type menstrual">
                    Menstruação
                </div>
            </div>
            
            <div class="record-title">Registro de Menstruação</div>
            
            <div class="record-details">
                <div class="record-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Período: ${formatarData(registro.dataInicio)} - ${formatarData(registro.dataFim)}</span>
                </div>
                <div class="record-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Duração: ${duracao} dias</span>
                </div>
                <div class="record-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    <span>Fluxo: ${intensidadeFluxo}</span>
                </div>
                <div class="record-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Humor: ${humor} ${humorIcon}</span>
                </div>
                ${temColica ? `
                <div class="record-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    <span>Cólica: Presente</span>
                </div>
                ` : ''}
            </div>
            
            <div class="record-description">
                ${registro.diasPorData && Object.keys(registro.diasPorData).length > 0 
                    ? `${Object.keys(registro.diasPorData).length} dia(s) registrado(s)` 
                    : (registro.observacoes || 'Nenhuma observação registrada')}
            </div>
            
            <div class="record-footer">
                <div class="record-status active">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
                        <path d="M16 2l4 4-4 4"></path>
                    </svg>
                    Registrado
                </div>
            </div>
        `;

        recordsGrid.appendChild(recordCard);
    });
}

function configurarNavegacaoCalendario() {
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderizarCalendario(currentDate, registrosMenstruais);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderizarCalendario(currentDate, registrosMenstruais);
        });
    }
}

async function carregarDados() {
    const registros = await buscarRegistrosMenstruais();
    registrosMenstruais = registros;
    renderizarRegistros(registros);
    renderizarCalendario(currentDate, registros);
}

async function inicializarPagina() {
    try {
        configurarNavegacaoCalendario();
        await carregarDados();
        
        console.log('Página de ciclo menstrual inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarErro('Erro ao inicializar a página');
    }
}

// Funções globais para debug
window.debugCicloMenstrual = function() {
    console.log('=== DEBUG CICLO MENSTRUAL ===');
    console.log('Data atual:', currentDate);
    console.log('Token médico:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    
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
    carregarDados().then(() => {
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
    
    carregarDados().then(() => {
        console.log('Dados recarregados com paciente simulado');
    }).catch((error) => {
        console.error('Erro ao recarregar dados:', error);
    });
};