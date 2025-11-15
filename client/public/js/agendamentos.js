(function () {
  const API_URL = window.API_URL || 'http://localhost:65432';
  const STATUS_LABEL = {
    agendada: 'Agendada',
    confirmada: 'Confirmada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    remarcada: 'Remarcada',
  };

  let appointmentsCache = [];
  let isFetchingAppointments = false;

  const getToken = () => localStorage.getItem('token');

  const ensureAuthenticated = () => {
    const token = getToken();
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Sessão expirada',
        text: 'Faça login novamente para acessar os agendamentos.',
        confirmButtonColor: '#002a42',
      }).then(() => {
        window.location.href = '/client/views/login.html';
      });
      return null;
    }
    return token;
  };

  const getAuthHeaders = (contentType = 'application/json') => {
    const token = getToken();
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const showToast = (message, icon = 'info') => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      console.log(message);
    }
  };

  const formatAddress = (endereco = {}) => {
    if (!endereco) return '';
    if (endereco.descricao) return endereco.descricao;
    const parts = [
      endereco.logradouro,
      endereco.numero,
      endereco.complemento,
      endereco.bairro,
      endereco.cidade,
      endereco.estado,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const toLocalDateValue = (date) => {
    if (!(date instanceof Date)) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalTimeValue = (date) => {
    if (!(date instanceof Date)) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const normalizeAppointment = (appointment) => {
    if (!appointment) return null;
    const dataHora = appointment.dataHora ? new Date(appointment.dataHora) : null;
    const dateString = dataHora ? toLocalDateValue(dataHora) : appointment.data || '';
    const timeString = dataHora ? toLocalTimeValue(dataHora) : appointment.hora || '';

    return {
      id: appointment._id || appointment.id,
      paciente:
        appointment.pacienteNome ||
        appointment.paciente?.nome ||
        appointment.paciente?.name ||
        appointment.pacienteId?.name ||
        appointment.pacienteId?.nome ||
        'Paciente não identificado',
      contato:
        appointment.pacienteTelefone ||
        appointment.paciente?.telefone ||
        appointment.paciente?.phone ||
        appointment.pacienteId?.phone ||
        '',
      observacoesPaciente:
        appointment.observacoesPaciente ||
        appointment.paciente?.observacoes ||
        appointment.pacienteId?.observacoes ||
        '',
      data: dateString,
      hora: timeString,
      duracao: appointment.duracao || 30,
      tipo: appointment.tipoConsulta || appointment.tipo || 'presencial',
      local: formatAddress(appointment.endereco) || appointment.local || '',
      motivo: appointment.motivoConsulta || appointment.motivo || '',
      observacoes: appointment.observacoes || '',
      status: appointment.status || 'agendada',
      raw: appointment,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const normalized = dateString.length === 10 ? `${dateString}T00:00:00` : dateString;
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(normalized));
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
      const normalized = dateString.length === 10 ? `${dateString}T00:00:00` : dateString;
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(normalized));
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

  const setLoadingState = (isLoading) => {
    const loading = document.getElementById('loadingAgendamentos');
    if (loading) {
      loading.style.display = isLoading ? 'flex' : 'none';
    }
  };

  const fetchAppointmentsFromApi = async () => {
    const token = ensureAuthenticated();
    if (!token) return;

    try {
      isFetchingAppointments = true;
      setLoadingState(true);
      const response = await fetch(`${API_URL}/api/agendamentos`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao carregar agendamentos');
      }

      const payload = await response.json();
      appointmentsCache = Array.isArray(payload.agendamentos)
        ? payload.agendamentos.map(normalizeAppointment).filter(Boolean)
        : [];
      renderAppointments();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Não foi possível carregar os agendamentos.', 'error');
    } finally {
      isFetchingAppointments = false;
      setLoadingState(false);
    }
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
      const normalizedStatus = status === 'remarcada' ? 'agendada' : status;
      if (counters[normalizedStatus] !== undefined) {
        counters[normalizedStatus] += 1;
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

    if (!lista) return;

    lista.innerHTML = '';

    const allAppointments = sortAppointments(appointmentsCache);
    const filtered = applyFilters(allAppointments);

    updateStats(filtered);

    if (filtered.length === 0) {
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
      const podeReagendar = ['agendada', 'confirmada', 'remarcada'].includes(status);
      reagendarBtn.style.display = podeReagendar ? 'inline-flex' : 'none';
    }
    if (cancelarBtn) {
      const podeCancelar = status !== 'cancelada' && status !== 'realizada';
      cancelarBtn.style.display = podeCancelar ? 'inline-flex' : 'none';
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

  async function cancelCurrentAppointment() {
    if (!appointmentInModal) return;

    const result = await Swal.fire({
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
    });

    if (!result.isConfirmed) return;

    const token = ensureAuthenticated();
    if (!token) return;

    try {
      setLoadingState(true);
      const response = await fetch(`${API_URL}/api/agendamentos/${appointmentInModal.id}/cancelar`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivoCancelamento: 'Cancelado via painel do médico' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Não foi possível cancelar o agendamento.');
      }

      closeDetailsModal();
      await fetchAppointmentsFromApi();

      Swal.fire({
        icon: 'success',
        title: 'Agendamento cancelado',
        text: 'O paciente foi notificado do cancelamento.',
        confirmButtonColor: '#002a42',
      });
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Erro ao cancelar agendamento.', 'error');
    } finally {
      setLoadingState(false);
    }
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
      reagendarBtn.addEventListener('click', async () => {
        if (!appointmentInModal) return;

        const { value: formValues } = await Swal.fire({
          title: 'Reagendar consulta',
          html: `
            <div style="display:flex;flex-direction:column;gap:8px;text-align:left">
              <label>Nova data</label>
              <input type="date" id="novaData" class="swal2-input" style="width: 100%" required>
              <label>Novo horário</label>
              <input type="time" id="novaHora" class="swal2-input" style="width: 100%" required>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Confirmar',
          confirmButtonColor: '#002a42',
          cancelButtonColor: '#94a3b8',
          preConfirm: () => {
            const novaData = document.getElementById('novaData').value;
            const novaHora = document.getElementById('novaHora').value;
            if (!novaData || !novaHora) {
              Swal.showValidationMessage('Informe a nova data e horário');
              return false;
            }
            return { novaData, novaHora };
          },
        });

        if (!formValues) return;

        const novaDataHora = new Date(`${formValues.novaData}T${formValues.novaHora}`);
        if (Number.isNaN(novaDataHora.getTime())) {
          showToast('Data ou horário inválidos.', 'error');
          return;
        }

        const token = ensureAuthenticated();
        if (!token) return;

        try {
          setLoadingState(true);
          const response = await fetch(`${API_URL}/api/agendamentos/${appointmentInModal.id}/remarcar`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ novaDataHora: novaDataHora.toISOString() }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Não foi possível remarcar a consulta.');
          }

          closeDetailsModal();
          await fetchAppointmentsFromApi();

          Swal.fire({
            icon: 'success',
            title: 'Consulta remarcada',
            text: 'O paciente será avisado sobre o novo horário.',
            confirmButtonColor: '#002a42',
          });
        } catch (error) {
          console.error(error);
          showToast(error.message || 'Erro ao remarcar a consulta.', 'error');
        } finally {
          setLoadingState(false);
        }
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
    fetchAppointmentsFromApi();
  });
})();

