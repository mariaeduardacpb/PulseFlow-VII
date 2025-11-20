const API_URL = window.API_URL || 'http://localhost:65432';

const escapeHTML = (str) =>
  str
    ? str.replace(/[&<>"']/g, (char) => {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return entities[char] || char;
      })
    : '';

const formatDateLong = (dateString) => {
  if (!dateString) return '';
  try {
    if (dateString.length === 10) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
    } else {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(dateString));
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
    alert(message);
  }
};

const getToken = () => localStorage.getItem('token');

const ensureAuthenticated = () => {
  const token = getToken();
  if (!token) {
    Swal.fire({
      icon: 'warning',
      title: 'Sessão expirada',
      text: 'Faça login novamente para agendar consultas.',
      confirmButtonColor: '#002a42',
    }).then(() => {
      window.location.href = '/client/views/login.html';
    });
    return null;
  }
  return token;
};

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const buildIsoDateTime = (date, time) => {
  if (!date || !time) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
  const testDate = new Date(dateStr);
  if (Number.isNaN(testDate.getTime())) return null;
  return dateStr;
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formNovoAgendamento');
  const cancelarBtn = document.getElementById('cancelarCadastro');
  const voltarBtn = document.getElementById('voltarLista');
  const enviarConfirmacaoBtn = document.getElementById('enviarConfirmacao');
  const resumo = document.getElementById('resumoAgendamento');
  const buscarPacienteBtn = document.querySelector('[data-action="buscar-paciente"]');
  const pacienteIdInput = document.getElementById('pacienteId');

  let pacienteAtual = null;

  const voltarParaLista = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/client/views/agendamentos.html';
    }
  };

  const preencherPaciente = (paciente) => {
    pacienteAtual = paciente;
    if (pacienteIdInput && paciente?.id) {
      pacienteIdInput.value = paciente.id;
    }
    if (form?.nomePaciente && paciente?.nome) {
      form.nomePaciente.value = paciente.nome;
    }
    if (form?.contatoPaciente && (paciente?.telefone || paciente?.phone)) {
      form.contatoPaciente.value = paciente.telefone || paciente.phone;
    }
    atualizarResumo();
  };

  const carregarPacienteSalvo = () => {
    try {
      const salvo = localStorage.getItem('pacienteSelecionado');
      if (!salvo) return;
      const paciente = JSON.parse(salvo);
      if (!paciente) return;
      preencherPaciente({
        id: paciente.id || paciente._id,
        nome: paciente.nome || paciente.name,
        telefone: paciente.telefone || paciente.phone,
      });
    } catch (error) {
      console.error('Erro ao carregar paciente salvo:', error);
    }
  };

  const buscarPaciente = async () => {
    const { value: cpfInput } = await Swal.fire({
      title: 'Buscar paciente',
      input: 'text',
      inputLabel: 'Informe o CPF do paciente',
      inputPlaceholder: '000.000.000-00',
      inputAttributes: {
        autocapitalize: 'off',
      },
      showCancelButton: true,
      confirmButtonText: 'Buscar',
      confirmButtonColor: '#002a42',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#94a3b8',
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage('Informe o CPF do paciente');
          return false;
        }
        const somenteNumeros = value.replace(/\D/g, '');
        if (somenteNumeros.length !== 11) {
          Swal.showValidationMessage('CPF deve possuir 11 dígitos');
          return false;
        }
        return somenteNumeros;
      },
    });

    if (!cpfInput) return;

    const token = ensureAuthenticated();
    if (!token) return;

    try {
      Swal.fire({
        title: 'Buscando paciente...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await fetch(`${API_URL}/api/pacientes/buscar?cpf=${cpfInput}`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Paciente não encontrado.');
      }

      preencherPaciente({
        id: data.id,
        nome: data.nome,
        telefone: data.telefone || data.phone,
      });

      showToast('Paciente vinculado ao agendamento.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Erro ao buscar paciente.', 'error');
    } finally {
      Swal.close();
    }
  };

  const atualizarResumo = () => {
    if (!resumo || !form) return;
    const nomePaciente =
      pacienteAtual?.nome || form.nomePaciente.value.trim() || 'Selecione um paciente';
    const contatoPaciente =
      form.contatoPaciente.value.trim() || pacienteAtual?.telefone || pacienteAtual?.phone || '';

    const valores = {
      paciente: nomePaciente,
      contato: contatoPaciente,
      data: form.dataConsulta.value ? formatDateLong(form.dataConsulta.value) : 'Selecione a agenda disponível',
      hora: form.horaConsulta.value ? formatTime(form.horaConsulta.value) : '',
      tipo: form.tipoAtendimento.value,
      local: form.localAtendimento.value.trim(),
    };

    const formatoLabel =
      valores.tipo === 'online'
        ? 'Teleconsulta'
        : valores.tipo === 'domiciliar'
          ? 'Visita domiciliar'
          : 'Presencial';

    resumo.innerHTML = `
      <div class="summary-item">
        <span class="summary-label">Paciente</span>
        <span class="summary-value">${escapeHTML(valores.paciente)}</span>
        ${valores.contato ? `<span class="summary-note">${escapeHTML(valores.contato)}</span>` : ''}
      </div>
      <div class="summary-item">
        <span class="summary-label">Data & horário</span>
        <span class="summary-value">${escapeHTML(valores.data)}</span>
        ${valores.hora ? `<span class="summary-note">${escapeHTML(formatTime(valores.hora))}</span>` : ''}
      </div>
      <div class="summary-item">
        <span class="summary-label">Formato</span>
        <span class="summary-value">${formatoLabel}</span>
        ${valores.local ? `<span class="summary-note">${escapeHTML(valores.local)}</span>` : ''}
      </div>
      <div class="summary-item">
        <span class="summary-label">Status</span>
        <span class="summary-status badge badge-agendada">Pré-visualização</span>
      </div>
    `;
  };

  [
    'nomePaciente',
    'contatoPaciente',
    'observacoesPaciente',
    'dataConsulta',
    'horaConsulta',
    'tipoAtendimento',
    'localAtendimento',
  ].forEach((campo) => {
    const input = form?.elements.namedItem(campo);
    if (input) {
      input.addEventListener('input', atualizarResumo);
      input.addEventListener('change', atualizarResumo);
    }
  });

  const tipoAtendimentoSelect = form?.elements.namedItem('tipoAtendimento');
  const localAtendimentoInput = form?.elements.namedItem('localAtendimento');
  const labelLocalAtendimento = document.getElementById('labelLocalAtendimento');
  
  if (tipoAtendimentoSelect && localAtendimentoInput && labelLocalAtendimento) {
    const atualizarLabelLocal = () => {
      const tipo = tipoAtendimentoSelect.value;
      if (tipo === 'online') {
        labelLocalAtendimento.textContent = 'Link da videochamada';
        localAtendimentoInput.placeholder = 'Cole o link da reunião (Zoom, Meet, etc.)';
      } else if (tipo === 'domiciliar') {
        labelLocalAtendimento.textContent = 'Endereço da visita';
        localAtendimentoInput.placeholder = 'Informe o endereço completo';
      } else {
        labelLocalAtendimento.textContent = 'Local (se presencial/domiciliar)';
        localAtendimentoInput.placeholder = 'Informe endereço ou sala';
      }
    };
    
    tipoAtendimentoSelect.addEventListener('change', atualizarLabelLocal);
    atualizarLabelLocal();
  }

  carregarPacienteSalvo();
  atualizarResumo();

  if (cancelarBtn) {
    cancelarBtn.addEventListener('click', (event) => {
      event.preventDefault();
      Swal.fire({
        title: 'Cancelar cadastro?',
        text: 'As informações preenchidas serão descartadas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#002a42',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Sim, descartar',
        cancelButtonText: 'Manter preenchimento',
      }).then((result) => {
        if (result.isConfirmed) {
          voltarParaLista();
        }
      });
    });
  }

  if (voltarBtn) {
    voltarBtn.addEventListener('click', (event) => {
      event.preventDefault();
      voltarParaLista();
    });
  }

  if (enviarConfirmacaoBtn) {
    enviarConfirmacaoBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Envio de confirmação',
        text: 'Uma confirmação será enviada ao paciente após salvar o agendamento.',
        icon: 'info',
        confirmButtonColor: '#002a42',
      });
    });
  }

  if (buscarPacienteBtn) {
    buscarPacienteBtn.addEventListener('click', (event) => {
      event.preventDefault();
      buscarPaciente();
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (!pacienteIdInput.value) {
        showToast('Busque e selecione um paciente antes de salvar.', 'warning');
        return;
      }

      const dataConsulta = form.dataConsulta.value;
      const horaConsulta = form.horaConsulta.value;
      const dataHoraISO = buildIsoDateTime(dataConsulta, horaConsulta);

      if (!dataHoraISO) {
        showToast('Data e horário inválidos.', 'error');
        return;
      }

      const token = ensureAuthenticated();
      if (!token) return;

      const dataHoraObj = new Date(dataHoraISO);
      if (dataHoraObj <= new Date()) {
        showToast('A data e horário da consulta deve ser futura.', 'error');
        return;
      }

      const payload = {
        pacienteId: pacienteIdInput.value,
        dataHora: dataHoraISO,
        tipoConsulta: form.tipoAtendimento.value,
        motivoConsulta: form.motivoConsulta.value.trim(),
        duracao: form.duracaoConsulta.value ? Number(form.duracaoConsulta.value) : 30,
      };

      const observacoesConsulta = form.observacoesConsulta.value.trim();
      if (observacoesConsulta) {
        payload.observacoes = observacoesConsulta;
      }

      if (payload.tipoConsulta === 'online') {
        if (form.localAtendimento.value.trim()) {
          payload.linkVideochamada = form.localAtendimento.value.trim();
        }
      } else if (form.localAtendimento.value.trim()) {
        payload.endereco = {
          logradouro: form.localAtendimento.value.trim(),
        };
      }

      const observacoesPaciente = form.observacoesPaciente.value.trim();
      if (observacoesPaciente) {
        payload.observacoes = payload.observacoes
          ? `${observacoesPaciente}\n\n${payload.observacoes}`
          : observacoesPaciente;
      }

      try {
        const response = await fetch(`${API_URL}/api/agendamentos`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Não foi possível criar o agendamento.');
        }

        Swal.fire({
          title: 'Agendamento criado!',
          html: `
            <p>O paciente <strong>${escapeHTML(form.nomePaciente.value.trim())}</strong> foi agendado para
            <strong>${formatDateLong(dataConsulta)}</strong>
            às <strong>${escapeHTML(formatTime(horaConsulta))}</strong>.</p>
            <p class="swal-subtext">O paciente será notificado com os detalhes.</p>
          `,
          icon: 'success',
          confirmButtonColor: '#002a42',
          confirmButtonText: 'Voltar para agendamentos',
        }).then(() => {
          voltarParaLista();
        });
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao criar o agendamento.', 'error');
      }
    });
  }
});

