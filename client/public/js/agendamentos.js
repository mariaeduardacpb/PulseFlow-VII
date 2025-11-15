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

  // ========== GERENCIAMENTO DE HORÁRIOS ==========
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diasSemanaAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  let horarios = [];
  let showInactiveHorarios = false;
  let semanaAtual = 0; // 0 = semana atual, 1 = próxima semana, etc.
  let modoSelecaoMultipla = false;
  let horariosSelecionados = new Set();

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

      const horaInicio = horaInicioEl.value;
      const horaFim = horaFimEl.value;
      const duracao = parseInt(duracaoEl.value || '30');
      const almocoInicio = almocoInicioEl?.value || null;
      const almocoFim = almocoFimEl?.value || null;
      const diasSelecionados = Array.from(document.querySelectorAll('.dia-select:checked')).length;
      const periodoSemanas = periodoSemanasEl?.value || '2';
      const isIndefinido = periodoSemanas === 'indefinido';
      const numSemanas = isIndefinido ? 1 : parseInt(periodoSemanas);

      if (!horaInicio || !horaFim) {
        previewEl.innerHTML = '<p class="preview-placeholder">Configure os horários de início e fim</p>';
        return;
      }

      if (diasSelecionados === 0) {
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

      const totalHorarios = isIndefinido 
        ? slots.length * diasSelecionados 
        : slots.length * diasSelecionados * numSemanas;
      
      const periodoTexto = isIndefinido 
        ? 'horários recorrentes' 
        : `${numSemanas} semana${numSemanas > 1 ? 's' : ''}`;
      
      let html = `<div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--ag-border);">
        <p style="margin: 0 0 4px 0; font-size: 1rem; font-weight: 700; color: var(--ag-text);">
          ${totalHorarios} horários serão criados
        </p>
        <p style="margin: 0; font-size: 0.85rem; color: var(--ag-muted);">
          ${slots.length} horários por dia × ${diasSelecionados} ${diasSelecionados === 1 ? 'dia' : 'dias'} × ${periodoTexto}
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
    }
  }

  // Renderizar visualização semanal
  function renderSemanaView() {
    const semanaGrid = document.getElementById('semanaGrid');
    const emptyStateEl = document.getElementById('emptyStateHorarios');
    const semanaPeriodoEl = document.getElementById('semanaPeriodo');

    if (!semanaGrid) return;

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

    const horariosFiltrados = showInactiveHorarios 
      ? horarios 
      : horarios.filter(h => h.ativo);

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
      
      const diaNumero = dataDia.getDate();
      const mesAbrev = dataDia.toLocaleDateString('pt-BR', { month: 'short' });
      const isHoje = dataDia.toDateString() === hoje.toDateString();
      
      html += `
        <div class="dia-card ${!temHorario ? 'sem-horario' : ''} ${isHoje ? 'dia-hoje' : ''}" data-dia="${dia}">
          <div class="dia-card-header">
            <div>
              <strong>${diasSemanaAbrev[dia]}</strong>
              <span class="dia-data">${diaNumero} ${mesAbrev}</span>
            </div>
            ${isHoje ? '<span class="badge-hoje">Hoje</span>' : ''}
          </div>
          <div class="dia-horarios">
            ${horariosDia.map(horario => {
              const isSelecionado = horariosSelecionados.has(horario._id);
              return `
              <div class="horario-item ${!horario.ativo ? 'inactive' : ''} ${isSelecionado ? 'selecionado' : ''}" data-id="${horario._id}">
                ${modoSelecaoMultipla ? `
                  <label class="horario-checkbox">
                    <input type="checkbox" class="checkbox-horario" value="${horario._id}" ${isSelecionado ? 'checked' : ''}>
                    <span class="checkbox-custom"></span>
                  </label>
                ` : ''}
                <div class="horario-content">
                  <span class="horario-time">${horario.horaInicio} - ${horario.horaFim}</span>
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
                  <button class="btn-edit-dia" title="Editar horário">
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                </div>
                ` : ''}
              </div>
            `}).join('')}
          </div>
          <div class="dia-card-actions">
            <button class="btn-add-horario" data-dia="${dia}" data-data="${dataDia.toISOString()}">
              <i class="fas fa-plus"></i> ${temHorario ? 'Adicionar' : 'Definir Horário'}
            </button>
          </div>
        </div>
      `;
    });

    semanaGrid.innerHTML = html;

    // Configurar eventos dos cards
    setupDiaCardEvents();
    
    // Mostrar botão de seleção múltipla se houver horários
    const toggleBtn = document.getElementById('toggleSelecaoMultipla');
    if (toggleBtn && horariosFiltrados.length > 0) {
      toggleBtn.style.display = 'inline-flex';
    } else if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }

    // Mostrar/ocultar empty state
    if (horariosFiltrados.length === 0) {
      if (emptyStateEl) emptyStateEl.style.display = 'block';
    } else {
      if (emptyStateEl) emptyStateEl.style.display = 'none';
    }
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
        const dia = parseInt(e.target.closest('.btn-add-horario').dataset.dia);
        const dataStr = e.target.closest('.btn-add-horario').dataset.data;
        openEditarDiaModal(dia, null, dataStr);
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
        const id = e.target.closest('.btn-cancelar-horario').dataset.id;
        await cancelarHorario(id);
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
  }

  // Renderizar horários (mantido para compatibilidade)
  function renderHorarios() {
    renderSemanaView();
  }

  // Abrir modal de configuração de horários
  function openHorarioModal() {
    console.log('Abrindo modal de horários...');
    const modal = document.getElementById('horarioModal');
    const form = document.getElementById('horarioForm');
    
    if (!modal) {
      console.error('Modal não encontrado!');
      showToast('Erro ao abrir modal. Recarregue a página.', 'error');
      return;
    }
    
    // Resetar formulário
    if (form) {
      form.reset();
    }
    document.querySelectorAll('.dia-select').forEach(cb => cb.checked = false);
    
    const horaInicioEl = document.getElementById('horaInicio');
    const horaFimEl = document.getElementById('horaFim');
    const duracaoEl = document.getElementById('duracaoConsulta');
    const almocoInicioEl = document.getElementById('almocoInicio');
    const almocoFimEl = document.getElementById('almocoFim');
    
    if (horaInicioEl) horaInicioEl.value = '08:00';
    if (horaFimEl) horaFimEl.value = '18:00';
    if (duracaoEl) duracaoEl.value = '30';
    if (almocoInicioEl) almocoInicioEl.value = '12:00';
    if (almocoFimEl) almocoFimEl.value = '13:30';
    
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
    
    if (!modal) {
      console.error('Modal não encontrado!');
      return;
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
    const cancelarBtn = document.getElementById('cancelarSelecao');
    const contador = document.getElementById('contadorSelecionados');
    
    if (modoSelecaoMultipla) {
      toggleBtn.innerHTML = '<i class="fas fa-times"></i> Sair da Seleção';
      toggleBtn.classList.remove('btn-secondary');
      toggleBtn.classList.add('btn-primary');
      excluirBtn.style.display = 'inline-flex';
      cancelarBtn.style.display = 'inline-block';
      if (contador) contador.textContent = '0';
    } else {
      toggleBtn.innerHTML = '<i class="fas fa-check-square"></i> Selecionar Horário';
      toggleBtn.classList.remove('btn-primary');
      toggleBtn.classList.add('btn-secondary');
      excluirBtn.style.display = 'none';
      cancelarBtn.style.display = 'none';
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
    const showInactiveCheckbox = document.getElementById('showInactiveHorarios');
    
    // Botões de seleção múltipla
    const toggleSelecaoBtn = document.getElementById('toggleSelecaoMultipla');
    const excluirSelecionadosBtn = document.getElementById('excluirSelecionados');
    const cancelarSelecaoBtn = document.getElementById('cancelarSelecao');
    
    if (toggleSelecaoBtn) {
      toggleSelecaoBtn.addEventListener('click', toggleModoSelecaoMultipla);
    }
    
    if (excluirSelecionadosBtn) {
      excluirSelecionadosBtn.addEventListener('click', excluirHorariosSelecionados);
    }
    
    if (cancelarSelecaoBtn) {
      cancelarSelecaoBtn.addEventListener('click', () => {
        horariosSelecionados.clear();
        modoSelecaoMultipla = false;
        toggleModoSelecaoMultipla();
      });
    }
    
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
        
        switch(template) {
          case 'manha':
            horaInicio.value = '08:00';
            horaFim.value = '12:00';
            almocoInicio.value = '';
            almocoFim.value = '';
            break;
          case 'tarde':
            horaInicio.value = '13:00';
            horaFim.value = '18:00';
            almocoInicio.value = '';
            almocoFim.value = '';
            break;
          case 'dia-completo':
            horaInicio.value = '08:00';
            horaFim.value = '18:00';
            almocoInicio.value = '12:00';
            almocoFim.value = '13:30';
            break;
          case 'limpar':
            horaInicio.value = '08:00';
            horaFim.value = '18:00';
            almocoInicio.value = '';
            almocoFim.value = '';
            document.querySelectorAll('.dia-select').forEach(cb => cb.checked = false);
            break;
        }
        updatePreview();
      });
    });

    // Atualizar preview quando campos mudarem
    const previewInputs = ['horaInicio', 'horaFim', 'duracaoConsulta', 'almocoInicio', 'almocoFim'];
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

        const diasSelecionados = Array.from(document.querySelectorAll('.dia-select:checked'))
          .map(cb => parseInt(cb.value));
        
        if (diasSelecionados.length === 0) {
          showToast('Selecione pelo menos um dia da semana', 'warning');
          return;
        }

        const horaInicio = document.getElementById('horaInicio')?.value;
        const horaFim = document.getElementById('horaFim')?.value;
        const duracaoConsulta = parseInt(document.getElementById('duracaoConsulta')?.value || '30');
        const observacoes = document.getElementById('observacoesHorario')?.value || '';
        const almocoInicio = document.getElementById('almocoInicio')?.value || null;
        const almocoFim = document.getElementById('almocoFim')?.value || null;

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
          const periodoSemanas = document.getElementById('periodoSemanas')?.value || '2';
          const isIndefinido = periodoSemanas === 'indefinido';
          const numSemanas = isIndefinido ? 0 : parseInt(periodoSemanas);

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
                  promises.push(
                    fetch(`${API_URL}/api/horarios-disponibilidade`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        diaSemana,
                        dataEspecifica: dataAlvo.toISOString(),
                        horaInicio: slot.inicio,
                        horaFim: slot.fim,
                        duracaoConsulta,
                        observacoes,
                        ativo: true,
                        tipo: 'especifico'
                      })
                    })
                  );
                }
              }
            }
          }

          const responses = await Promise.all(promises);
          
          // Verificar se algum falhou
          for (const response of responses) {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Erro ao salvar horário');
            }
          }

          const totalCriados = isIndefinido 
            ? slots.length * diasSelecionados 
            : slots.length * diasSelecionados * numSemanas;
          const periodoTexto = isIndefinido 
            ? 'horários recorrentes' 
            : `próximas ${numSemanas} semana${numSemanas > 1 ? 's' : ''}`;
          showToast(`${totalCriados} horários criados com sucesso para ${periodoTexto}!`);
          
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

    if (showInactiveCheckbox) {
      showInactiveCheckbox.addEventListener('change', (e) => {
        showInactiveHorarios = e.target.checked;
        renderHorarios();
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

