import { validateActivePatient, redirectToPatientSelection } from './utils/patientValidation.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de histórico de crises de gastrite carregada, iniciando...');
    
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
let todasCrisesCache = [];
let crisesFiltradasAtuais = [];
let crisesPaginaAtual = 1;
const CRISES_POR_PAGINA = 12;

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

function formatarDataCurta(dataString) {
    try {
        const data = new Date(typeof dataString === 'string' ? dataString.split('.')[0] : dataString);
        if (isNaN(data.getTime())) return 'Data não disponível';
        return data.toLocaleDateString('pt-BR');
    } catch {
        return 'Data não disponível';
    }
}

function obterClasseIntensidade(intensidade) {
    if (intensidade === 0) return 'low';
    if (intensidade >= 1 && intensidade <= 3) return 'low';
    if (intensidade >= 4 && intensidade <= 6) return 'moderate';
    if (intensidade >= 7 && intensidade <= 9) return 'high';
    if (intensidade === 10) return 'severe';
    return 'low';
}

function obterTextoIntensidade(intensidade) {
    if (intensidade === 0) return 'Sem dor';
    if (intensidade >= 1 && intensidade <= 3) return 'Dor leve';
    if (intensidade >= 4 && intensidade <= 6) return 'Dor Moderada';
    if (intensidade >= 7 && intensidade <= 9) return 'Dor Intensa';
    if (intensidade === 10) return 'Dor insuportável';
    return 'Intensidade não especificada';
}

function getIntensityText(valor) {
    if (valor === undefined || valor === null || valor === '') return 'Não informado';
    const n = parseInt(valor, 10);
    if (isNaN(n)) return String(valor);
    if (n === 0) return 'Sem dor (0/10)';
    if (n <= 3) return `Leve (${n}/10)`;
    if (n <= 6) return `Moderada (${n}/10)`;
    if (n <= 9) return `Intensa (${n}/10)`;
    if (n === 10) return 'Insuportável (10/10)';
    return `${n}/10`;
}

function calcularEstatisticas(crises) {
    if (!crises || crises.length === 0) {
        return {
            totalCrises: 0,
            intensidadeMedia: 0,
            comAlivio: 0,
            crisesRecentes: 0
        };
    }

    const totalCrises = crises.length;
    const somaIntensidade = crises.reduce((acc, crise) => acc + crise.intensidadeDor, 0);
    const intensidadeMedia = Math.round(somaIntensidade / totalCrises);
    const comAlivio = crises.filter(crise => crise.alivioMedicacao).length;
    
    // Crises dos últimos 30 dias
    const agora = new Date();
    const trintaDiasAtras = new Date(agora.getTime() - (30 * 24 * 60 * 60 * 1000));
    const crisesRecentes = crises.filter(crise => {
        const dataCrise = new Date(crise.data);
        return dataCrise >= trintaDiasAtras;
    }).length;

    return {
        totalCrises,
        intensidadeMedia,
        comAlivio,
        crisesRecentes
    };
}

function atualizarEstatisticas(crises) {
    const stats = calcularEstatisticas(crises);
    
    const totalElement = document.getElementById('totalCrisesCount');
    const intensidadeElement = document.getElementById('avgIntensity');
    const alivioElement = document.getElementById('reliefCount');
    const recentesElement = document.getElementById('recentCrisesCount');

    if (totalElement) totalElement.textContent = stats.totalCrises;
    if (intensidadeElement) intensidadeElement.textContent = `${stats.intensidadeMedia}/10`;
    if (alivioElement) alivioElement.textContent = stats.comAlivio;
    if (recentesElement) recentesElement.textContent = stats.crisesRecentes;
}

