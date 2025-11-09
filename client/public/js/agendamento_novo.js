const STORAGE_KEY = 'pulseflow_agendamentos';

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

const saveAppointments = (appointments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

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
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(dateString));
  } catch (_) {
    return dateString;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formNovoAgendamento');
  const cancelarBtn = document.getElementById('cancelarCadastro');
  const voltarBtn = document.getElementById('voltarLista');
  const enviarConfirmacaoBtn = document.getElementById('enviarConfirmacao');
  const resumo = document.getElementById('resumoAgendamento');

  const voltarParaLista = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/client/views/agendamentos.html';
    }
  };

  if (cancelarBtn) {
    cancelarBtn.addEventListener('click', (event) => {
      event.preventDefault();
      Swal.fire({
        title: 'Cancelar cadastro?',
        text: 'As informações preenchidas serão descartadas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#00324a',
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

  const atualizarResumo = () => {
    if (!resumo || !form) return;
    const valores = {
      paciente: form.nomePaciente.value.trim() || 'Informe os dados ao lado',
      contato: form.contatoPaciente.value.trim(),
      data: form.dataConsulta.value ? formatDateLong(form.dataConsulta.value) : 'Selecione a agenda disponível',
      hora: form.horaConsulta.value ? formatTime(form.horaConsulta.value) : '',
      tipo: form.tipoAtendimento.value,
      local: form.localAtendimento.value.trim(),
      status: 'agendada',
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

  atualizarResumo();

  if (enviarConfirmacaoBtn) {
    enviarConfirmacaoBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Envio de confirmação',
        text: 'Uma confirmação será enviada ao paciente após salvar o agendamento.',
        icon: 'info',
        confirmButtonColor: '#00324a',
      });
    });
  }

  if (voltarBtn) {
    voltarBtn.addEventListener('click', (event) => {
      event.preventDefault();
      voltarParaLista();
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const agendamentos = loadAppointments();
      const nomePaciente = form.nomePaciente.value.trim();
      const dataConsulta = form.dataConsulta.value;
      const horaConsulta = form.horaConsulta.value;
      const novoAgendamento = {
        id: `${Date.now()}`,
        paciente: nomePaciente,
        contato: form.contatoPaciente.value.trim(),
        observacoesPaciente: form.observacoesPaciente?.value.trim() ?? '',
        data: dataConsulta,
        hora: horaConsulta,
        duracao: form.duracaoConsulta.value ? Number(form.duracaoConsulta.value) : null,
        tipo: form.tipoAtendimento.value,
        local: form.localAtendimento.value.trim(),
        motivo: form.motivoConsulta.value.trim(),
        observacoes: form.observacoesConsulta.value.trim(),
        status: 'agendada',
        createdAt: new Date().toISOString(),
      };

      agendamentos.push(novoAgendamento);
      saveAppointments(agendamentos);

      Swal.fire({
        title: 'Agendamento criado!',
        html: `
          <p>O paciente <strong>${nomePaciente}</strong> foi agendado para
          <strong>${formatDateLong(dataConsulta)}</strong>
          às <strong>${horaConsulta}</strong>.</p>
          <p class="swal-subtext">Os dados foram salvos localmente para uso de demonstração.</p>
        `,
        icon: 'success',
        confirmButtonColor: '#00324a',
        confirmButtonText: 'Voltar para agendamentos',
      }).then(() => {
        voltarParaLista();
      });
    });
  }
});

