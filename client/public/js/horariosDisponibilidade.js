import { API_URL } from './config.js';
import { initHeaderComponent } from './components/header.js';
import { initDoctorSidebar } from './components/sidebarDoctor.js';

const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

let horarios = [];
let showInactive = false;

document.addEventListener('DOMContentLoaded', function() {
    initHeaderComponent({ title: 'Meus Horários de Trabalho' });
    initDoctorSidebar('horarios');

    const toggleButton = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            toggleButton.classList.toggle('shifted');
        });
    }

    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            title: 'Erro',
            text: 'Você precisa estar logado para acessar esta página',
            icon: 'error',
            confirmButtonText: 'Ir para Login',
            confirmButtonColor: '#002A42'
        }).then(() => {
            window.location.href = '/client/views/login.html';
        });
        return;
    }

    // Inicializar componentes
    initModal();
    initFilters();
    loadHorarios();
});

function getToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function showToast(message, icon = 'success') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
}

async function loadHorarios() {
    const loadingEl = document.getElementById('loading');
    const listEl = document.getElementById('horariosList');
    const emptyStateEl = document.getElementById('emptyState');

    try {
        loadingEl.style.display = 'block';
        listEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando horários...</div>';

        const response = await fetch(`${API_URL}/api/horarios-disponibilidade`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            throw new Error('Erro ao carregar horários');
        }

        const data = await response.json();
        horarios = data.horarios || [];

        renderHorarios();
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        listEl.innerHTML = `<div class="error">${error.message}</div>`;
        showToast(error.message, 'error');
    } finally {
        loadingEl.style.display = 'none';
    }
}

function renderHorarios() {
    const listEl = document.getElementById('horariosList');
    const emptyStateEl = document.getElementById('emptyState');

    const horariosFiltrados = showInactive 
        ? horarios 
        : horarios.filter(h => h.ativo);

    if (horariosFiltrados.length === 0) {
        listEl.style.display = 'none';
        emptyStateEl.style.display = 'block';
        return;
    }

    listEl.style.display = 'block';
    emptyStateEl.style.display = 'none';

    // Agrupar por dia da semana
    const horariosPorDia = {};
    horariosFiltrados.forEach(horario => {
        if (!horariosPorDia[horario.diaSemana]) {
            horariosPorDia[horario.diaSemana] = [];
        }
        horariosPorDia[horario.diaSemana].push(horario);
    });

    // Ordenar por dia da semana
    const diasOrdenados = Object.keys(horariosPorDia).sort((a, b) => a - b);

    let html = '';
    diasOrdenados.forEach(dia => {
        const horariosDia = horariosPorDia[dia].sort((a, b) => 
            a.horaInicio.localeCompare(b.horaInicio)
        );

        horariosDia.forEach(horario => {
            html += createHorarioCard(horario);
        });
    });

    listEl.innerHTML = html;

    // Adicionar event listeners aos botões
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.horario-card').dataset.id;
            editHorario(id);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.horario-card').dataset.id;
            deleteHorario(id);
        });
    });
}

function createHorarioCard(horario) {
    const statusClass = horario.ativo ? 'active' : 'inactive';
    const statusText = horario.ativo ? 'Ativo' : 'Inativo';
    
    return `
        <div class="horario-card ${statusClass}" data-id="${horario._id}">
            <div class="horario-info">
                <div class="horario-day">${horario.diaSemanaNome || diasSemana[horario.diaSemana]}</div>
                <div class="horario-time">
                    <i class="fas fa-clock"></i>
                    <span>${horario.horaInicio} - ${horario.horaFim}</span>
                </div>
                <div class="horario-details">
                    <div class="horario-duration">Duração: ${horario.duracaoConsulta} minutos</div>
                    ${horario.observacoes ? `<div class="horario-observacoes">${horario.observacoes}</div>` : ''}
                </div>
            </div>
            <div class="horario-status">
                <span class="status-badge ${statusClass}">${statusText}</span>
                <div class="horario-actions">
                    <button class="btn-secondary btn-small btn-edit">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-danger btn-small btn-delete">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `;
}

function initModal() {
    const modal = document.getElementById('horarioModal');
    const addBtn = document.getElementById('addHorarioBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelForm');
    const form = document.getElementById('horarioForm');

    addBtn.addEventListener('click', () => {
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', handleSubmit);

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal(horario = null) {
    const modal = document.getElementById('horarioModal');
    const form = document.getElementById('horarioForm');
    const title = document.getElementById('modalTitle');

    if (horario) {
        title.textContent = 'Editar Horário';
        document.getElementById('horarioId').value = horario._id;
        document.getElementById('diaSemana').value = horario.diaSemana;
        document.getElementById('horaInicio').value = horario.horaInicio;
        document.getElementById('horaFim').value = horario.horaFim;
        document.getElementById('duracaoConsulta').value = horario.duracaoConsulta;
        document.getElementById('observacoes').value = horario.observacoes || '';
        document.getElementById('ativo').checked = horario.ativo;
    } else {
        title.textContent = 'Adicionar Horário';
        form.reset();
        document.getElementById('horarioId').value = '';
        document.getElementById('ativo').checked = true;
    }

    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('horarioModal');
    const form = document.getElementById('horarioForm');
    
    modal.classList.remove('show');
    form.reset();
    document.getElementById('horarioId').value = '';
}

async function handleSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('horarioId').value;
    const data = {
        diaSemana: parseInt(document.getElementById('diaSemana').value),
        horaInicio: document.getElementById('horaInicio').value,
        horaFim: document.getElementById('horaFim').value,
        duracaoConsulta: parseInt(document.getElementById('duracaoConsulta').value),
        observacoes: document.getElementById('observacoes').value,
        ativo: document.getElementById('ativo').checked
    };

    try {
        let response;
        if (id) {
            // Atualizar
            response = await fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        } else {
            // Criar
            response = await fetch(`${API_URL}/api/horarios-disponibilidade`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar horário');
        }

        showToast(id ? 'Horário atualizado com sucesso!' : 'Horário cadastrado com sucesso!');
        closeModal();
        loadHorarios();
    } catch (error) {
        console.error('Erro ao salvar horário:', error);
        showToast(error.message, 'error');
    }
}

function editHorario(id) {
    const horario = horarios.find(h => h._id === id);
    if (horario) {
        openModal(horario);
    }
}

async function deleteHorario(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir horário');
        }

        showToast('Horário excluído com sucesso!');
        loadHorarios();
    } catch (error) {
        console.error('Erro ao excluir horário:', error);
        showToast(error.message, 'error');
    }
}

function initFilters() {
    const showInactiveCheckbox = document.getElementById('showInactive');
    
    showInactiveCheckbox.addEventListener('change', (e) => {
        showInactive = e.target.checked;
        renderHorarios();
    });
}

// Exportar função para uso global se necessário
window.createHorarioCard = createHorarioCard;

