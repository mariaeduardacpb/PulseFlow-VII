(function () {
  const STORAGE_KEY = 'pulseflow_agendamentos';
  const STATUS_LABEL = {
    agendada: 'Agendada',
    confirmada: 'Confirmada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
  };

  const loadAppointments = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch (_) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes || '00'}`;
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(dateString));
    } catch (_) {
      return dateString;
    }
  };

  const escapeHTML = (str) => {
    return str
      ? str.replace(/[&<>"']/g, (char) => {
          const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          };
          return entities[char] || char;
        })
      : '';
  };

  function setupNavigation() {
    const novoAgendamentoBtn = document.getElementById('novoAgendamentoBtn');
    if (novoAgendamentoBtn) {
      novoAgendamentoBtn.addEventListener('click', () => {
        window.location.href = '/client/views/agendamento_novo.html';
      });
    }
  }

  function setupFilters(onChange) {
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroDataInicio = document.getElementById('filtroDataInicio');
    const filtroDataFim = document.getElementById('filtroDataFim');
    const limparFiltrosBtn = document.getElementById('limparFiltrosBtn');

    if (filtroStatus) {
      filtroStatus.addEventListener('change', onChange);
    }

    if (filtroDataInicio) {
      filtroDataInicio.addEventListener('change', onChange);
    }

    if (filtroDataFim) {
      filtroDataFim.addEventListener('change', onChange);
    }

    if (limparFiltrosBtn) {
      limparFiltrosBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (filtroStatus) filtroStatus.value = '';
        if (filtroDataInicio) filtroDataInicio.value = '';
        if (filtroDataFim) filtroDataFim.value = '';
        onChange();
      });
    }
  }

  function applyFilters(appointments) {
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroDataInicio = document.getElementById('filtroDataInicio');
    const filtroDataFim = document.getElementById('filtroDataFim');

    return appointments.filter((appointment) => {
      const statusFilter = filtroStatus ? filtroStatus.value : '';
      if (statusFilter && (appointment.status || 'agendada') !== statusFilter) {
        return false;
      }

      const startFilter = filtroDataInicio ? filtroDataInicio.value : '';
      const endFilter = filtroDataFim ? filtroDataFim.value : '';

      if (!startFilter && !endFilter) return true;

      const appointmentDate = appointment.data ? new Date(`${appointment.data}T${appointment.hora || '00:00'}`) : null;
      if (!appointmentDate) return false;

      if (startFilter) {
        const startDate = new Date(`${startFilter}T00:00`);
        if (appointmentDate < startDate) return false;
      }

      if (endFilter) {
        const endDate = new Date(`${endFilter}T23:59`);
        if (appointmentDate > endDate) return false;
      }

      return true;
    });
  }

  function sortAppointments(appointments) {
    return appointments
      .slice()
      .sort((a, b) => {
        const dateA = new Date(`${a.data || ''}T${a.hora || '00:00'}`);
        const dateB = new Date(`${b.data || ''}T${b.hora || '00:00'}`);
        return dateA - dateB;
      });
  }

  function updateStats(list) {
    const counters = {
      agendada: 0,
      confirmada: 0,
      realizada: 0,
      cancelada: 0,
    };

    list.forEach((item) => {
      const status = item.status || 'agendada';
      if (counters[status] !== undefined) {
        counters[status] += 1;
      }
    });

    const statAgendadas = document.getElementById('statAgendadas');
    const statConfirmadas = document.getElementById('statConfirmadas');
    const statRealizadas = document.getElementById('statRealizadas');
    const statCanceladas = document.getElementById('statCanceladas');

    if (statAgendadas) statAgendadas.textContent = counters.agendada.toString();
    if (statConfirmadas) statConfirmadas.textContent = counters.confirmada.toString();
    if (statRealizadas) statRealizadas.textContent = counters.realizada.toString();
    if (statCanceladas) statCanceladas.textContent = counters.cancelada.toString();
  }

  function renderAppointments() {
    const lista = document.getElementById('listaAgendamentos');
    const emptyState = document.getElementById('semAgendamentos');
    const loading = document.getElementById('loadingAgendamentos');

    if (!lista) return;

    if (loading) loading.style.display = 'flex';
    lista.innerHTML = '';

    const allAppointments = sortAppointments(loadAppointments());
    const filtered = applyFilters(allAppointments);

    updateStats(filtered);

    if (filtered.length === 0) {
      if (loading) loading.style.display = 'none';
      lista.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    lista.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((appointment) => {
      const card = document.createElement('div');
      card.className = 'agendamento-card';

      const status = appointment.status || 'agendada';
      const formattedDate = formatDate(appointment.data);
      const formattedTime = formatTime(appointment.hora);

      const metaParts = [];
      if (formattedDate) {
        metaParts.push(`<span><i class="fas fa-calendar"></i>${formattedDate}</span>`);
      }
      if (formattedTime) {
        metaParts.push(`<span><i class="fas fa-clock"></i>${formattedTime}</span>`);
      }
      if (appointment.duracao) {
        metaParts.push(`<span><i class="fas fa-hourglass-half"></i>${appointment.duracao} min</span>`);
      }
      if (appointment.tipo) {
        const tipoLabel = appointment.tipo === 'online'
          ? 'Teleconsulta'
          : appointment.tipo === 'domiciliar'
            ? 'Visita domiciliar'
            : 'Presencial';
        metaParts.push(`<span><i class="fas fa-stethoscope"></i>${tipoLabel}</span>`);
      }
      if (appointment.local && appointment.tipo !== 'online') {
        metaParts.push(`<span><i class="fas fa-map-marker-alt"></i>${escapeHTML(appointment.local)}</span>`);
      }
      if (appointment.observacoesPaciente) {
        metaParts.push(`<span><i class="fas fa-user-nurse"></i>${escapeHTML(appointment.observacoesPaciente)}</span>`);
      }

      const motivo = appointment.motivo ? `<p class="card-notes">${escapeHTML(appointment.motivo)}</p>` : '';
      const observacoes = appointment.observacoes
        ? `<p class="card-notes secondary">${escapeHTML(appointment.observacoes)}</p>`
        : '';

      card.innerHTML = `
        <div class="card-main">
          <div class="card-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="card-info">
            <div class="card-title">${escapeHTML(appointment.paciente)}</div>
            <div class="card-meta">
              ${metaParts.join('')}
            </div>
            ${motivo}
            ${observacoes}
          </div>
        </div>
        <div class="card-actions">
          <span class="chip-status ${status}">${STATUS_LABEL[status] || status}</span>
        </div>
      `;

      lista.appendChild(card);

      card.setAttribute('tabindex', '0');
      card.addEventListener('dblclick', () => openDetailsModal(appointment));
      card.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          openDetailsModal(appointment);
        }
      });
    });

    if (loading) loading.style.display = 'none';
  }

  let appointmentInModal = null;

  function openDetailsModal(appointment) {
    const modal = document.getElementById('modalDetalhes');
    const content = document.getElementById('detalhesConteudo');
    const cancelarBtn = document.getElementById('cancelarAgendamentoBtn');
    const reagendarBtn = document.getElementById('reagendarAgendamentoBtn');
    if (!modal || !content) return;

    appointmentInModal = appointment;

    const status = appointment.status || 'agendada';
    const dataFormatada = formatDateLong(appointment.data);
    const horaFormatada = formatTime(appointment.hora);

    const infoBasica = `
      <div class="detalhe-bloco">
        <h3>Informações gerais</h3>
        <div class="detalhe-item">
          <i class="fas fa-user"></i>
          <span><strong>Paciente:</strong> ${escapeHTML(appointment.paciente)}</span>
        </div>
        ${appointment.contato ? `<div class="detalhe-item"><i class="fas fa-phone"></i><span><strong>Contato:</strong> ${escapeHTML(appointment.contato)}</span></div>` : ''}
        ${
          appointment.observacoesPaciente
            ? `<div class="detalhe-item"><i class="fas fa-notes-medical"></i><span><strong>Informações do prontuário:</strong> ${escapeHTML(appointment.observacoesPaciente)}</span></div>`
            : ''
        }
        <div class="detalhe-item">
          <i class="fas fa-calendar"></i>
          <span><strong>Data:</strong> ${dataFormatada || 'Não informada'}</span>
        </div>
        <div class="detalhe-item">
          <i class="fas fa-clock"></i>
          <span><strong>Horário:</strong> ${horaFormatada || 'Não informado'}</span>
        </div>
        ${appointment.duracao ? `<div class="detalhe-item"><i class="fas fa-hourglass-half"></i><span><strong>Duração:</strong> ${appointment.duracao} minutos</span></div>` : ''}
        <div class="detalhe-item">
          <i class="fas fa-info-circle"></i>
          <span><strong>Status:</strong> ${STATUS_LABEL[status] || status}</span>
        </div>
      </div>
    `;

    const infoAtendimento = `
      <div class="detalhe-bloco">
        <h3>Detalhes do atendimento</h3>
        <div class="detalhe-item">
          <i class="fas fa-stethoscope"></i>
          <span><strong>Tipo:</strong> ${
            appointment.tipo === 'online'
              ? 'Teleconsulta'
              : appointment.tipo === 'domiciliar'
                ? 'Visita domiciliar'
                : 'Presencial'
          }</span>
        </div>
        ${
          appointment.local && appointment.tipo !== 'online'
            ? `<div class="detalhe-item"><i class="fas fa-map-marker-alt"></i><span><strong>Local:</strong> ${escapeHTML(appointment.local)}</span></div>`
            : ''
        }
      </div>
    `;

    const detalhesClinicos = `
      <div class="detalhe-bloco">
        <h3>Motivo da consulta</h3>
        <p>${escapeHTML(appointment.motivo || 'Não informado')}</p>
      </div>
      ${
        appointment.observacoes
          ? `<div class="detalhe-bloco">
              <h3>Observações adicionais</h3>
              <p>${escapeHTML(appointment.observacoes)}</p>
            </div>`
          : ''
      }
    `;

    content.innerHTML = infoBasica + infoAtendimento + detalhesClinicos;

    if (reagendarBtn) {
      reagendarBtn.style.display = status === 'cancelada' ? 'inline-flex' : 'none';
    }
    if (cancelarBtn) {
      cancelarBtn.style.display = status === 'cancelada' ? 'none' : 'inline-flex';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeDetailsModal() {
    const modal = document.getElementById('modalDetalhes');
    const content = document.getElementById('detalhesConteudo');
    if (!modal || !content) return;

    modal.style.display = 'none';
    content.innerHTML = '';
    document.body.style.overflow = '';
    appointmentInModal = null;
  }

  function cancelCurrentAppointment() {
    if (!appointmentInModal) return;

    Swal.fire({
      title: 'Cancelar agendamento?',
      html: `
        <p>Tem certeza de que deseja cancelar o atendimento de <strong>${escapeHTML(appointmentInModal.paciente)}</strong>?</p>
        <p class="swal-subtext">Essa ação pode ser desfeita apenas editando o agendamento novamente.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Manter agendamento',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const agendamentos = loadAppointments().map((item) => {
        if (item.id === appointmentInModal.id) {
          return { ...item, status: 'cancelada', updatedAt: new Date().toISOString() };
        }
        return item;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(agendamentos));
      closeDetailsModal();
      renderAppointments();

      Swal.fire({
        icon: 'success',
        title: 'Agendamento cancelado',
        text: 'O paciente foi notificado do cancelamento.',
        confirmButtonColor: '#00324a',
      });
    });
  }

  function setupModalEvents() {
    const modal = document.getElementById('modalDetalhes');
    const fecharIcone = document.getElementById('fecharModalDetalhes');
    const fecharBtn = document.getElementById('fecharDetalhesBtn');
    const cancelarBtn = document.getElementById('cancelarAgendamentoBtn');
    const reagendarBtn = document.getElementById('reagendarAgendamentoBtn');

    if (fecharIcone) {
      fecharIcone.addEventListener('click', closeDetailsModal);
    }

    if (fecharBtn) {
      fecharBtn.addEventListener('click', closeDetailsModal);
    }

    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeDetailsModal();
        }
      });
    }

    if (cancelarBtn) {
      cancelarBtn.addEventListener('click', cancelCurrentAppointment);
    }

    if (reagendarBtn) {
      reagendarBtn.addEventListener('click', () => {
        if (!appointmentInModal) return;
        Swal.fire({
          title: 'Reagendar consulta?',
          text: 'O status retornará para Agendada e o paciente será avisado.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#00324a',
          cancelButtonColor: '#94a3b8',
          confirmButtonText: 'Sim, reagendar',
          cancelButtonText: 'Cancelar',
        }).then((result) => {
          if (!result.isConfirmed) return;

          const agendamentos = loadAppointments().map((item) => {
            if (item.id === appointmentInModal.id) {
              return { ...item, status: 'agendada', updatedAt: new Date().toISOString() };
            }
            return item;
          });

          localStorage.setItem(STORAGE_KEY, JSON.stringify(agendamentos));
          closeDetailsModal();
          renderAppointments();

          Swal.fire({
            icon: 'success',
            title: 'Consulta reagendada',
            text: 'O agendamento voltou para o status Agendada.',
            confirmButtonColor: '#00324a',
          });
        });
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDetailsModal();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFilters(renderAppointments);
    setupModalEvents();
    renderAppointments();
  });
})();

