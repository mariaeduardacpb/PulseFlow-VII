(function () {
  const API_URL = window.API_URL || 'http://localhost:65432';
  const STATUS_LABEL = {
    agendada: 'Agendada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    remarcada: 'Remarcada',
  };

  let appointmentsCache = [];
  let isFetchingAppointments = false;
  let isRenderingSemana = false;
  let isLoadingHorarios = false;

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

  const buildLocalDate = (dateString, timeString = '00:00') => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  };

  const dateToLocalISOString = (date) => {
    if (!(date instanceof Date)) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:00.000`;
  };

  const normalizeAppointment = (appointment) => {
    if (!appointment) return null;
    
    let dateString = '';
    let timeString = '';
    
    if (appointment.data && appointment.horaInicio) {
      let dataStr = '';
      if (typeof appointment.data === 'string') {
        dataStr = appointment.data;
      } else if (appointment.data.$date) {
        dataStr = appointment.data.$date;
      } else if (appointment.data instanceof Date) {
        const date = appointment.data;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      } else {
        dataStr = appointment.data.toString();
      }
      
      if (!dateString && dataStr) {
        if (dataStr.includes('T')) {
          const [datePart] = dataStr.split('T');
          if (datePart) {
            const [year, month, day] = datePart.split('-');
            if (year && month && day) {
              dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        } else if (dataStr.length === 10 && dataStr.includes('-')) {
          dateString = dataStr;
        }
      }
      
      if (appointment.horaInicio) {
        timeString = appointment.horaInicio.toString();
        if (timeString && !timeString.match(/^\d{2}:\d{2}$/)) {
          timeString = '';
        }
      }
    }
    
    if (!dateString || !timeString) {
      if (appointment.dataHora) {
        let dataHoraStr = '';
        
        if (typeof appointment.dataHora === 'string') {
          dataHoraStr = appointment.dataHora;
        } else if (appointment.dataHora.$date) {
          dataHoraStr = appointment.dataHora.$date;
        } else if (appointment.dataHora instanceof Date) {
          dataHoraStr = appointment.dataHora.toISOString();
        } else {
          dataHoraStr = appointment.dataHora.toString();
        }
        
        if (dataHoraStr.includes('T')) {
          const [datePart, timePart] = dataHoraStr.split('T');
          if (datePart && timePart) {
            const [year, month, day] = datePart.split('-');
            const timeOnly = timePart.split('.')[0].split('Z')[0].split('+')[0];
            const [hours, minutes] = timeOnly.split(':');
            
            if (year && month && day && hours !== undefined && minutes !== undefined) {
              dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
          }
        }
        
        if (!dateString || !timeString) {
          const dataHora = new Date(appointment.dataHora);
          if (!isNaN(dataHora.getTime())) {
            dateString = toLocalDateValue(dataHora);
            timeString = toLocalTimeValue(dataHora);
          }
        }
      }
    }
    
    if (!dateString) {
      dateString = appointment.data || '';
    }
    if (!timeString) {
      timeString = appointment.hora || '';
    }

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
      if (dateString.length === 10) {
        const date = buildLocalDate(dateString, '00:00');
        if (!date) return dateString;
        return new Intl.DateTimeFormat('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(date);
      } else {
        return new Intl.DateTimeFormat('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date(dateString));
      }
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
      if (dateString.length === 10) {
        const date = buildLocalDate(dateString, '00:00');
        if (!date) return dateString;
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
      } else {
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(dateString));
      }
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
    // Evitar chamadas simultâneas
    if (isFetchingAppointments) {
      return;
    }
    
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

    // Validação de datas: data início não pode ser maior que data fim
    const validateDates = () => {
      if (filtroDataInicio && filtroDataFim && filtroDataInicio.value && filtroDataFim.value) {
        const startDate = buildLocalDate(filtroDataInicio.value, '00:00');
        const endDate = buildLocalDate(filtroDataFim.value, '00:00');
        
        if (startDate && endDate && startDate > endDate) {
          showToast('A data de início não pode ser maior que a data de fim', 'warning');
          filtroDataFim.value = '';
          return false;
        }
      }
      return true;
    };


    if (filtroStatus) {
      filtroStatus.addEventListener('change', onChange);
    }

    if (filtroDataInicio) {
      filtroDataInicio.addEventListener('change', () => {
        if (validateDates()) {
          onChange();
        }
      });
    }

    if (filtroDataFim) {
      filtroDataFim.addEventListener('change', () => {
        if (validateDates()) {
          onChange();
        }
      });
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
      // Filtro por status
      const statusFilter = filtroStatus ? filtroStatus.value : '';
      if (statusFilter && (appointment.status || 'agendada') !== statusFilter) {
        return false;
      }

      // Filtro por data
      const startFilter = filtroDataInicio ? filtroDataInicio.value : '';
      const endFilter = filtroDataFim ? filtroDataFim.value : '';

      // Se não há filtro de data, mostra todos
      if (!startFilter && !endFilter) return true;

      // Obtém a data do agendamento
      const appointmentDate = appointment.data ? buildLocalDate(appointment.data, appointment.hora || '00:00') : null;
      if (!appointmentDate) return false;

      // Se apenas data de início foi selecionada, filtra a partir dessa data
      if (startFilter && !endFilter) {
        const startDate = buildLocalDate(startFilter, '00:00');
        if (appointmentDate < startDate) return false;
        return true;
      }

      // Se apenas data de fim foi selecionada, filtra até essa data
      if (!startFilter && endFilter) {
        const endDate = buildLocalDate(endFilter, '23:59');
        if (appointmentDate > endDate) return false;
        return true;
      }

      // Se ambas as datas foram selecionadas, filtra no intervalo
      if (startFilter && endFilter) {
        const startDate = buildLocalDate(startFilter, '00:00');
        const endDate = buildLocalDate(endFilter, '23:59');
        
        // Validação: data início não pode ser maior que data fim
        if (startDate > endDate) {
          return false;
        }
        
        if (appointmentDate < startDate || appointmentDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }

  function sortAppointments(appointments) {
    return appointments
      .slice()
      .sort((a, b) => {
        const dateA = buildLocalDate(a.data || '', a.hora || '00:00');
        const dateB = buildLocalDate(b.data || '', b.hora || '00:00');
        if (!dateA || !dateB) return 0;
        return dateA - dateB;
      });
  }

  function updateStats(list) {
    const counters = {
      agendada: 0,
      realizada: 0,
      cancelada: 0,
    };

    list.forEach((item) => {
      const status = item.status || 'agendada';
      const normalizedStatus = status === 'remarcada' ? 'agendada' : status;
      // Ignorar status 'confirmada' - não será mais exibido
      if (normalizedStatus === 'confirmada') {
        return;
      }
      if (counters[normalizedStatus] !== undefined) {
        counters[normalizedStatus] += 1;
      }
    });

    const statAgendadas = document.getElementById('statAgendadas');
    const statRealizadas = document.getElementById('statRealizadas');
    const statCanceladas = document.getElementById('statCanceladas');

    if (statAgendadas) statAgendadas.textContent = counters.agendada.toString();
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

    if (!appointment || !appointment.id) {
      showToast('Erro: Agendamento inválido.', 'error');
      return;
    }

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
      const podeReagendar = ['agendada', 'remarcada'].includes(status);
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
    if (!appointmentInModal) {
      showToast('Erro: Agendamento não encontrado.', 'error');
      return;
    }

    const agendamentoId = appointmentInModal.id || appointmentInModal._id || appointmentInModal.raw?._id;
    if (!agendamentoId) {
      showToast('Erro: ID do agendamento não encontrado.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Cancelar agendamento?',
      html: `
        <p>Tem certeza de que deseja cancelar o atendimento de <strong>${escapeHTML(appointmentInModal.paciente || 'o paciente')}</strong>?</p>
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
      const response = await fetch(`${API_URL}/api/agendamentos/${agendamentoId}/cancelar`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivoCancelamento: 'Cancelado via painel do médico' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Não foi possível cancelar o agendamento.');
      }

      await fetchAppointmentsFromApi();
      
      // Fechar o modal após o cancelamento bem-sucedido
      closeDetailsModal();

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
        if (!appointmentInModal) {
          showToast('Erro: Agendamento não encontrado.', 'error');
          return;
        }

        const agendamentoId = appointmentInModal.id || appointmentInModal._id;
        if (!agendamentoId) {
          showToast('Erro: ID do agendamento não encontrado.', 'error');
          return;
        }

        let medicoId = appointmentInModal.raw?.medicoId?._id || 
                        appointmentInModal.raw?.medicoId || 
                        appointmentInModal.raw?.medicoId?._id?.toString() ||
                        appointmentInModal.doctorId;
        
        if (!medicoId) {
          try {
            const token = ensureAuthenticated();
            if (!token) return;
            const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
              const perfil = await response.json();
              medicoId = perfil._id || perfil.id;
            }
          } catch (e) {
            console.error('Erro ao buscar perfil:', e);
          }
        }
        
        if (!medicoId) {
          showToast('Não foi possível identificar o médico.', 'error');
          return;
        }

        const medicoIdStr = typeof medicoId === 'object' && medicoId._id 
          ? medicoId._id.toString() 
          : medicoId.toString();

        let selectedDate = '';
        let selectedTime = '';
        let horariosDisponiveis = [];

        const loadHorarios = async (data) => {
          try {
            const url = `${API_URL}/api/horarios-disponibilidade/disponiveis/${medicoIdStr}?data=${data}`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error('Erro ao carregar horários');
            }
            const result = await response.json();
            return result.horariosDisponiveis || [];
          } catch (error) {
            console.error('Erro ao carregar horários:', error);
            return [];
          }
        };

        const updateHorariosDisplay = (horarios, currentSelectedTime) => {
          const horariosContainer = document.getElementById('horariosDisponiveisContainer');
          if (!horariosContainer) return;

          if (horarios.length === 0) {
            horariosContainer.innerHTML = `
              <div class="reagendar-empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Nenhum horário disponível para esta data</p>
                <span>Tente selecionar outra data</span>
              </div>
            `;
            return;
          }

          const horariosHTML = horarios.map(horario => {
            const isSelected = currentSelectedTime === horario.hora;
            return `
              <button 
                type="button" 
                class="horario-slot-btn ${isSelected ? 'horario-slot-btn-selected' : ''}" 
                data-hora="${horario.hora}"
              >
                ${horario.hora}
              </button>
            `;
          }).join('');

          horariosContainer.innerHTML = `
            <div class="reagendar-horarios-wrapper">
              <label class="reagendar-label">
                <i class="fas fa-clock"></i> Horários disponíveis (${horarios.length})
              </label>
              <div class="reagendar-horarios-grid">
                ${horariosHTML}
              </div>
            </div>
          `;

          document.querySelectorAll('.horario-slot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              selectedTime = btn.dataset.hora;
              updateHorariosDisplay(horariosDisponiveis, selectedTime);
            });
            btn.addEventListener('mouseenter', function() {
              if (this.dataset.hora !== selectedTime) {
                this.style.background = '#f1f5f9';
                this.style.borderColor = '#94a3b8';
              }
            });
            btn.addEventListener('mouseleave', function() {
              if (this.dataset.hora !== selectedTime) {
                this.style.background = '#ffffff';
                this.style.borderColor = '#cbd5e1';
              }
            });
          });
        };

        const { value: formValues } = await Swal.fire({
          title: 'Reagendar consulta',
          html: `
            <div class="reagendar-modal-content">
              <div class="reagendar-form-group">
                <label class="reagendar-label">
                  <i class="fas fa-calendar-alt"></i> Selecione a data
                </label>
                <input 
                  type="date" 
                  id="novaData" 
                  class="reagendar-input" 
                  required
                  min="${new Date().toISOString().split('T')[0]}"
                >
              </div>
              <div id="horariosDisponiveisContainer" class="reagendar-horarios-container">
                <div class="reagendar-empty-state">
                  <i class="fas fa-calendar-check"></i>
                  <p>Selecione uma data para ver os horários disponíveis</p>
                </div>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Confirmar',
          confirmButtonColor: 'var(--ag-primary)',
          cancelButtonColor: 'var(--ag-danger)',
          width: window.innerWidth > 1200 ? '900px' : window.innerWidth > 768 ? '85vw' : '95vw',
          padding: '0',
          customClass: {
            popup: 'swal2-popup-reagendar',
            container: 'swal2-container-reagendar',
            title: 'swal2-title-reagendar',
            htmlContainer: 'swal2-html-container-reagendar'
          },
          didOpen: () => {
            const dataInput = document.getElementById('novaData');
            if (dataInput) {
              dataInput.addEventListener('change', async (e) => {
                selectedDate = e.target.value;
                selectedTime = '';
                if (selectedDate) {
                  const container = document.getElementById('horariosDisponiveisContainer');
                  if (container) {
                    container.innerHTML = `
                      <div class="reagendar-loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando horários disponíveis...</p>
                      </div>
                    `;
                  }
                  horariosDisponiveis = await loadHorarios(selectedDate);
                  updateHorariosDisplay(horariosDisponiveis, selectedTime);
                }
              });
            }
          },
          preConfirm: () => {
            const novaData = document.getElementById('novaData')?.value;
            if (!novaData) {
              Swal.showValidationMessage('Selecione uma data');
              return false;
            }
            if (!selectedTime) {
              Swal.showValidationMessage('Selecione um horário disponível');
              return false;
            }
            return { novaData, novaHora: selectedTime };
          },
        });

        if (!formValues) return;

        const novaDataHora = buildLocalDate(formValues.novaData, formValues.novaHora);
        if (!novaDataHora || Number.isNaN(novaDataHora.getTime())) {
          showToast('Data ou horário inválidos.', 'error');
          return;
        }

        const token = ensureAuthenticated();
        if (!token) return;

        try {
          setLoadingState(true);
          const isoString = dateToLocalISOString(novaDataHora);
          if (!isoString) {
            showToast('Erro ao processar data e horário.', 'error');
            return;
          }
          const response = await fetch(`${API_URL}/api/agendamentos/${agendamentoId}/remarcar`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ novaDataHora: isoString }),
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

  // ========== GERENCIAMENTO DE HORÁRIOS ==========
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diasSemanaAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  let horarios = [];
  let semanaAtual = 0; // 0 = semana atual, 1 = próxima semana, etc.
  let modoSelecaoMultipla = false;
  let horariosSelecionados = new Set();
  let filtroAgendamentos = 'todos'; // 'todos', 'agendados', 'livres'

  // Função para gerar slots de horários automaticamente
  function gerarSlotsHorarios(horaInicio, horaFim, duracao, almocoInicio = null, almocoFim = null) {
    const slots = [];
    
    // Converter horários para minutos
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [fimH, fimM] = horaFim.split(':').map(Number);
    
    let horaAtual = inicioH;
    let minutoAtual = inicioM;
    const inicioTotal = inicioH * 60 + inicioM;
    const fimTotal = fimH * 60 + fimM;
    
    // Converter intervalo de almoço para minutos
    let almocoInicioMin = null;
    let almocoFimMin = null;
    if (almocoInicio && almocoFim) {
      const [almocoInicioH, almocoInicioM] = almocoInicio.split(':').map(Number);
      const [almocoFimH, almocoFimM] = almocoFim.split(':').map(Number);
      almocoInicioMin = almocoInicioH * 60 + almocoInicioM;
      almocoFimMin = almocoFimH * 60 + almocoFimM;
    }

    let tempoAtual = inicioTotal;

    while (tempoAtual + duracao <= fimTotal) {
      const slotFim = tempoAtual + duracao;
      
      // Verificar se o slot não está no intervalo de almoço
      let slotValido = true;
      
      if (almocoInicioMin && almocoFimMin) {
        // Slot está no intervalo de almoço se:
        // - O início do slot está dentro do intervalo de almoço, OU
        // - O fim do slot está dentro do intervalo de almoço, OU
        // - O slot cobre completamente o intervalo de almoço
        if ((tempoAtual >= almocoInicioMin && tempoAtual < almocoFimMin) ||
            (slotFim > almocoInicioMin && slotFim <= almocoFimMin) ||
            (tempoAtual < almocoInicioMin && slotFim > almocoFimMin)) {
          slotValido = false;
        }
      }
      
      if (slotValido) {
        const horaInicioH = Math.floor(tempoAtual / 60);
        const horaInicioM = tempoAtual % 60;
        const horaFimH = Math.floor(slotFim / 60);
        const horaFimM = slotFim % 60;
        
        const horaInicioStr = `${String(horaInicioH).padStart(2, '0')}:${String(horaInicioM).padStart(2, '0')}`;
        const horaFimStr = `${String(horaFimH).padStart(2, '0')}:${String(horaFimM).padStart(2, '0')}`;
        
        slots.push({
          inicio: horaInicioStr,
          fim: horaFimStr
        });
      }
      
      // Avançar para o próximo slot
      tempoAtual += duracao;
      
      // Se o próximo slot começaria no intervalo de almoço, pular para depois do almoço
      if (almocoInicioMin && almocoFimMin && tempoAtual >= almocoInicioMin && tempoAtual < almocoFimMin) {
        tempoAtual = almocoFimMin;
      }
    }

    return slots;
  }

  // Atualizar info do período
  function updatePeriodoInfo() {
    const periodoSemanasEl = document.getElementById('periodoSemanas');
    const periodoInfoEl = document.getElementById('periodoInfo');
    
    if (!periodoSemanasEl || !periodoInfoEl) return;
    
    const valor = periodoSemanasEl.value;
    let texto = '';
    
    if (valor === 'indefinido') {
      texto = 'Os horários serão criados como recorrentes (sem data de término)';
    } else {
      const semanas = parseInt(valor);
      texto = `Os horários serão criados para as próximas ${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    
    periodoInfoEl.textContent = texto;
  }

  // Atualizar preview dos horários
  function updatePreview() {
    try {
      const previewEl = document.getElementById('previewHorarios');
      if (!previewEl) {
        console.log('Preview element not found');
        return;
      }

      const horarioForm = document.getElementById('horarioForm');
      const horaInicioEl = document.getElementById('horaInicio');
      const horaFimEl = document.getElementById('horaFim');
      const duracaoEl = document.getElementById('duracaoConsulta');
      const almocoInicioEl = document.getElementById('almocoInicio');
      const almocoFimEl = document.getElementById('almocoFim');
      const periodoSemanasEl = document.getElementById('periodoSemanas');

      if (!horaInicioEl || !horaFimEl || !duracaoEl) {
        previewEl.innerHTML = '<p class="preview-placeholder">Aguardando configuração...</p>';
        return;
      }

      // Verificar se é para um dia específico
      const diaEspecifico = horarioForm?.dataset.diaEspecifico;
      const dataEspecifica = horarioForm?.dataset.dataEspecifica;
      const isDiaEspecifico = diaEspecifico !== undefined && diaEspecifico !== '' && dataEspecifica !== undefined && dataEspecifica !== '';

      const horaInicio = horaInicioEl.value;
      const horaFim = horaFimEl.value;
      const duracao = parseInt(duracaoEl.value || '30');
      const semAlmoco = document.getElementById('semAlmoco')?.checked || false;
      const almocoInicio = semAlmoco ? null : (almocoInicioEl?.value || null);
      const almocoFim = semAlmoco ? null : (almocoFimEl?.value || null);
      
      // Para dia específico, usar 1 dia. Caso contrário, contar os checkboxes selecionados
      let diasSelecionados;
      if (isDiaEspecifico) {
        diasSelecionados = 1;
      } else {
        diasSelecionados = Array.from(document.querySelectorAll('.dia-select:checked')).length;
      }
      
      const periodoSemanas = periodoSemanasEl?.value || '2';
      const isIndefinido = periodoSemanas === 'indefinido';
      const numSemanas = isIndefinido ? 1 : parseInt(periodoSemanas);

      if (!horaInicio || !horaFim) {
        previewEl.innerHTML = '<p class="preview-placeholder">Configure os horários de início e fim</p>';
        return;
      }

      if (!isDiaEspecifico && diasSelecionados === 0) {
        previewEl.innerHTML = '<p class="preview-placeholder">Selecione pelo menos um dia da semana</p>';
        return;
      }

      if (horaFim <= horaInicio) {
        previewEl.innerHTML = '<p class="preview-placeholder" style="color: var(--ag-danger);">Hora de fim deve ser maior que hora de início</p>';
        return;
      }

      const slots = gerarSlotsHorarios(horaInicio, horaFim, duracao, almocoInicio, almocoFim);
      
      if (slots.length === 0) {
        previewEl.innerHTML = '<p class="preview-placeholder">Nenhum horário será gerado com essas configurações. Verifique o intervalo de almoço.</p>';
        return;
      }

      // Para dia específico, sempre criar apenas para 1 dia e 1 semana
      let totalHorarios, periodoTexto;
      if (isDiaEspecifico) {
        totalHorarios = slots.length; // Apenas os slots para aquele dia específico
        // Formatar data específica para exibição
        let dataFormatada = dataEspecifica;
        try {
          const dataAlvo = buildLocalDate(dataEspecifica, '00:00');
          if (dataAlvo) {
            dataFormatada = dataAlvo.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            dataFormatada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
          }
        } catch (e) {
          console.error('Erro ao formatar data:', e);
        }
        periodoTexto = `para ${dataFormatada}`;
      } else {
        totalHorarios = isIndefinido 
          ? slots.length * diasSelecionados 
          : slots.length * diasSelecionados * numSemanas;
        periodoTexto = isIndefinido 
          ? 'horários recorrentes' 
          : `${numSemanas} semana${numSemanas > 1 ? 's' : ''}`;
      }
      
      let html = `<div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--ag-border);">
        <p style="margin: 0 0 4px 0; font-size: 1rem; font-weight: 700; color: var(--ag-text);">
          ${totalHorarios} horário${totalHorarios > 1 ? 's serão criados' : ' será criado'}
        </p>
        <p style="margin: 0; font-size: 0.85rem; color: var(--ag-muted);">
          ${isDiaEspecifico 
            ? `${slots.length} horário${slots.length > 1 ? 's' : ''} ${periodoTexto}`
            : `${slots.length} horários por dia × ${diasSelecionados} ${diasSelecionados === 1 ? 'dia' : 'dias'} × ${periodoTexto}`
          }
        </p>
      </div>`;
      
      html += '<div class="preview-list">';
      slots.forEach(slot => {
        html += `<span class="preview-item">${slot.inicio} - ${slot.fim}</span>`;
      });
      html += '</div>';

      previewEl.innerHTML = html;
    } catch (error) {
      console.error('Erro ao atualizar preview:', error);
    }
  }

  // Função para alternar entre abas
  function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const novoAgendamentoBtn = document.getElementById('novoAgendamentoBtn');
    const addHorarioBtn = document.getElementById('addHorarioBtn');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Atualizar botões ativos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Atualizar conteúdo visível
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`tab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`).classList.add('active');

        // Mostrar/ocultar botões do header
        if (targetTab === 'agendamentos') {
          if (novoAgendamentoBtn) novoAgendamentoBtn.style.display = 'flex';
          if (addHorarioBtn) addHorarioBtn.style.display = 'none';
        } else {
          if (novoAgendamentoBtn) novoAgendamentoBtn.style.display = 'none';
          if (addHorarioBtn) addHorarioBtn.style.display = 'flex';
        }
      });
    });
  }

  // Carregar horários
  async function loadHorarios() {
    // Evitar chamadas simultâneas
    if (isLoadingHorarios) {
      return;
    }
    
    isLoadingHorarios = true;
    
    const loadingEl = document.getElementById('loadingHorarios');
    const listEl = document.getElementById('horariosList');
    const emptyStateEl = document.getElementById('emptyStateHorarios');

    try {
      if (loadingEl) loadingEl.style.display = 'block';
      if (listEl) listEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando horários...</div>';

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
      if (listEl) listEl.innerHTML = `<div class="error">${error.message}</div>`;
      showToast(error.message, 'error');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      isLoadingHorarios = false;
    }
  }

  // Renderizar visualização semanal
  function renderSemanaView() {
    // Evitar chamadas recursivas que causam loop infinito
    if (isRenderingSemana) {
      return;
    }
    
    isRenderingSemana = true;
    
    const semanaGrid = document.getElementById('semanaGrid');
    const emptyStateEl = document.getElementById('emptyStateHorarios');
    const semanaPeriodoEl = document.getElementById('semanaPeriodo');

    if (!semanaGrid) {
      isRenderingSemana = false;
      return;
    }

    // Calcular data inicial da semana atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diaAtual = hoje.getDay();
    const diasParaSegunda = (diaAtual === 0 ? -6 : 1) - diaAtual; // Segunda-feira = 1
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() + diasParaSegunda + (semanaAtual * 7));
    
    // Atualizar texto do período
    if (semanaPeriodoEl) {
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
      const textoPeriodo = semanaAtual === 0 
        ? `Esta semana (${formatoData.format(inicioSemana)} - ${formatoData.format(fimSemana)})`
        : `${formatoData.format(inicioSemana)} - ${formatoData.format(fimSemana)}`;
      semanaPeriodoEl.textContent = textoPeriodo;
    }

    // Sempre mostrar apenas horários ativos
    const horariosFiltrados = horarios.filter(h => h.ativo);

    // Agrupar por dia da semana e data
    const horariosPorDia = {};
    const ordemDias = [1, 2, 3, 4, 5, 6, 0]; // Segunda a Domingo

    ordemDias.forEach(dia => {
      horariosPorDia[dia] = [];
      
      // Buscar horários recorrentes para este dia
      horariosFiltrados.forEach(horario => {
        if (horario.diaSemana === dia && (!horario.tipo || horario.tipo === 'recorrente')) {
          horariosPorDia[dia].push(horario);
        }
      });
      
      // Buscar horários específicos para as datas desta semana
      for (let i = 0; i < 7; i++) {
        const dataDia = new Date(inicioSemana);
        dataDia.setDate(inicioSemana.getDate() + i);
        
        if (dataDia.getDay() === dia) {
          horariosFiltrados.forEach(horario => {
            if (horario.dataEspecifica) {
              const dataHorario = new Date(horario.dataEspecifica);
              dataHorario.setHours(0, 0, 0, 0);
              dataDia.setHours(0, 0, 0, 0);
              
              if (dataHorario.getTime() === dataDia.getTime()) {
                horariosPorDia[dia].push(horario);
              }
            }
          });
        }
      }
      
      // Ordenar horários do dia
      horariosPorDia[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });

    // Renderizar grid semanal
    let html = '';

    ordemDias.forEach(dia => {
      const horariosDia = horariosPorDia[dia] || [];
      const temHorario = horariosDia.length > 0;
      
      // Calcular data do dia
      const dataDia = new Date(inicioSemana);
      const offsetDia = (dia === 0 ? 6 : dia - 1); // Ajuste para começar na segunda
      dataDia.setDate(inicioSemana.getDate() + offsetDia);
      
      // Filtrar horários baseado no filtro de agendamentos
      const horariosDiaFiltrados = horariosDia.filter(horario => {
        const agendamentos = getAgendamentosDoHorario(horario, dataDia);
        const temAgendamentos = agendamentos.length > 0;
        
        // Aplicar filtro
        if (filtroAgendamentos === 'agendados' && !temAgendamentos) {
          return false;
        }
        if (filtroAgendamentos === 'livres' && temAgendamentos) {
          return false;
        }
        return true;
      });
      
      // Não renderizar card do dia se não houver horários visíveis após o filtro (exceto se filtro for "todos")
      if (filtroAgendamentos !== 'todos' && horariosDiaFiltrados.length === 0) {
        return;
      }
      
      const diaNumero = dataDia.getDate();
      const mesAbrev = dataDia.toLocaleDateString('pt-BR', { month: 'short' });
      const isHoje = dataDia.toDateString() === hoje.toDateString();
      
      // Verificar se todos estão selecionados
      const todosSelecionados = horariosDiaFiltrados.length > 0 && horariosDiaFiltrados.every(h => horariosSelecionados.has(h._id));
      
      html += `
        <div class="dia-card ${!temHorario ? 'sem-horario' : ''} ${isHoje ? 'dia-hoje' : ''}" data-dia="${dia}" data-data-dia="${toLocalDateValue(dataDia)}">
          <div class="dia-card-header">
            <div>
              <strong>${diasSemanaAbrev[dia]}</strong>
              <span class="dia-data">${diaNumero} ${mesAbrev}</span>
            </div>
            <div class="dia-header-actions">
              ${modoSelecaoMultipla && horariosDiaFiltrados.length > 0 ? `
                <button class="btn-selecionar-todos-dia ${todosSelecionados ? 'todos-selecionados' : ''}" 
                        data-dia="${dia}" 
                        data-data-dia="${toLocalDateValue(dataDia)}"
                        title="${todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}">
                  <i class="fas ${todosSelecionados ? 'fa-check-square' : 'fa-square'}"></i>
                  <span>${todosSelecionados ? 'Desmarcar' : 'Selecionar todos'}</span>
                </button>
              ` : ''}
              ${isHoje ? '<span class="badge-hoje">Hoje</span>' : ''}
            </div>
          </div>
          <div class="dia-horarios">
            ${horariosDiaFiltrados.map(horario => {
              const isSelecionado = horariosSelecionados.has(horario._id);
              
              // Buscar agendamentos para este horário
              const agendamentos = getAgendamentosDoHorario(horario, dataDia);
              const temAgendamentos = agendamentos.length > 0;
              
              // Armazenar dados dos agendamentos
              const agendamentosData = temAgendamentos ? JSON.stringify(agendamentos.map(apt => ({
                id: apt.id,
                paciente: apt.paciente || 'Paciente',
                contato: apt.contato || 'Não informado',
                data: apt.data,
                hora: apt.hora,
                status: apt.status
              }))) : '';
              
              // Tooltip
              let tooltipText = '';
              if (temAgendamentos) {
                const pacientes = agendamentos.map(apt => apt.paciente || 'Paciente').join(', ');
                tooltipText = `Agendado: ${pacientes}`;
              }
              
              return `
              <div class="horario-item ${!horario.ativo ? 'inactive' : ''} ${isSelecionado ? 'selecionado' : ''} ${temAgendamentos ? 'tem-agendamento' : ''}" 
                   data-id="${horario._id}" 
                   data-agendamentos='${agendamentosData}'
                   data-data-dia="${toLocalDateValue(dataDia)}"
                   title="${tooltipText}"
                   style="${temAgendamentos ? 'cursor: pointer;' : ''}">
                ${modoSelecaoMultipla ? `
                  <label class="horario-checkbox">
                    <input type="checkbox" class="checkbox-horario" value="${horario._id}" ${isSelecionado ? 'checked' : ''}>
                    <span class="checkbox-custom"></span>
                  </label>
                ` : ''}
                <div class="horario-content">
                  <span class="horario-time">${horario.horaInicio} - ${horario.horaFim}</span>
                  ${temAgendamentos ? `<span class="badge-agendado" title="${tooltipText}"><i class="fas fa-user-check"></i> ${agendamentos.length}</span>` : ''}
                  ${!horario.ativo ? '<span class="badge-cancelado">Cancelado</span>' : ''}
                </div>
                ${!modoSelecaoMultipla ? `
                <div class="horario-item-actions">
                  ${horario.ativo ? `
                    <button class="btn-cancelar-horario" title="Cancelar horário" data-id="${horario._id}">
                      <i class="fas fa-ban"></i>
                    </button>
                  ` : `
                    <button class="btn-reativar-horario" title="Reativar horário" data-id="${horario._id}">
                      <i class="fas fa-check"></i>
                    </button>
                  `}
                </div>
                ` : ''}
              </div>
            `}).join('')}
          </div>
          <div class="dia-card-actions">
            <button class="btn-add-horario" data-dia="${dia}" data-data="${toLocalDateValue(dataDia)}">
              <i class="fas fa-plus"></i> ${temHorario ? 'Adicionar' : 'Definir Horário'}
            </button>
          </div>
        </div>
      `;
    });

    semanaGrid.innerHTML = html;

    // Atualizar botões de filtro ativos
    const filtroButtons = document.querySelectorAll('.filtro-btn');
    filtroButtons.forEach(btn => {
      const filtro = btn.dataset.filtro;
      if (filtro === filtroAgendamentos) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Configurar eventos dos cards
    setupDiaCardEvents();
    
    // Não carregar agendamentos aqui - isso deve ser feito apenas uma vez no início
    // Os agendamentos já devem estar no cache quando esta função é chamada
    isRenderingSemana = false;
    
    // Verificar se há horários visíveis após aplicar filtro
    const horariosVisiveis = semanaGrid.querySelectorAll('.horario-item').length;
    
    // Mostrar botão de seleção múltipla se houver horários visíveis
    const toggleBtn = document.getElementById('toggleSelecaoMultipla');
    if (toggleBtn && horariosVisiveis > 0) {
      toggleBtn.style.display = 'inline-flex';
    } else if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }

    // Mostrar/ocultar empty state baseado nos horários filtrados
    if (horariosFiltrados.length === 0) {
      // Nenhum horário cadastrado
      if (emptyStateEl) {
        emptyStateEl.innerHTML = `
          <div class="empty-state-content">
            <div class="empty-state-illustration">
              <div class="empty-state-icon-large">
                <i class="fas fa-calendar-times"></i>
              </div>
              <div class="empty-state-decorative">
                <div class="empty-state-dot dot-1"></div>
                <div class="empty-state-dot dot-2"></div>
                <div class="empty-state-dot dot-3"></div>
              </div>
            </div>
            <div class="empty-state-text">
              <h3>Nenhum horário cadastrado</h3>
              <p>Configure seus horários de disponibilidade para começar a receber agendamentos. Você pode criar horários recorrentes ou específicos para datas específicas.</p>
            </div>
            <div class="empty-state-actions">
              <button class="btn-primary" onclick="document.getElementById('configurarHorariosBtn').click()">
                <i class="fas fa-cog"></i> Configurar Horários
              </button>
            </div>
          </div>
        `;
        emptyStateEl.style.display = 'flex';
        emptyStateEl.classList.remove('empty-state-filtered');
      }
      if (semanaGrid) semanaGrid.style.display = 'none';
    } else if (horariosVisiveis === 0) {
      // Não há horários visíveis devido ao filtro
      if (emptyStateEl) {
        const filtroTexto = filtroAgendamentos === 'agendados' ? 'com agendamentos' : filtroAgendamentos === 'livres' ? 'livres (sem agendamentos)' : 'disponíveis';
        const filtroIcon = filtroAgendamentos === 'agendados' ? 'fa-calendar-check' : filtroAgendamentos === 'livres' ? 'fa-calendar-times' : 'fa-calendar';
        const filtroTitulo = filtroAgendamentos === 'agendados' ? 'Nenhum horário agendado' : filtroAgendamentos === 'livres' ? 'Nenhum horário livre' : 'Nenhum horário encontrado';
        const filtroDescricao = filtroAgendamentos === 'agendados' 
          ? 'Não há horários com agendamentos para esta semana. Tente navegar para outra semana ou verificar os horários livres.'
          : filtroAgendamentos === 'livres'
          ? 'Não há horários livres (sem agendamentos) para esta semana. Todos os horários disponíveis já foram agendados.'
          : 'Não há horários disponíveis para esta semana. Tente alterar o filtro ou navegar para outra semana.';
        
        emptyStateEl.innerHTML = `
          <div class="empty-state-content">
            <div class="empty-state-illustration">
              <div class="empty-state-icon-large">
                <i class="fas ${filtroIcon}"></i>
              </div>
              <div class="empty-state-decorative">
                <div class="empty-state-dot dot-1"></div>
                <div class="empty-state-dot dot-2"></div>
                <div class="empty-state-dot dot-3"></div>
              </div>
            </div>
            <div class="empty-state-text">
              <h3>${filtroTitulo}</h3>
              <p>${filtroDescricao}</p>
            </div>
          </div>
        `;
        emptyStateEl.style.display = 'flex';
        emptyStateEl.classList.add('empty-state-filtered');
      }
      if (semanaGrid) semanaGrid.style.display = 'none';
    } else {
      // Há horários visíveis
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      if (semanaGrid) semanaGrid.style.display = 'grid';
    }
    
    // Resetar flag ao final da renderização
    isRenderingSemana = false;
  }

  // Configurar eventos dos cards de dia
  function setupDiaCardEvents() {
    // Event listeners para checkboxes de seleção múltipla
    document.querySelectorAll('.checkbox-horario').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = e.target.value;
        if (e.target.checked) {
          horariosSelecionados.add(id);
        } else {
          horariosSelecionados.delete(id);
        }
        atualizarContadorSelecionados();
        renderSemanaView();
      });
    });

    // Event listeners para adicionar horário
    document.querySelectorAll('.btn-add-horario').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.btn-add-horario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.target.closest('.btn-add-horario');
        const dia = parseInt(btnEl.dataset.dia);
        const dataStr = btnEl.dataset.data;
        console.log('Botão Definir Horário clicado:', { dia, dataStr, dataset: btnEl.dataset });
        openHorarioModal(dia, dataStr);
      });
    });

    // Event listeners para editar horário
    document.querySelectorAll('.btn-edit-dia').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.btn-edit-dia').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.horario-item').dataset.id;
        const horario = horarios.find(h => h._id === id);
        if (horario) {
          openEditarDiaModal(horario.diaSemana, horario);
        }
      });
    });

    // Event listeners para cancelar horário
    document.querySelectorAll('.btn-cancelar-horario').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.btn-cancelar-horario').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const horarioItem = e.target.closest('.horario-item');
        if (!horarioItem) return;
        
        const horarioId = horarioItem.dataset.id;
        const dataDia = horarioItem.dataset.dataDia;
        
        // Buscar o horário completo
        const horario = horarios.find(h => h._id === horarioId);
        if (!horario) return;
        
        // Verificar se há agendamentos para este horário
        const agendamentos = getAgendamentosDoHorario(horario, dataDia);
        
        if (agendamentos && agendamentos.length > 0) {
          // Se houver agendamentos, mostrar modal perguntando se quer cancelar o agendamento
          await mostrarModalCancelarAgendamento(agendamentos, dataDia, horario);
        } else {
          // Se não houver agendamentos, não fazer nada (a funcionalidade de cancelar horário foi removida)
          // O usuário deve usar o modo de seleção múltipla para excluir horários
          showToast('Este horário não possui agendamentos. Use o modo de seleção múltipla para excluir horários.', 'info');
        }
      });
    });

    // Event listeners para selecionar todos os horários do dia
    document.querySelectorAll('.btn-selecionar-todos-dia').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.btn-selecionar-todos-dia').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const dia = parseInt(btn.getAttribute('data-dia'));
        const dataDia = btn.getAttribute('data-data-dia');
        console.log('Clicou no botão selecionar todos:', { dia, dataDia, modoSelecaoMultipla, btn });
        if (dia !== null && dia !== undefined && !isNaN(dia) && dataDia) {
          selecionarTodosHorariosDoDia(dia, dataDia);
        } else {
          console.error('Dados do botão inválidos:', { dia, dataDia, btn });
          showToast('Erro: Dados do botão não encontrados', 'error');
        }
      });
    });

    // Event listeners para selecionar todos os horários do dia
    document.querySelectorAll('.btn-selecionar-todos-dia').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.btn-selecionar-todos-dia').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const dia = parseInt(btn.getAttribute('data-dia'));
        const dataDia = btn.getAttribute('data-data-dia');
        console.log('Clicou no botão selecionar todos:', { dia, dataDia, modoSelecaoMultipla, btn });
        if (dia !== null && dia !== undefined && !isNaN(dia) && dataDia) {
          selecionarTodosHorariosDoDia(dia, dataDia);
        } else {
          console.error('Dados do botão inválidos:', { dia, dataDia, btn });
          showToast('Erro: Dados do botão não encontrados', 'error');
        }
      });
    });

    // Event listeners para reativar horário
    document.querySelectorAll('.btn-reativar-horario').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.btn-reativar-horario').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.target.closest('.btn-reativar-horario').dataset.id;
        await reativarHorario(id);
      });
    });

    // Event listeners para clicar em horários com agendamento
    document.querySelectorAll('.horario-item.tem-agendamento').forEach(item => {
      item.addEventListener('click', (e) => {
        // Não abrir modal se clicar nos botões de ação ou checkbox
        if (e.target.closest('.horario-item-actions') || 
            e.target.closest('.horario-checkbox') || 
            e.target.closest('button') ||
            e.target.tagName === 'BUTTON') {
          return;
        }
        
        e.stopPropagation();
        
        const agendamentosData = item.dataset.agendamentos;
        const dataDia = item.dataset.dataDia;
        
        if (agendamentosData && dataDia) {
          try {
            const agendamentos = JSON.parse(agendamentosData);
            mostrarInformacoesPaciente(agendamentos, dataDia);
          } catch (err) {
            console.error('Erro ao parsear dados dos agendamentos:', err);
          }
        }
      });
    });
  }

  // Verificar se um horário tem agendamentos
  function getAgendamentosDoHorario(horario, dataDia) {
    const agendamentos = [];
    
    if (!appointmentsCache || appointmentsCache.length === 0) {
      return agendamentos;
    }

    // Determinar a data do horário
    let dataHorario;
    if (horario.dataEspecifica) {
      dataHorario = new Date(horario.dataEspecifica);
    } else {
      dataHorario = new Date(dataDia);
    }
    dataHorario.setHours(0, 0, 0, 0);

    // Buscar agendamentos que correspondem a este horário
    appointmentsCache.forEach(appointment => {
      if (!appointment) return;

      // Obter data do agendamento
      let appointmentDate = null;
      if (appointment.dataHora) {
        const dataHora = new Date(appointment.dataHora);
        if (!isNaN(dataHora.getTime())) {
          appointmentDate = new Date(dataHora);
        }
      } else if (appointment.data && appointment.hora) {
        appointmentDate = buildLocalDate(appointment.data, appointment.hora);
      } else if (appointment.data) {
        appointmentDate = buildLocalDate(appointment.data, appointment.hora || '00:00');
      }

      if (!appointmentDate) return;

      const appointmentDateOnly = new Date(appointmentDate);
      appointmentDateOnly.setHours(0, 0, 0, 0);

      // Verificar se é o mesmo dia
      if (appointmentDateOnly.getTime() !== dataHorario.getTime()) {
        return;
      }

      // Obter hora do agendamento
      let appointmentHora = appointment.hora;
      if (!appointmentHora && appointment.dataHora) {
        const dataHora = new Date(appointment.dataHora);
        appointmentHora = `${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`;
      }

      if (!appointmentHora || !appointmentHora.match(/^\d{2}:\d{2}$/)) return;

      // Verificar se o horário do agendamento corresponde ao slot
      const horaParts = appointmentHora.split(':').map(Number);
      if (horaParts.length !== 2 || isNaN(horaParts[0]) || isNaN(horaParts[1])) return;

      const [appointmentH, appointmentM] = horaParts;
      const [horarioInicioH, horarioInicioM] = horario.horaInicio.split(':').map(Number);
      const [horarioFimH, horarioFimM] = horario.horaFim.split(':').map(Number);

      if (isNaN(horarioInicioH) || isNaN(horarioInicioM) || isNaN(horarioFimH) || isNaN(horarioFimM)) return;

      const appointmentTimeMinutos = appointmentH * 60 + appointmentM;
      const horarioInicioMinutos = horarioInicioH * 60 + horarioInicioM;
      const horarioFimMinutos = horarioFimH * 60 + horarioFimM;

      // Verificar se o agendamento está dentro do intervalo do horário
      if (appointmentTimeMinutos >= horarioInicioMinutos && appointmentTimeMinutos < horarioFimMinutos) {
        // Verificar se o status não é cancelado
        if (!appointment.status || appointment.status !== 'cancelada') {
          agendamentos.push(appointment);
        }
      }
    });

    return agendamentos;
  }

  // Mostrar modal para cancelar agendamento quando clicar no botão de cancelar horário que tem agendamento
  async function mostrarModalCancelarAgendamento(agendamentos, dataDia, horario) {
    if (!agendamentos || agendamentos.length === 0) return;
    
    // Formatar data
    let dataFormatada;
    try {
      if (typeof dataDia === 'string') {
        const dataParts = dataDia.split('-');
        if (dataParts.length === 3) {
          dataFormatada = new Date(parseInt(dataParts[0]), parseInt(dataParts[1]) - 1, parseInt(dataParts[2])).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          dataFormatada = new Date(dataDia).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } else {
        dataFormatada = new Date(dataDia).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (err) {
      dataFormatada = dataDia || 'Data não informada';
    }
    
    const dataFormatadaCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
    
    // Criar mensagem do modal
    let mensagem;
    if (agendamentos.length === 1) {
      const apt = agendamentos[0];
      mensagem = `
        <p style="margin-bottom: 12px;">Este horário possui um agendamento:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid var(--ag-primary);">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: var(--ag-text);">
            <i class="fas fa-user" style="margin-right: 8px; color: var(--ag-primary);"></i>
            ${apt.paciente || 'Paciente'}
          </p>
          <p style="margin: 0; font-size: 0.9rem; color: var(--ag-muted);">
            ${dataFormatadaCapitalizada} às ${apt.hora || 'horário não informado'}
          </p>
        </div>
      `;
    } else {
      mensagem = `
        <p style="margin-bottom: 12px;">Este horário possui <strong>${agendamentos.length}</strong> agendamentos:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; max-height: 200px; overflow-y: auto; border-left: 4px solid var(--ag-primary);">
          ${agendamentos.map((apt, index) => `
            <div style="margin-bottom: ${index < agendamentos.length - 1 ? '12px' : '0'}; padding-bottom: ${index < agendamentos.length - 1 ? '12px' : '0'}; ${index < agendamentos.length - 1 ? 'border-bottom: 1px solid var(--ag-border);' : ''}">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: var(--ag-text);">
                <i class="fas fa-user" style="margin-right: 8px; color: var(--ag-primary);"></i>
                ${apt.paciente || 'Paciente'}
              </p>
              <p style="margin: 0; font-size: 0.85rem; color: var(--ag-muted);">
                ${apt.hora || 'Horário não informado'}
              </p>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    const result = await Swal.fire({
      title: 'O que deseja fazer?',
      html: mensagem,
      icon: 'question',
      showCancelButton: false,
      showDenyButton: true,
      showCloseButton: true,
      closeButtonHtml: '<i class="fas fa-arrow-left"></i>',
      closeButtonAriaLabel: 'Voltar',
      confirmButtonColor: '#dc2626',
      denyButtonColor: '#991b1b',
      confirmButtonText: agendamentos.length === 1 ? 'Cancelar agendamento' : `Cancelar ${agendamentos.length} agendamentos`,
      denyButtonText: agendamentos.length === 1 ? 'Cancelar agendamento e horário' : `Cancelar agendamentos e horário`,
      customClass: {
        popup: 'swal-cancelar-agendamento-popup',
        actions: 'swal-cancelar-agendamento-actions'
      }
    });
    
    // Se clicou no X (voltar), não fazer nada
    if (result.dismiss === Swal.DismissReason.close) {
      return;
    }
    
    if (result.isConfirmed) {
      // Apenas cancelar agendamento(s), manter o horário
      try {
        const token = ensureAuthenticated();
        if (!token) return;
        
        setLoadingState(true);
        
        // Cancelar cada agendamento
        const promises = agendamentos.map(async (agendamento) => {
          const agendamentoId = agendamento.id || agendamento._id;
          if (!agendamentoId) return null;
          
          const response = await fetch(`${API_URL}/api/agendamentos/${agendamentoId}/cancelar`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ motivoCancelamento: 'Cancelado via gerenciamento de horários' }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Não foi possível cancelar o agendamento.');
          }
          
          return response.json();
        });
        
        await Promise.all(promises);
        
        // Atualizar cache e recarregar
        await fetchAppointmentsFromApi();
        await loadHorarios();
        
        showToast(agendamentos.length === 1 
          ? 'Agendamento cancelado com sucesso!' 
          : `${agendamentos.length} agendamentos cancelados com sucesso!`, 
        'success');
      } catch (error) {
        console.error('Erro ao cancelar agendamentos:', error);
        showToast(error.message || 'Erro ao cancelar agendamento(s).', 'error');
      } finally {
        setLoadingState(false);
      }
    } else if (result.isDenied) {
      // Cancelar agendamento(s) E o horário
      try {
        const token = ensureAuthenticated();
        if (!token) return;
        
        setLoadingState(true);
        
        // Primeiro, cancelar todos os agendamentos
        const promisesAgendamentos = agendamentos.map(async (agendamento) => {
          const agendamentoId = agendamento.id || agendamento._id;
          if (!agendamentoId) return null;
          
          const response = await fetch(`${API_URL}/api/agendamentos/${agendamentoId}/cancelar`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ motivoCancelamento: 'Cancelado via gerenciamento de horários - horário removido' }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Não foi possível cancelar o agendamento.');
          }
          
          return response.json();
        });
        
        await Promise.all(promisesAgendamentos);
        
        // Depois, desativar o horário
        const horarioId = horario._id;
        if (horarioId) {
          const responseHorario = await fetch(`${API_URL}/api/horarios-disponibilidade/${horarioId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ativo: false,
              observacoes: horario.observacoes || ''
            })
          });
          
          if (!responseHorario.ok) {
            const errorData = await responseHorario.json().catch(() => ({}));
            throw new Error(errorData.message || 'Não foi possível cancelar o horário.');
          }
        }
        
        // Atualizar cache e recarregar
        await fetchAppointmentsFromApi();
        await loadHorarios();
        
        showToast(agendamentos.length === 1 
          ? 'Agendamento e horário cancelados com sucesso!' 
          : `${agendamentos.length} agendamentos e horário cancelados com sucesso!`, 
        'success');
      } catch (error) {
        console.error('Erro ao cancelar agendamentos e horário:', error);
        showToast(error.message || 'Erro ao cancelar agendamento(s) e horário.', 'error');
      } finally {
        setLoadingState(false);
      }
    }
  }

  // Mostrar informações do paciente quando clicar em horário agendado
  function mostrarInformacoesPaciente(agendamentos, dataDia) {
    if (!agendamentos || agendamentos.length === 0) return;

    // Formatar data
    let dataFormatada;
    try {
      if (typeof dataDia === 'string') {
        const dataParts = dataDia.split('-');
        if (dataParts.length === 3) {
          dataFormatada = new Date(parseInt(dataParts[0]), parseInt(dataParts[1]) - 1, parseInt(dataParts[2])).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          dataFormatada = new Date(dataDia).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } else {
        dataFormatada = new Date(dataDia).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (err) {
      dataFormatada = dataDia || 'Data não informada';
    }

    const dataFormatadaCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    // Criar HTML
    let htmlContent = '';
    
    if (agendamentos.length === 1) {
      const apt = agendamentos[0];
      htmlContent = `
        <div class="info-paciente-modal">
          <div class="info-paciente-header-main">
            <div class="info-paciente-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="info-paciente-title-section">
              <h3 class="info-paciente-nome">${apt.paciente || 'Paciente'}</h3>
              <p class="info-paciente-subtitle">Informações do Agendamento</p>
            </div>
          </div>
          
          <div class="info-paciente-divider"></div>
          
          <div class="info-paciente-details">
            <div class="info-paciente-detail-item">
              <div class="info-paciente-detail-icon phone">
                <i class="fas fa-phone"></i>
              </div>
              <div class="info-paciente-detail-content">
                <span class="info-paciente-detail-label">Telefone</span>
                <span class="info-paciente-detail-value">
                  ${apt.contato && apt.contato !== 'Não informado' ? `<a href="tel:${apt.contato.replace(/\D/g, '')}" class="info-paciente-link">${apt.contato}</a>` : '<span class="info-paciente-empty">Não informado</span>'}
                </span>
              </div>
            </div>
            
            <div class="info-paciente-detail-item">
              <div class="info-paciente-detail-icon calendar">
                <i class="fas fa-calendar"></i>
              </div>
              <div class="info-paciente-detail-content">
                <span class="info-paciente-detail-label">Data</span>
                <span class="info-paciente-detail-value">${dataFormatadaCapitalizada}</span>
              </div>
            </div>
            
            <div class="info-paciente-detail-item">
              <div class="info-paciente-detail-icon clock">
                <i class="fas fa-clock"></i>
              </div>
              <div class="info-paciente-detail-content">
                <span class="info-paciente-detail-label">Horário</span>
                <span class="info-paciente-detail-value">${apt.hora || '<span class="info-paciente-empty">Não informado</span>'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      htmlContent = `
        <div class="info-paciente-modal">
          <div class="info-paciente-header">
            <i class="fas fa-calendar-check"></i> ${agendamentos.length} agendamentos para ${dataFormatadaCapitalizada}
          </div>
          <div class="info-pacientes-list">
            ${agendamentos.map((apt, index) => `
              <div class="info-paciente-card">
                <div class="info-paciente-card-header">
                  <span class="info-paciente-numero">${index + 1}</span>
                  <span class="info-paciente-hora">${apt.hora || 'Não informado'}</span>
                </div>
                <div class="info-paciente-card-body">
                  <div class="info-paciente-item">
                    <div class="info-paciente-label">
                      <i class="fas fa-user"></i> Nome:
                    </div>
                    <div class="info-paciente-value">${apt.paciente || 'Não informado'}</div>
                  </div>
                  <div class="info-paciente-item">
                    <div class="info-paciente-label">
                      <i class="fas fa-phone"></i> Telefone:
                    </div>
                    <div class="info-paciente-value">
                      ${apt.contato && apt.contato !== 'Não informado' ? `<a href="tel:${apt.contato.replace(/\D/g, '')}" style="color: var(--ag-primary); text-decoration: none;">${apt.contato}</a>` : 'Não informado'}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    Swal.fire({
      title: '',
      html: htmlContent,
      width: agendamentos.length === 1 ? '520px' : '640px',
      showCloseButton: false,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal2-popup-info-paciente',
        htmlContainer: 'swal2-html-container-info-paciente',
        title: 'swal2-title-info-paciente'
      },
      padding: '0'
    });
  }

  // Renderizar horários (mantido para compatibilidade)
  function renderHorarios() {
    renderSemanaView();
  }

  // Abrir modal de configuração de horários
  function openHorarioModal(diaEspecifico = null, dataEspecifica = null) {
    console.log('Abrindo modal de horários...', { diaEspecifico, dataEspecifica, tipoDia: typeof diaEspecifico, tipoData: typeof dataEspecifica });
    const modal = document.getElementById('horarioModal');
    const form = document.getElementById('horarioForm');
    const title = document.getElementById('modalHorarioTitle');
    const periodoStep = document.querySelector('.form-step:first-of-type');
    const periodoSelect = document.getElementById('periodoSemanas');
    
    if (!modal) {
      console.error('Modal não encontrado!');
      showToast('Erro ao abrir modal. Recarregue a página.', 'error');
      return;
    }
    
    // Se for para um dia específico, ajustar o modal
    // Verificar se ambos os parâmetros estão definidos e não são vazios
    const isDiaEspecifico = diaEspecifico !== null && 
                           diaEspecifico !== undefined && 
                           diaEspecifico !== '' && 
                           dataEspecifica !== null && 
                           dataEspecifica !== undefined && 
                           dataEspecifica !== '';
    
    console.log('É dia específico?', isDiaEspecifico, { diaEspecifico, dataEspecifica });
    
    if (isDiaEspecifico) {
      // Mudar título
      if (title) {
        title.textContent = 'Definir Horário para Dia Específico';
      }
      
      // Ocultar seção de período e dias
      if (periodoStep) {
        periodoStep.style.display = 'none';
      }
      
      // Desabilitar seleção de dias (já está definido para o dia específico)
      // Não marcar nenhum checkbox - o dia já está definido pelo parâmetro
      document.querySelectorAll('.dia-select').forEach(cb => {
        cb.checked = false;
        cb.disabled = true; // Desabilitar todos os dias (já está definido)
      });
      
      // Ocultar seleção de período (não é necessário para dia específico)
      if (periodoSelect) {
        periodoSelect.value = '1'; // Sempre 1 semana para dia específico
        periodoSelect.style.display = 'none';
        const periodoLabel = periodoSelect.closest('.config-item');
        if (periodoLabel) {
          periodoLabel.style.display = 'none';
        }
      }
      
      // Armazenar dados do dia específico no form
      if (form) {
        form.dataset.diaEspecifico = String(diaEspecifico);
        form.dataset.dataEspecifica = String(dataEspecifica);
        console.log('Armazenado no form:', { 
          diaEspecifico: form.dataset.diaEspecifico, 
          dataEspecifica: form.dataset.dataEspecifica 
        });
      }
    } else {
      // Modo normal - múltiplos dias
      console.log('Modo normal - múltiplos dias');
      if (title) {
        title.textContent = 'Configurar Horários de Atendimento';
      }
      
      // Mostrar seção de período e dias
      if (periodoStep) {
        periodoStep.style.display = 'block';
      }
      
      // Resetar seleção de dias
      document.querySelectorAll('.dia-select').forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
      });
      
      // Mostrar seleção de período
      if (periodoSelect) {
        periodoSelect.style.display = 'block';
        const periodoLabel = periodoSelect.closest('.config-item');
        if (periodoLabel) {
          periodoLabel.style.display = 'block';
        }
      }
      
      // Remover dados do dia específico
      if (form) {
        delete form.dataset.diaEspecifico;
        delete form.dataset.dataEspecifica;
        console.log('Limpos dados de dia específico do form');
      }
    }
    
    // Resetar formulário
    if (form) {
      form.reset();
      
      // Se for dia específico, limpar todos os valores padrão
      if (diaEspecifico !== null && dataEspecifica) {
        const horaInicioEl = document.getElementById('horaInicio');
        const horaFimEl = document.getElementById('horaFim');
        const duracaoEl = document.getElementById('duracaoConsulta');
        const almocoInicioEl = document.getElementById('almocoInicio');
        const almocoFimEl = document.getElementById('almocoFim');
        
        if (horaInicioEl) horaInicioEl.value = '';
        if (horaFimEl) horaFimEl.value = '';
        if (duracaoEl) duracaoEl.value = '30';
        if (almocoInicioEl) almocoInicioEl.value = '';
        if (almocoFimEl) almocoFimEl.value = '';
      }
      
      // Atualizar visibilidade dos campos de almoço após reset
      setTimeout(() => {
        const semAlmoco = document.getElementById('semAlmoco');
        const almocoFields = document.getElementById('almocoFields');
        if (semAlmoco && almocoFields) {
          semAlmoco.checked = false;
          almocoFields.style.display = 'flex';
        }
        // Atualizar preview
        if (typeof updatePreview === 'function') {
          updatePreview();
        }
      }, 0);
    }
    
    // Campos de horário devem sempre abrir vazios
    const horaInicioEl = document.getElementById('horaInicio');
    const horaFimEl = document.getElementById('horaFim');
    const duracaoEl = document.getElementById('duracaoConsulta');
    const almocoInicioEl = document.getElementById('almocoInicio');
    const almocoFimEl = document.getElementById('almocoFim');
    
    // Limpar campos de horário (mas manter duração padrão)
    if (horaInicioEl) horaInicioEl.value = '';
    if (horaFimEl) horaFimEl.value = '';
    if (duracaoEl) duracaoEl.value = '30';
    if (almocoInicioEl) almocoInicioEl.value = '';
    if (almocoFimEl) almocoFimEl.value = '';
    
    const periodoSemanasEl = document.getElementById('periodoSemanas');
    if (periodoSemanasEl) periodoSemanasEl.value = '2';
    
    // Limpar preview
    const previewEl = document.getElementById('previewHorarios');
    if (previewEl) {
      previewEl.innerHTML = '<p class="preview-placeholder">Selecione os dias e configure os horários para ver o preview</p>';
    }
    
    // Atualizar info do período
    updatePeriodoInfo();
    
    // Exibir modal
    modal.style.display = 'flex';
    modal.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    
    // Atualizar preview após um pequeno delay para garantir que os elementos estão renderizados
    setTimeout(() => {
      updatePreview();
    }, 300);
  }

  // Abrir modal de editar dia específico
  function openEditarDiaModal(diaSemana, horario = null, dataEspecifica = null) {
    const modal = document.getElementById('editarDiaModal');
    const form = document.getElementById('editarDiaForm');
    const title = document.getElementById('editarDiaTitle');
    const excluirBtn = document.getElementById('excluirDiaBtn');

    if (horario) {
      title.textContent = `Editar Horário - ${diasSemana[diaSemana]}`;
      document.getElementById('editarDiaId').value = horario._id;
      document.getElementById('editarDiaSemana').value = horario.diaSemana;
      document.getElementById('editarHoraInicio').value = horario.horaInicio;
      document.getElementById('editarHoraFim').value = horario.horaFim;
      document.getElementById('editarDuracao').value = horario.duracaoConsulta;
      document.getElementById('editarObservacoes').value = horario.observacoes || '';
      document.getElementById('editarAtivo').checked = horario.ativo;
      if (excluirBtn) excluirBtn.style.display = 'block';
    } else {
      title.textContent = `Adicionar Horário - ${diasSemana[diaSemana]}`;
      form.reset();
      document.getElementById('editarDiaId').value = '';
      document.getElementById('editarDiaSemana').value = diaSemana;
      document.getElementById('editarDuracao').value = '30';
      document.getElementById('editarAtivo').checked = true;
      if (excluirBtn) excluirBtn.style.display = 'none';
    }

    if (modal) modal.style.display = 'flex';
  }

  // Fechar modal de horário
  function closeHorarioModal() {
    console.log('Fechando modal de horários...');
    const modal = document.getElementById('horarioModal');
    const form = document.getElementById('horarioForm');
    const periodoStep = document.querySelector('.form-step:first-of-type');
    const periodoSelect = document.getElementById('periodoSemanas');
    const title = document.getElementById('modalHorarioTitle');
    
    if (!modal) {
      console.error('Modal não encontrado!');
      return;
    }
    
    // Restaurar visibilidade dos elementos (caso tenha sido ocultado para dia específico)
    if (periodoStep) {
      periodoStep.style.display = 'block';
    }
    
    document.querySelectorAll('.dia-select').forEach(cb => {
      cb.disabled = false;
    });
    
    if (periodoSelect) {
      periodoSelect.style.display = 'block';
      const periodoLabel = periodoSelect.closest('.config-item');
      if (periodoLabel) {
        periodoLabel.style.display = 'block';
      }
    }
    
    // Restaurar título
    if (title) {
      title.textContent = 'Configurar Horários de Atendimento';
    }
    
    // Remover dados do dia específico
    if (form) {
      delete form.dataset.diaEspecifico;
      delete form.dataset.dataEspecifica;
    }
    
    // Fechar modal
    modal.style.display = 'none';
    modal.style.pointerEvents = 'none';
    
    // Resetar formulário
    if (form) {
      form.reset();
      const horarioIdEl = document.getElementById('horarioId');
      if (horarioIdEl) horarioIdEl.value = '';
    }
    
    // Restaurar scroll do body
    document.body.style.overflow = '';
    document.body.style.position = '';
    
    console.log('Modal fechado com sucesso');
    
    // Forçar recarregamento da visualização
    setTimeout(() => {
      loadHorarios();
    }, 100);
  }

  // Editar horário
  function editHorario(id) {
    const horario = horarios.find(h => h._id === id);
    if (horario) {
      openHorarioModal(horario);
    }
  }

  // Cancelar horário (desativar temporariamente)
  async function cancelarHorario(id) {
    const horario = horarios.find(h => h._id === id);
    if (!horario) return;

    const dataFormatada = horario.dataEspecifica 
      ? new Date(horario.dataEspecifica).toLocaleDateString('pt-BR')
      : diasSemana[horario.diaSemana];

    const result = await Swal.fire({
      title: 'Cancelar horário?',
      html: `
        <p>Deseja cancelar este horário?</p>
        <p style="margin-top: 10px; font-weight: 600;">
          ${dataFormatada} - ${horario.horaInicio} às ${horario.horaFim}
        </p>
        <p style="margin-top: 10px; font-size: 0.9rem; color: #64748b;">
          O horário será desativado e não aparecerá para agendamentos. Você pode reativá-lo depois.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Não cancelar',
      input: 'textarea',
      inputPlaceholder: 'Motivo do cancelamento (opcional)',
      inputAttributes: {
        'aria-label': 'Motivo do cancelamento'
      },
      showLoaderOnConfirm: true,
      preConfirm: async (motivo) => {
        try {
          const observacoesAtualizadas = motivo 
            ? `${horario.observacoes || ''}\n[CANCELADO: ${motivo}]`.trim() 
            : horario.observacoes;

          const response = await fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ativo: false,
              observacoes: observacoesAtualizadas
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao cancelar horário');
          }

          return response.json();
        } catch (error) {
          Swal.showValidationMessage(`Erro: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed) {
      showToast('Horário cancelado com sucesso!');
      await loadHorarios();
    }
  }

  // Reativar horário
  async function reativarHorario(id) {
    const horario = horarios.find(h => h._id === id);
    if (!horario) return;

    const dataFormatada = horario.dataEspecifica 
      ? new Date(horario.dataEspecifica).toLocaleDateString('pt-BR')
      : diasSemana[horario.diaSemana];

    const result = await Swal.fire({
      title: 'Reativar horário?',
      html: `
        <p>Deseja reativar este horário?</p>
        <p style="margin-top: 10px; font-weight: 600;">
          ${dataFormatada} - ${horario.horaInicio} às ${horario.horaFim}
        </p>
        <p style="margin-top: 10px; font-size: 0.9rem; color: #64748b;">
          O horário voltará a aparecer para agendamentos.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, reativar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ativo: true
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao reativar horário');
          }

          return response.json();
        } catch (error) {
          Swal.showValidationMessage(`Erro: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed) {
      showToast('Horário reativado com sucesso!');
      await loadHorarios();
    }
  }

  // Deletar horário (permanente)
  async function deleteHorario(id) {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita! O horário será permanentemente excluído.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir permanentemente',
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

      showToast('Horário excluído permanentemente!');
      loadHorarios();
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      showToast(error.message, 'error');
    }
  }

  // Ativar/desativar modo de seleção múltipla
  function toggleModoSelecaoMultipla() {
    modoSelecaoMultipla = !modoSelecaoMultipla;
    horariosSelecionados.clear();
    
    const toggleBtn = document.getElementById('toggleSelecaoMultipla');
    const excluirBtn = document.getElementById('excluirSelecionados');
    const contador = document.getElementById('contadorSelecionados');
    
    if (modoSelecaoMultipla) {
      toggleBtn.innerHTML = '<i class="fas fa-times"></i> Sair da Seleção';
      toggleBtn.classList.remove('btn-secondary');
      toggleBtn.classList.add('btn-primary');
      excluirBtn.style.display = 'inline-flex';
      if (contador) contador.textContent = '0';
    } else {
      toggleBtn.innerHTML = '<i class="fas fa-check-square"></i> Selecionar Horário';
      toggleBtn.classList.remove('btn-primary');
      toggleBtn.classList.add('btn-secondary');
      excluirBtn.style.display = 'none';
    }
    
    renderSemanaView();
  }

  // Atualizar contador de selecionados
  function atualizarContadorSelecionados() {
    const contador = document.getElementById('contadorSelecionados');
    if (contador) {
      contador.textContent = horariosSelecionados.size;
    }
    
    const excluirBtn = document.getElementById('excluirSelecionados');
    if (excluirBtn) {
      excluirBtn.style.display = horariosSelecionados.size > 0 ? 'inline-flex' : 'none';
    }
  }

  // Selecionar todos os horários de um dia específico
  function selecionarTodosHorariosDoDia(dia, dataDia) {
    console.log('selecionarTodosHorariosDoDia chamado:', { dia, dataDia, modoSelecaoMultipla });
    
    if (!modoSelecaoMultipla) {
      showToast('Ative o modo de seleção múltipla primeiro', 'warning');
      return;
    }
    
    // Buscar horários do dia que estão visíveis (já filtrados)
    const selector = `.dia-card[data-dia="${dia}"][data-data-dia="${dataDia}"]`;
    console.log('Procurando card com selector:', selector);
    
    let diaCard = document.querySelector(selector);
    if (!diaCard) {
      // Tentar encontrar sem data-data-dia se não funcionar
      const diaCardAlternativo = document.querySelector(`.dia-card[data-dia="${dia}"]`);
      if (diaCardAlternativo) {
        console.log('Card encontrado sem data-data-dia:', diaCardAlternativo);
        diaCard = diaCardAlternativo;
        const diaCardDataDia = diaCardAlternativo.getAttribute('data-data-dia');
        if (diaCardDataDia && diaCardDataDia !== dataDia) {
          console.warn('Data do dia não corresponde:', { esperado: dataDia, encontrado: diaCardDataDia });
        }
      } else {
        console.error('Dia card não encontrado com selector:', selector);
        showToast('Erro: Dia não encontrado', 'error');
        return;
      }
    }
    
    const horariosItems = diaCard.querySelectorAll('.horario-item');
    console.log('Horários encontrados no dia:', horariosItems.length);
    
    if (horariosItems.length === 0) {
      showToast('Nenhum horário disponível neste dia', 'info');
      return;
    }
    
    let todosEstaoSelecionados = true;
    const horariosIds = [];
    
    // Verificar se todos já estão selecionados e coletar IDs
    horariosItems.forEach(item => {
      const id = item.dataset.id;
      if (id) {
        horariosIds.push(id);
        if (!horariosSelecionados.has(id)) {
          todosEstaoSelecionados = false;
        }
      }
    });
    
    console.log('IDs dos horários:', horariosIds);
    console.log('Todos estão selecionados?', todosEstaoSelecionados);
    
    // Toggle: se todos estão selecionados, deselecionar; senão, selecionar todos
    if (todosEstaoSelecionados) {
      // Deselecionar todos
      horariosIds.forEach(id => {
        horariosSelecionados.delete(id);
      });
      console.log('Deselecionou todos os horários do dia');
      showToast(`${horariosIds.length} horário(s) desmarcado(s)`, 'success');
    } else {
      // Selecionar todos (apenas os ativos)
      let selecionados = 0;
      horariosIds.forEach(id => {
        const horario = horarios.find(h => h._id === id);
        if (horario && horario.ativo) {
          horariosSelecionados.add(id);
          selecionados++;
        }
      });
      console.log(`Selecionou ${selecionados} horário(s) do dia`);
      showToast(`${selecionados} horário(s) selecionado(s)`, 'success');
    }
    
    atualizarContadorSelecionados();
    renderSemanaView();
  }

  // Excluir todos os horários de um dia específico
  async function excluirHorariosDoDia(dia, dataDia) {
    if (!modoSelecaoMultipla) return;
    
    // Buscar horários selecionados do dia
    const diaCard = document.querySelector(`.dia-card[data-dia="${dia}"][data-data-dia="${dataDia}"]`);
    if (!diaCard) return;
    
    const horariosSelecionadosDoDia = [];
    diaCard.querySelectorAll('.horario-item').forEach(item => {
      const id = item.dataset.id;
      if (horariosSelecionados.has(id)) {
        horariosSelecionadosDoDia.push(id);
      }
    });
    
    if (horariosSelecionadosDoDia.length === 0) {
      showToast('Nenhum horário selecionado neste dia', 'warning');
      return;
    }

    const diaNome = diasSemanaAbrev[dia];
    const result = await Swal.fire({
      title: 'Excluir horários do dia?',
      html: `
        <p>Deseja excluir permanentemente <strong>${horariosSelecionadosDoDia.length}</strong> horário(s) de <strong>${diaNome}</strong>?</p>
        <p style="margin-top: 10px; font-size: 0.9rem; color: #64748b;">
          Esta ação não pode ser desfeita.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Sim, excluir ${horariosSelecionadosDoDia.length} horário(s)`,
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const promises = horariosSelecionadosDoDia.map(id => 
            fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            })
          );

          const responses = await Promise.all(promises);
          
          for (const response of responses) {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Erro ao excluir horário');
            }
          }

          // Remover os horários excluídos da seleção
          horariosSelecionadosDoDia.forEach(id => horariosSelecionados.delete(id));

          return true;
        } catch (error) {
          Swal.showValidationMessage(`Erro: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed) {
      showToast(`${horariosSelecionadosDoDia.length} horário(s) excluído(s) com sucesso!`);
      atualizarContadorSelecionados();
      await loadHorarios();
      
      // Se não há mais horários selecionados, sair do modo de seleção
      if (horariosSelecionados.size === 0) {
        modoSelecaoMultipla = false;
        toggleModoSelecaoMultipla();
      } else {
        renderSemanaView();
      }
    }
  }

  // Excluir horários selecionados
  async function excluirHorariosSelecionados() {
    if (horariosSelecionados.size === 0) {
      showToast('Nenhum horário selecionado', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Excluir horários?',
      html: `
        <p>Deseja excluir permanentemente <strong>${horariosSelecionados.size}</strong> horário(s)?</p>
        <p style="margin-top: 10px; font-size: 0.9rem; color: #64748b;">
          Esta ação não pode ser desfeita.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Sim, excluir ${horariosSelecionados.size} horário(s)`,
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const promises = Array.from(horariosSelecionados).map(id => 
            fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            })
          );

          const responses = await Promise.all(promises);
          
          for (const response of responses) {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Erro ao excluir horário');
            }
          }

          return true;
        } catch (error) {
          Swal.showValidationMessage(`Erro: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed) {
      showToast(`${horariosSelecionados.size} horário(s) excluído(s) com sucesso!`);
      horariosSelecionados.clear();
      modoSelecaoMultipla = false;
      toggleModoSelecaoMultipla();
      await loadHorarios();
    }
  }

  // Setup eventos de horários
  function setupHorariosEvents() {
    // Botões de configurar horários
    const configurarHorariosBtn = document.getElementById('configurarHorariosBtn');
    const addHorarioBtn = document.getElementById('addHorarioBtn');
    const closeHorarioModalBtn = document.getElementById('closeHorarioModal');
    const cancelHorarioFormBtn = document.getElementById('cancelHorarioForm');
    const horarioForm = document.getElementById('horarioForm');
    // Botões de seleção múltipla
    const toggleSelecaoBtn = document.getElementById('toggleSelecaoMultipla');
    const excluirSelecionadosBtn = document.getElementById('excluirSelecionados');
    if (toggleSelecaoBtn) {
      toggleSelecaoBtn.addEventListener('click', toggleModoSelecaoMultipla);
    }
    
    if (excluirSelecionadosBtn) {
      excluirSelecionadosBtn.addEventListener('click', excluirHorariosSelecionados);
    }
    
    // Filtro de agendamentos (botões modernos)
    document.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filtro = e.currentTarget.dataset.filtro;
        filtroAgendamentos = filtro;
        
        // Atualizar classes ativas
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        renderSemanaView();
      });
    });

    // Navegação de semanas
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const todayWeekBtn = document.getElementById('todayWeek');
    
    if (prevWeekBtn) {
      prevWeekBtn.addEventListener('click', () => {
        semanaAtual--;
        renderSemanaView();
      });
    }
    
    if (nextWeekBtn) {
      nextWeekBtn.addEventListener('click', () => {
        semanaAtual++;
        renderSemanaView();
      });
    }
    
    if (todayWeekBtn) {
      todayWeekBtn.addEventListener('click', () => {
        semanaAtual = 0;
        renderSemanaView();
      });
    }
    
    // Templates rápidos
    const templateButtons = document.querySelectorAll('.template-btn');
    const selectAllDays = document.getElementById('selectAllDays');
    const deselectAllDays = document.getElementById('deselectAllDays');
    
    // Modal de editar dia
    const closeEditarDiaModal = document.getElementById('closeEditarDiaModal');
    const cancelEditarDia = document.getElementById('cancelEditarDia');
    const editarDiaForm = document.getElementById('editarDiaForm');
    const excluirDiaBtn = document.getElementById('excluirDiaBtn');

    if (configurarHorariosBtn) {
      configurarHorariosBtn.addEventListener('click', () => openHorarioModal());
    }

    if (addHorarioBtn) {
      addHorarioBtn.addEventListener('click', () => openHorarioModal());
    }

    // Templates rápidos
    templateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        const horaInicio = document.getElementById('horaInicio');
        const horaFim = document.getElementById('horaFim');
        const almocoInicio = document.getElementById('almocoInicio');
        const almocoFim = document.getElementById('almocoFim');
        const semAlmoco = document.getElementById('semAlmoco');
        
        switch(template) {
          case 'manha':
            horaInicio.value = '08:00';
            horaFim.value = '12:00';
            if (semAlmoco) semAlmoco.checked = true;
            almocoInicio.value = '';
            almocoFim.value = '';
            break;
          case 'tarde':
            horaInicio.value = '13:00';
            horaFim.value = '18:00';
            if (semAlmoco) semAlmoco.checked = true;
            almocoInicio.value = '';
            almocoFim.value = '';
            break;
          case 'dia-completo':
            horaInicio.value = '08:00';
            horaFim.value = '18:00';
            if (semAlmoco) semAlmoco.checked = false;
            almocoInicio.value = '12:00';
            almocoFim.value = '13:30';
            break;
          case 'limpar':
            horaInicio.value = '08:00';
            horaFim.value = '18:00';
            if (semAlmoco) semAlmoco.checked = false;
            almocoInicio.value = '';
            almocoFim.value = '';
            document.querySelectorAll('.dia-select').forEach(cb => cb.checked = false);
            break;
        }
        atualizarVisibilidadeAlmoco();
        updatePreview();
      });
    });

    // Função para atualizar visibilidade dos campos de almoço
    function atualizarVisibilidadeAlmoco() {
      const semAlmoco = document.getElementById('semAlmoco');
      const almocoFields = document.getElementById('almocoFields');
      
      if (semAlmoco && almocoFields) {
        if (semAlmoco.checked) {
          almocoFields.style.display = 'none';
          // Limpar valores quando desmarcar
          document.getElementById('almocoInicio').value = '';
          document.getElementById('almocoFim').value = '';
        } else {
          almocoFields.style.display = 'flex';
          // Restaurar valores padrão se vazios
          if (!document.getElementById('almocoInicio').value) {
            document.getElementById('almocoInicio').value = '12:00';
          }
          if (!document.getElementById('almocoFim').value) {
            document.getElementById('almocoFim').value = '13:30';
          }
        }
      }
    }
    
    // Event listener para checkbox de sem almoço
    const semAlmocoCheckbox = document.getElementById('semAlmoco');
    if (semAlmocoCheckbox) {
      semAlmocoCheckbox.addEventListener('change', () => {
        atualizarVisibilidadeAlmoco();
        updatePreview();
      });
      atualizarVisibilidadeAlmoco(); // Inicializar visibilidade
    }
    
    // Atualizar preview quando campos mudarem
    const previewInputs = ['horaInicio', 'horaFim', 'duracaoConsulta', 'almocoInicio', 'almocoFim', 'semAlmoco'];
    previewInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('change', updatePreview);
        input.addEventListener('input', updatePreview);
      }
    });

    document.querySelectorAll('.dia-select').forEach(cb => {
      cb.addEventListener('change', updatePreview);
    });

    // Atualizar info do período quando mudar
    const periodoSemanasEl = document.getElementById('periodoSemanas');
    if (periodoSemanasEl) {
      periodoSemanasEl.addEventListener('change', updatePeriodoInfo);
      periodoSemanasEl.addEventListener('change', updatePreview);
    }

    // Selecionar todos os dias
    if (selectAllDays) {
      selectAllDays.addEventListener('click', () => {
        document.querySelectorAll('.dia-select').forEach(cb => cb.checked = true);
        updatePreview();
      });
    }

    if (deselectAllDays) {
      deselectAllDays.addEventListener('click', () => {
        document.querySelectorAll('.dia-select').forEach(cb => cb.checked = false);
        updatePreview();
      });
    }

    if (closeHorarioModalBtn) {
      closeHorarioModalBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Botão X clicado');
        closeHorarioModal();
      });
    }

    if (cancelHorarioFormBtn) {
      cancelHorarioFormBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Botão Cancelar clicado');
        closeHorarioModal();
      });
    }

    // Fechar modal ao clicar fora dele
    const horarioModal = document.getElementById('horarioModal');
    if (horarioModal) {
      horarioModal.addEventListener('click', (e) => {
        if (e.target === horarioModal) {
          closeHorarioModal();
        }
      });
    }

    if (horarioForm) {
      horarioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Verificar se é para um dia específico
        const diaEspecifico = horarioForm.dataset.diaEspecifico;
        const dataEspecifica = horarioForm.dataset.dataEspecifica;
        const isDiaEspecifico = diaEspecifico !== undefined && diaEspecifico !== '' && dataEspecifica !== undefined && dataEspecifica !== '';
        
        console.log('Submit horário:', { diaEspecifico, dataEspecifica, isDiaEspecifico });

        let diasSelecionados;
        if (isDiaEspecifico) {
          // Para dia específico, usar apenas esse dia
          diasSelecionados = [parseInt(diaEspecifico)];
        } else {
          // Para múltiplos dias, obter da seleção
          diasSelecionados = Array.from(document.querySelectorAll('.dia-select:checked'))
            .map(cb => parseInt(cb.value));
          
          if (diasSelecionados.length === 0) {
            showToast('Selecione pelo menos um dia da semana', 'warning');
            return;
          }
        }

        const horaInicio = document.getElementById('horaInicio')?.value;
        const horaFim = document.getElementById('horaFim')?.value;
        const duracaoConsulta = parseInt(document.getElementById('duracaoConsulta')?.value || '30');
        const observacoes = document.getElementById('observacoesHorario')?.value || '';
        const semAlmoco = document.getElementById('semAlmoco')?.checked || false;
        const almocoInicio = semAlmoco ? null : (document.getElementById('almocoInicio')?.value || null);
        const almocoFim = semAlmoco ? null : (document.getElementById('almocoFim')?.value || null);

        // Validar horários
        if (!horaInicio || !horaFim) {
          showToast('Preencha os horários de início e fim', 'error');
          return;
        }

        if (horaFim <= horaInicio) {
          showToast('Hora de fim deve ser maior que hora de início', 'error');
          return;
        }

        try {
          // Gerar slots automaticamente
          const slots = gerarSlotsHorarios(horaInicio, horaFim, duracaoConsulta, almocoInicio, almocoFim);
          
          if (slots.length === 0) {
            showToast('Nenhum horário será gerado com essas configurações. Verifique os horários e intervalo de almoço.', 'warning');
            return;
          }

          // Obter período selecionado
          let periodoSemanas, isIndefinido, numSemanas;
          if (isDiaEspecifico) {
            // Para dia específico, sempre criar apenas para aquela data
            periodoSemanas = '1';
            isIndefinido = false;
            numSemanas = 1;
          } else {
            periodoSemanas = document.getElementById('periodoSemanas')?.value || '2';
            isIndefinido = periodoSemanas === 'indefinido';
            numSemanas = isIndefinido ? 0 : (parseInt(periodoSemanas) || 1);
          }

          // Criar horários para cada dia e cada slot
          const promises = [];
          
          if (isIndefinido) {
            // Horário recorrente (sem data fim)
            for (const diaSemana of diasSelecionados) {
              for (const slot of slots) {
                promises.push(
                  fetch(`${API_URL}/api/horarios-disponibilidade`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                      diaSemana,
                      horaInicio: slot.inicio,
                      horaFim: slot.fim,
                      duracaoConsulta,
                      observacoes,
                      ativo: true,
                      tipo: 'recorrente'
                    })
                  })
                );
              }
            }
          } else if (isDiaEspecifico) {
            // Criar horários apenas para a data específica
            console.log('Criando horários para dia específico:', { dataEspecifica, diaEspecifico, slots: slots.length });
            
            const dataAlvo = buildLocalDate(dataEspecifica, '00:00');
            if (!dataAlvo) {
              console.error('Data inválida:', dataEspecifica);
              showToast('Data inválida', 'error');
              return;
            }
            
            // Converter data para formato ISO correto
            const dataEspecificaIso = dateToLocalISOString(dataAlvo);
            if (!dataEspecificaIso) {
              console.error('Erro ao converter data para ISO:', dataAlvo);
              showToast('Erro ao processar data', 'error');
              return;
            }
            
            console.log('Data convertida:', { original: dataEspecifica, iso: dataEspecificaIso });
            
            for (const slot of slots) {
              const payload = {
                diaSemana: parseInt(diaEspecifico),
                horaInicio: slot.inicio,
                horaFim: slot.fim,
                duracaoConsulta,
                observacoes,
                ativo: true,
                tipo: 'especifico',
                dataEspecifica: dataEspecificaIso
              };
              
              console.log('Enviando horário:', payload);
              
              promises.push(
                fetch(`${API_URL}/api/horarios-disponibilidade`, {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify(payload)
                }).then(async (response) => {
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    console.error('Erro ao criar horário:', errorData);
                  }
                  return response;
                })
              );
            }
          } else {
            // Criar horários para múltiplas semanas
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            for (let semana = 0; semana < numSemanas; semana++) {
              for (const diaSemana of diasSelecionados) {
                // Calcular data para este dia da semana nesta semana
                const dataAlvo = new Date(hoje);
                const diaAtual = hoje.getDay();
                
                // Calcular quantos dias adicionar para chegar no próximo dia da semana selecionado
                let diasParaAdicionar = (diaSemana - diaAtual + 7) % 7;
                
                // Se o dia já passou nesta semana, pegar o da próxima semana
                if (diasParaAdicionar === 0 && diaAtual === diaSemana) {
                  diasParaAdicionar = 7; // Próxima semana
                }
                
                // Adicionar dias da semana atual + semanas adicionais
                dataAlvo.setDate(hoje.getDate() + diasParaAdicionar + (semana * 7));
                
                for (const slot of slots) {
                  const horarioData = {
                    dataEspecifica: dateToLocalISOString(dataAlvo),
                    horaInicio: slot.inicio,
                    horaFim: slot.fim,
                    duracaoConsulta,
                    observacoes,
                    ativo: true,
                    tipo: 'especifico'
                  };
                  
                  promises.push(
                    fetch(`${API_URL}/api/horarios-disponibilidade`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify(horarioData)
                    })
                  );
                }
              }
            }
          }

          const responses = await Promise.all(promises);
          
          let totalSucesso = 0;
          let totalErros = 0;
          const erros = [];
          
          for (const response of responses) {
            if (!response.ok) {
              totalErros++;
              try {
                const errorData = await response.json();
                erros.push(errorData.message || errorData.error || 'Erro ao salvar horário');
              } catch (e) {
                erros.push(`Erro ${response.status}: ${response.statusText}`);
              }
            } else {
              totalSucesso++;
            }
          }
          
          if (totalErros > 0 && totalSucesso === 0) {
            throw new Error(`Nenhum horário foi salvo. Erros: ${erros[0]}`);
          }
          
          const periodoTexto = isIndefinido 
            ? 'horários recorrentes' 
            : `próximas ${numSemanas} semana${numSemanas > 1 ? 's' : ''}`;
          
          if (totalErros > 0) {
            showToast(`${totalSucesso} horários criados com sucesso, ${totalErros} falharam para ${periodoTexto}!`, 'warning');
          } else {
            showToast(`${totalSucesso} horários criados com sucesso para ${periodoTexto}!`);
          }
          
          // Fechar modal usando a função
          console.log('Fechando modal após salvar...');
          closeHorarioModal();
        } catch (error) {
          console.error('Erro ao salvar horários:', error);
          showToast(error.message, 'error');
        }
      });
    }

    // Modal de editar dia específico
    if (closeEditarDiaModal) {
      closeEditarDiaModal.addEventListener('click', () => {
        const modal = document.getElementById('editarDiaModal');
        if (modal) modal.style.display = 'none';
      });
    }

    if (cancelEditarDia) {
      cancelEditarDia.addEventListener('click', () => {
        const modal = document.getElementById('editarDiaModal');
        if (modal) modal.style.display = 'none';
      });
    }

    if (editarDiaForm) {
      editarDiaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editarDiaId').value;
        const data = {
          diaSemana: parseInt(document.getElementById('editarDiaSemana').value),
          horaInicio: document.getElementById('editarHoraInicio').value,
          horaFim: document.getElementById('editarHoraFim').value,
          duracaoConsulta: parseInt(document.getElementById('editarDuracao').value),
          observacoes: document.getElementById('editarObservacoes').value,
          ativo: document.getElementById('editarAtivo').checked
        };

        try {
          let response;
          if (id) {
            response = await fetch(`${API_URL}/api/horarios-disponibilidade/${id}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify(data)
            });
          } else {
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
          const modal = document.getElementById('editarDiaModal');
          if (modal) modal.style.display = 'none';
          loadHorarios();
        } catch (error) {
          console.error('Erro ao salvar horário:', error);
          showToast(error.message, 'error');
        }
      });
    }

    if (excluirDiaBtn) {
      excluirDiaBtn.addEventListener('click', async () => {
        const id = document.getElementById('editarDiaId').value;
        if (id) {
          await deleteHorario(id);
        }
      });
    }


    // Fechar modal ao clicar fora
    const modal = document.getElementById('horarioModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeHorarioModal();
        }
      });
    }

    // Fechar modal de editar dia ao clicar fora
    const editarDiaModal = document.getElementById('editarDiaModal');
    if (editarDiaModal) {
      editarDiaModal.addEventListener('click', (e) => {
        if (e.target === editarDiaModal) {
          editarDiaModal.style.display = 'none';
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFilters(renderAppointments);
    setupModalEvents();
    fetchAppointmentsFromApi();
    
    // Setup de horários
    setupTabs();
    setupHorariosEvents();
    loadHorarios();
  });
})();

