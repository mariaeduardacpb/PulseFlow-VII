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

        let url = `${API_URL}/api/gastrite/medico?cpf=${cpf}`;
        const queryParams = new URLSearchParams();

        if (filtros.month) {
            queryParams.append('month', filtros.month);
        }
        
        if (filtros.year) {
            queryParams.append('year', filtros.year);
        }

        if (filtros.intensity) {
            if (filtros.intensity === '10') {
                queryParams.append('intensity', '10-10');
            } else {
                queryParams.append('intensity', filtros.intensity);
            }
        }

        if (queryParams.toString()) {
            url += `&${queryParams.toString()}`;
        }

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
        return data;
    } catch (error) {
        console.error('Erro ao buscar crises de gastrite:', error);
        mostrarErro("Erro interno ao buscar crises de gastrite.");
        return [];
    }
}

function renderizarCrises(crises) {
    const crisesGrid = document.getElementById('crisesGrid');
    const noCrises = document.getElementById('noCrises');
    const crisesCount = document.getElementById('crisesCount');

    if (!crisesGrid || !noCrises || !crisesCount) return;

    // Atualizar estatísticas
    atualizarEstatisticas(crises);

    // Atualizar contador
    crisesCount.textContent = crises.length;

    // Limpar grid
    crisesGrid.innerHTML = '';

    if (crises.length === 0) {
        noCrises.style.display = 'block';
        return;
    }

    noCrises.style.display = 'none';

    crises.forEach(crise => {
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
}

function aplicarFiltros() {
    const filtros = {
        month: document.getElementById('filterMonth')?.dataset.value || document.getElementById('filterMonth')?.value || '',
        year: document.getElementById('filterYear')?.dataset.value || document.getElementById('filterYear')?.value || '',
        intensity: document.getElementById('filterIntensity')?.dataset.value || document.getElementById('filterIntensity')?.value || ''
    };
    
    carregarCrises(filtros);
}

function limparFiltros() {
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    const filterIntensity = document.getElementById('filterIntensity');

    if (filterMonth) { filterMonth.value = 'Todos os meses'; filterMonth.dataset.value = ''; }
    if (filterYear) { filterYear.value = 'Todos os anos'; filterYear.dataset.value = ''; }
    if (filterIntensity) { filterIntensity.value = 'Todas as Intensidades'; filterIntensity.dataset.value = ''; }

    carregarCrises();
}

async function carregarCrises(filtros = {}) {
    const crises = await buscarCrises(filtros);
    renderizarCrises(crises);
}

function configurarEventListeners() {
    // Configura custom selects (mesmo visual do histórico de eventos clínicos)
    setupCustomSelectByIds('filterMonth', 'monthsList');
    setupCustomSelectByIds('filterYear', 'yearsList');
    setupCustomSelectByIds('filterIntensity', 'intensidadesList');

    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) clearFilters.addEventListener('click', limparFiltros);
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