async function buscarCrises(filtros = {}) {
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

        console.log(`Buscando crises de gastrite para CPF: ${cpf}`);

		// Buscar SEM filtros no servidor (evitar 500). Filtramos no cliente.
		let url = `${API_URL}/api/gastrite/medico?cpf=${cpf}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${tokenMedico}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('Nenhuma crise de gastrite encontrada');
                return [];
            }
            mostrarErro("Erro ao buscar crises de gastrite!");
            return [];
        }

        const data = await response.json();
        console.log('Crises de gastrite recebidas:', data);
        // Cache completo para alimentar filtros dinâmicos (meses disponíveis)
        todasCrisesCache = Array.isArray(data) ? data : [];

		// Filtragem BURRA no cliente (mês/ano/intensidade)
		const mes = filtros?.month ? parseInt(filtros.month, 10) : null;
		const ano = filtros?.year ? parseInt(filtros.year, 10) : null;
		const intensidadeFiltro = filtros?.intensity || '';
        let resultado = Array.isArray(data) ? data : [];

		if (mes || ano) {
			resultado = resultado.filter((crise) => {
				const d = new Date(crise.data);
				if (isNaN(d.getTime())) return false;
				// Usar UTC para evitar mudanças de mês por fuso horário
				const dMes = d.getUTCMonth() + 1; // 1-12
				const dAno = d.getUTCFullYear();
				const mesOk = mes ? dMes === mes : true;
				const anoOk = ano ? dAno === ano : true;
				return mesOk && anoOk;
			});
		}

		// Intensidade no cliente (aceita '0', '10', '1-3', '4-6', '7-9')
		if (intensidadeFiltro) {
			if (/^\d+$/.test(intensidadeFiltro)) {
				const alvo = parseInt(intensidadeFiltro, 10);
				resultado = resultado.filter((crise) => {
					const val = Number(crise.intensidadeDor);
					return !Number.isNaN(val) && val === alvo;
				});
			} else if (/^\d+\-\d+$/.test(intensidadeFiltro)) {
				const [min, max] = intensidadeFiltro.split('-').map((n) => parseInt(n, 10));
				resultado = resultado.filter((crise) => {
					const val = Number(crise.intensidadeDor);
					return !Number.isNaN(val) && val >= min && val <= max;
				});
			}
		}

		return resultado;
    } catch (error) {
        console.error('Erro ao buscar crises de gastrite:', error);
        mostrarErro("Erro interno ao buscar crises de gastrite.");
        return [];
    }
}

function atualizarMesesDisponiveis(anoSelecionado) {
    try {
        const monthsList = document.getElementById('monthsList');
        const monthInput = document.getElementById('filterMonth');
        if (!monthsList || !monthInput) return;

        const monthNames = {
            1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
            5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
            9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
        };

        const anoNum = anoSelecionado && /^\d+$/.test(anoSelecionado) ? parseInt(anoSelecionado, 10) : null;

        // Descobrir meses com crises considerando o ano selecionado (se houver)
        const mesesSet = new Set();
        (todasCrisesCache || []).forEach((crise) => {
            const d = new Date(crise.data);
            if (isNaN(d.getTime())) return;
            const y = d.getUTCFullYear();
            const m = d.getUTCMonth() + 1;
            if (!anoNum || y === anoNum) {
                mesesSet.add(m);
            }
        });

        // Reconstruir a lista de opções
        let html = '';
        html += `<div class="option" data-value="">Todos os meses</div>`;
        for (let m = 1; m <= 12; m++) {
            if (mesesSet.has(m)) {
                html += `<div class="option" data-value="${m}">${monthNames[m]}</div>`;
            }
        }
        monthsList.innerHTML = html;

        // Se o mês selecionado atual não estiver mais disponível, resetar
        const currentSelected = monthInput.dataset.value || '';
        if (currentSelected && !mesesSet.has(parseInt(currentSelected, 10))) {
            monthInput.value = 'Todos os meses';
            monthInput.dataset.value = '';
        }
    } catch (e) {
        console.warn('Falha ao atualizar meses disponíveis:', e);
    }
}

function atualizarIntensidadesDisponiveis(mesSelecionado, anoSelecionado) {
    try {
        const intensityList = document.getElementById('intensidadesList');
        const intensityInput = document.getElementById('filterIntensity');
        if (!intensityList || !intensityInput) return;

        const hasCategory = {
            '0': false,
            '1-3': false,
            '4-6': false,
            '7-9': false,
            '10': false
        };

        const mesNum = mesSelecionado && /^\d+$/.test(mesSelecionado) ? parseInt(mesSelecionado, 10) : null;
        const anoNum = anoSelecionado && /^\d+$/.test(anoSelecionado) ? parseInt(anoSelecionado, 10) : null;

        (todasCrisesCache || []).forEach((crise) => {
            const d = new Date(crise.data);
            if (isNaN(d.getTime())) return;
            const y = d.getUTCFullYear();
            const m = d.getUTCMonth() + 1;
            if ((mesNum && m !== mesNum) || (anoNum && y !== anoNum)) return;

            const val = Number(crise.intensidadeDor);
            if (Number.isNaN(val)) return;
            if (val === 0) hasCategory['0'] = true;
            else if (val === 10) hasCategory['10'] = true;
            else if (val >= 1 && val <= 3) hasCategory['1-3'] = true;
            else if (val >= 4 && val <= 6) hasCategory['4-6'] = true;
            else if (val >= 7 && val <= 9) hasCategory['7-9'] = true;
        });

        const labels = {
            '0': 'Sem dor (0)',
            '1-3': 'Leve (1-3)',
            '4-6': 'Moderada (4-6)',
            '7-9': 'Intensa (7-9)',
            '10': 'Dor insuportável (10)'
        };

        let html = '';
        html += `<div class="option" data-value="">Todas as Intensidades</div>`;
        ['0', '1-3', '4-6', '7-9', '10'].forEach((key) => {
            if (hasCategory[key]) {
                html += `<div class="option" data-value="${key}">${labels[key]}</div>`;
            }
        });
        intensityList.innerHTML = html;

        // Se a intensidade selecionada atual não estiver mais disponível, resetar
        const currentSelected = intensityInput.dataset.value || '';
        if (currentSelected && !hasCategory[currentSelected]) {
            intensityInput.value = 'Todas as Intensidades';
            intensityInput.dataset.value = '';
        }
    } catch (e) {
        console.warn('Falha ao atualizar intensidades disponíveis:', e);
    }
}

function renderizarCrises(crises) {
    const crisesGrid = document.getElementById('crisesGrid');
    const noCrises = document.getElementById('noCrises');
    const crisesCount = document.getElementById('crisesCount');
    const paginationControls = document.getElementById('paginationControls');

    if (!crisesGrid || !noCrises || !crisesCount) return;

    // Atualizar estatísticas
    atualizarEstatisticas(crises);

    // Atualizar contador
    crisesCount.textContent = crises.length;

    // Limpar grid
    crisesGrid.innerHTML = '';

    if (crises.length === 0) {
        noCrises.style.display = 'block';
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
        return;
    }

    noCrises.style.display = 'none';

    // Aplicar paginação
    const inicio = (crisesPaginaAtual - 1) * CRISES_POR_PAGINA;
    const fim = inicio + CRISES_POR_PAGINA;
    const crisesPagina = crises.slice(inicio, fim);

    crisesPagina.forEach(crise => {
        const card = document.createElement('div');
        card.className = 'record-card';
        card.setAttribute('data-id', crise._id || '');

        const titulo = crise.titulo || 'Crise de Gastrite';
        const dataFormatada = formatarDataCurta(crise.data);
        const intensidadeTexto = getIntensityText(crise.intensidadeDor);

        card.innerHTML = `
            <div class="record-header">
                <div>
                    <div class="record-title">${titulo}</div>
                </div>
				<div class="record-badge ${obterClasseIntensidade(crise.intensidadeDor)}">${intensidadeTexto}</div>
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
                    <div class="record-info-label">Data:</div>
                    <div class="record-info-value">${dataFormatada}</div>
                </div>

				<div class="record-info-item">
					<div class="record-info-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 13V7a2 2 0 0 0-2-2h-3"></path>
							<path d="M8 5H6a2 2 0 0 0-2 2v6"></path>
							<rect x="6" y="13" width="12" height="8" rx="2"></rect>
						</svg>
					</div>
					<div class="record-info-label">Sintomas:</div>
					<div class="record-info-value">${(crise.sintomas && String(crise.sintomas).trim()) ? crise.sintomas : 'Não informado'}</div>
				</div>

				<div class="record-info-item">
					<div class="record-info-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 3H7a2 2 0 0 0-2 2v14"></path>
							<path d="M7 7h10"></path>
							<path d="M11 11h6"></path>
							<path d="M11 15h6"></path>
						</svg>
					</div>
					<div class="record-info-label">Medicação:</div>
					<div class="record-info-value">${(crise.medicacao && String(crise.medicacao).trim()) ? crise.medicacao : 'Não informado'}</div>
				</div>

				
            </div>

            <div class="record-actions">
                <a href="/client/views/visualizacaoCriseGastrite.html?id=${crise._id || ''}" class="btn-view" onclick="event.stopPropagation();">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Visualizar Registro
                </a>
            </div>
        `;

        crisesGrid.appendChild(card);
    });

    // Mostrar/ocultar controles de paginação
    const totalPaginas = Math.ceil(crises.length / CRISES_POR_PAGINA);
    if (paginationControls) {
        if (totalPaginas > 1) {
            paginationControls.style.display = 'flex';
        } else {
            paginationControls.style.display = 'none';
        }
    }

    // Atualizar controles de paginação
    atualizarControlesPagina(crises);
}

// Função para atualizar controles de paginação
function atualizarControlesPagina(crises) {
    const totalPaginas = Math.ceil(crises.length / CRISES_POR_PAGINA);
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');
    const infoPagina = document.getElementById('infoPagina');
    
    if (btnAnterior) {
        btnAnterior.disabled = crisesPaginaAtual === 1;
        btnAnterior.style.opacity = crisesPaginaAtual === 1 ? '0.5' : '1';
    }
    
    if (btnProximo) {
        btnProximo.disabled = crisesPaginaAtual === totalPaginas;
        btnProximo.style.opacity = crisesPaginaAtual === totalPaginas ? '0.5' : '1';
    }
    
    if (infoPagina) {
        const inicio = (crisesPaginaAtual - 1) * CRISES_POR_PAGINA + 1;
        const fim = Math.min(crisesPaginaAtual * CRISES_POR_PAGINA, crises.length);
        infoPagina.textContent = `Mostrando ${inicio}-${fim} de ${crises.length} registros`;
    }
}

function aplicarFiltros() {
	// Resetar paginação ao aplicar filtros
	crisesPaginaAtual = 1;
	
	const monthEl = document.getElementById('filterMonth');
	const yearEl = document.getElementById('filterYear');
	const intensityEl = document.getElementById('filterIntensity');

	const rawMonth = monthEl?.dataset.value || '';
	const rawYear = yearEl?.dataset.value || '';
	const rawIntensity = intensityEl?.dataset.value || '';

	// Apenas valores válidos (numéricos/range), do contrário enviamos vazio
	const filtros = {
		month: /^\d+$/.test(rawMonth) ? rawMonth : '',
		year: /^\d+$/.test(rawYear) ? rawYear : '',
		intensity: /^(\d+|\d+\-\d+)$/.test(rawIntensity) ? rawIntensity : ''
	};
    
    carregarCrises(filtros);
}

function limparFiltros() {
    // Resetar paginação ao limpar filtros
    crisesPaginaAtual = 1;
    
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    const filterIntensity = document.getElementById('filterIntensity');

    if (filterMonth) { filterMonth.value = 'Todos os meses'; filterMonth.dataset.value = ''; }
    if (filterYear) { filterYear.value = 'Todos os anos'; filterYear.dataset.value = ''; }
    if (filterIntensity) { filterIntensity.value = 'Todas as Intensidades'; filterIntensity.dataset.value = ''; }

    carregarCrises();
}

async function carregarCrises(filtros = {}) {
    // Resetar paginação ao carregar crises
    crisesPaginaAtual = 1;
    
    const crises = await buscarCrises(filtros);
    // Armazenar crises filtradas para paginação
    crisesFiltradasAtuais = crises;
    
    // Atualizar meses disponíveis após qualquer alteração de filtros (principalmente ano)
    const yearEl = document.getElementById('filterYear');
    const anoSelecionado = yearEl?.dataset.value || '';
    atualizarMesesDisponiveis(anoSelecionado);
    // Atualizar intensidades disponíveis com base em mês/ano atuais
    const monthEl = document.getElementById('filterMonth');
    const mesSelecionado = monthEl?.dataset.value || '';
    atualizarIntensidadesDisponiveis(mesSelecionado, anoSelecionado);
    renderizarCrises(crises);
}

function configurarEventListeners() {
    // Configura custom selects (mesmo visual do histórico de eventos clínicos)
    setupCustomSelectByIds('filterMonth', 'monthsList');
    setupCustomSelectByIds('filterYear', 'yearsList');
    setupCustomSelectByIds('filterIntensity', 'intensidadesList');

    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) clearFilters.addEventListener('click', limparFiltros);

	// Botão de limpar dentro do estado vazio
	const noCrisesClear = document.getElementById('noCrisesClear');
	if (noCrisesClear) noCrisesClear.addEventListener('click', limparFiltros);
	
	// Event listeners para paginação
	const btnAnterior = document.getElementById('btnAnterior');
	const btnProximo = document.getElementById('btnProximo');
	
	if (btnAnterior) {
		btnAnterior.addEventListener('click', () => {
			if (crisesPaginaAtual > 1) {
				crisesPaginaAtual--;
				renderizarCrises(crisesFiltradasAtuais);
			}
		});
	}
	
	if (btnProximo) {
		btnProximo.addEventListener('click', () => {
			const totalPaginas = Math.ceil(crisesFiltradasAtuais.length / CRISES_POR_PAGINA);
			if (crisesPaginaAtual < totalPaginas) {
				crisesPaginaAtual++;
				renderizarCrises(crisesFiltradasAtuais);
			}
		});
	}
}

async function inicializarPagina() {
    try {
        configurarEventListeners();
        await carregarCrises();
        
        console.log('Página de histórico de crises de gastrite inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarErro('Erro ao inicializar a página');
    }
}

// Select customizado (adaptado do histórico de eventos clínicos)
function setupCustomSelectByIds(inputId, optionsId) {
    const input = document.getElementById(inputId);
    const options = document.getElementById(optionsId);
    if (!input || !options) return;

    const customSelect = input.closest('.custom-select');
    if (!customSelect) return;

    input.addEventListener('click', (e) => {
        e.preventDefault();
        customSelect.classList.toggle('active');
        document.querySelectorAll('.custom-select').forEach(select => {
            if (select !== customSelect) select.classList.remove('active');
        });
    });

    options.addEventListener('click', (e) => {
        if (e.target.classList.contains('option')) {
            const value = e.target.dataset.value;
            const text = e.target.textContent;
            input.value = text;
            input.dataset.value = value;

            options.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            customSelect.classList.remove('active');
            aplicarFiltros();
        }
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('active');
        }
    });
}

// Funções globais para debug
window.debugCrisesGastrite = function() {
    console.log('=== DEBUG CRISES GASTRITE ===');
    console.log('Token médico:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    console.log('Filtros atuais:', {
        month: document.getElementById('filterMonth')?.value,
        year: document.getElementById('filterYear')?.value,
        intensity: document.getElementById('filterIntensity')?.value
    });
    
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
    carregarCrises().then(() => {
        console.log('Crises carregadas com sucesso');
    }).catch((error) => {
        console.error('Erro ao carregar crises:', error);
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
    
    carregarCrises().then(() => {
        console.log('Crises recarregadas com paciente simulado');
    }).catch((error) => {
        console.error('Erro ao recarregar crises:', error);
    });
};