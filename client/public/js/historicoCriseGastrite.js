document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de histórico de crises de gastrite carregada, iniciando...');
    
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
        const criseCard = document.createElement('div');
        criseCard.className = 'crisis-card';

        const classeIntensidade = obterClasseIntensidade(crise.intensidadeDor);
        const textoIntensidade = obterTextoIntensidade(crise.intensidadeDor);

        criseCard.innerHTML = `
            <div class="crisis-header">
                <div class="crisis-date">${formatarData(crise.data)}</div>
                <div class="crisis-intensity ${classeIntensidade}">
                    ${textoIntensidade} (${crise.intensidadeDor}/10)
                </div>
            </div>
            
            <div class="crisis-title">${crise.titulo || 'Crise de Gastrite'}</div>
            
            <div class="crisis-details">
                <div class="crisis-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    <span>Medicação: ${crise.medicacao || 'Não especificada'}</span>
                </div>
                <div class="crisis-detail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
                        <path d="M16 2l4 4-4 4"></path>
                    </svg>
                    <span>Alívio: ${crise.alivioMedicacao ? 'Sim' : 'Não'}</span>
                </div>
            </div>
            
            <div class="crisis-description">
                ${crise.descricao || 'Descrição não disponível'}
            </div>
            
            <div class="crisis-footer">
                <div class="crisis-relief ${crise.alivioMedicacao ? 'has-relief' : 'no-relief'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
                        <path d="M16 2l4 4-4 4"></path>
                    </svg>
                    ${crise.alivioMedicacao ? 'Com alívio' : 'Sem alívio'}
                </div>
                <div class="crisis-actions">
                    <button class="action-btn" onclick="window.open('../views/visualizacaoCriseGastrite.html?id=${crise._id}', '_blank')" title="Visualizar detalhes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        crisesGrid.appendChild(criseCard);
    });
}

function aplicarFiltros() {
    const filtros = {
        month: document.getElementById('filterMonth')?.value || '',
        year: document.getElementById('filterYear')?.value || '',
        intensity: document.getElementById('filterIntensity')?.value || ''
    };
    
    carregarCrises(filtros);
}

function limparFiltros() {
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    const filterIntensity = document.getElementById('filterIntensity');

    if (filterMonth) filterMonth.value = '';
    if (filterYear) filterYear.value = '';
    if (filterIntensity) filterIntensity.value = '';

    carregarCrises();
}

async function carregarCrises(filtros = {}) {
    const crises = await buscarCrises(filtros);
    renderizarCrises(crises);
}

function configurarEventListeners() {
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    const filterIntensity = document.getElementById('filterIntensity');
    const clearFilters = document.getElementById('clearFilters');

    if (filterMonth) filterMonth.addEventListener('change', aplicarFiltros);
    if (filterYear) filterYear.addEventListener('change', aplicarFiltros);
    if (filterIntensity) filterIntensity.addEventListener('change', aplicarFiltros);
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