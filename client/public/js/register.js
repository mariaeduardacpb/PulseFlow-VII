// Função global para mostrar mensagem de erro
function showError(field, message) {
  const swalPromise = Swal.fire({
    icon: 'error',
    title: 'Atenção',
    text: message,
    confirmButtonText: 'Entendi',
    timer: 8000,
    timerProgressBar: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'custom-swal-popup',
      title: 'custom-swal-title',
      content: 'custom-swal-content'
    }
  });
  
  if (field && field.classList) {
    field.classList.add("input-error");
    const errorSpan = document.getElementById(`${field.id}Error`);
    if (errorSpan) {
      errorSpan.textContent = message;
      setTimeout(() => {
        errorSpan.textContent = "";
        field.classList.remove("input-error");
      }, 8000);
    }
  }
  
  return swalPromise;
}

// Função global para limpar erro
function clearError(field) {
  if (field && field.classList) {
    field.classList.remove("input-error");
    const errorSpan = document.getElementById(`${field.id}Error`);
    if (errorSpan) errorSpan.textContent = "";
  }
}

console.log('Script de registro carregado');

document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM carregado');
  
  const form = document.getElementById("registerForm");
  console.log('Form encontrado:', form);

  if (!form) {
    console.error('Formulário não encontrado!');
    return;
  }

  const submitBtn = form.querySelector("button[type='submit']");

  // Preencher especialidades médicas
  const areaSelect = document.getElementById("areaAtuacao");
  const especialidades = [
    "Selecione a sua Especialidade", "Acupuntura", "Alergia e Imunologia", "Anestesiologia", "Angiologia",
    "Cardiologia", "Cirurgia Cardiovascular", "Cirurgia da Mão", "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo", "Cirurgia Geral", "Cirurgia Oncológica", "Cirurgia Pediátrica",
    "Cirurgia Plástica", "Cirurgia Torácica", "Cirurgia Vascular", "Clínica Médica",
    "Coloproctologia", "Dermatologia", "Endocrinologia e Metabologia", "Endoscopia",
    "Gastroenterologia", "Genética Médica", "Geriatria", "Ginecologia e Obstetrícia",
    "Hematologia e Hemoterapia", "Homeopatia", "Infectologia", "Mastologia",
    "Medicina de Emergência", "Medicina de Família e Comunidade", "Medicina do Trabalho",
    "Medicina do Tráfego", "Medicina Esportiva", "Medicina Física e Reabilitação",
    "Medicina Intensiva", "Medicina Legal e Perícia Médica", "Medicina Nuclear",
    "Medicina Preventiva e Social", "Nefrologia", "Neurocirurgia", "Neurologia",
    "Nutrologia", "Oftalmologia", "Oncologia Clínica", "Ortopedia e Traumatologia",
    "Otorrinolaringologia", "Patologia", "Patologia Clínica/Medicina Laboratorial",
    "Pediatria", "Pneumologia", "Psiquiatria", "Radiologia e Diagnóstico por Imagem",
    "Radioterapia", "Reumatologia", "Urologia", "Outros"
  ];
  especialidades.forEach((nome) => {
    const option = document.createElement("option");
    option.value = nome;
    option.textContent = nome;
    areaSelect.appendChild(option);
  });

  // Mostrar/ocultar campo de outra especialidade
  const outraEspecialidadeRow = document.getElementById("outraEspecialidadeRow");
  const outraEspecialidadeInput = document.getElementById("outraEspecialidade");
  
  areaSelect.addEventListener("change", function() {
    if (this.value === "Outros") {
      outraEspecialidadeRow.style.display = "flex";
      outraEspecialidadeInput.required = true;
    } else {
      outraEspecialidadeRow.style.display = "none";
      outraEspecialidadeInput.required = false;
      outraEspecialidadeInput.value = "";
    }
  });

  const maskCPF = (input) => {
    input.addEventListener("input", (e) => {
      e.preventDefault();
      let value = input.value.replace(/\D/g, "").slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      input.value = value;
    });
  };

  const maskPhone = (input) => {
    input.addEventListener("input", (e) => {
      e.preventDefault();
      let value = input.value.replace(/\D/g, "").slice(0, 11);
      value = value.length <= 10
        ? value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
        : value.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
      input.value = value.trim().replace(/[-\s]+$/, "");
    });
  };

  const maskCRM = (input) => {
    input.addEventListener("input", (e) => {
      e.preventDefault();
      let value = input.value.replace(/\W/g, "").toUpperCase().slice(0, 15);
      input.value = value;
    });
  };

  // Aplicar máscaras
  maskCPF(form.cpf);
  maskPhone(form.telefonePessoal);
  maskPhone(form.telefoneConsultorio);
  maskCRM(form.crm);

  // Máscaras de input
  const cpfInput = document.getElementById("cpf");
  const telefonePessoalInput = document.getElementById("telefonePessoal");
  const telefoneConsultorioInput = document.getElementById("telefoneConsultorio");
  const crmInput = document.getElementById("crm");
  const cepInput = document.getElementById("cep");
  const passwordInput = document.getElementById("senha");
  const passwordToggle = document.querySelector(".password-toggle");
  const strengthBar = document.getElementById("passwordStrengthBar");

  // Aplicar máscaras
  IMask(cpfInput, { mask: "000.000.000-00" });
  IMask(telefonePessoalInput, { mask: "(00) 00000-0000" });
  IMask(telefoneConsultorioInput, { mask: "(00) 0000-0000" });
  IMask(crmInput, {
    mask: [
      {
        mask: '00000-AA',
        prepare: function(str) {
          return str.toUpperCase();
        },
        definitions: {
          'A': {
            mask: /[A-Z]/
          }
        }
      }
    ]
  });
  IMask(cepInput, { mask: "00000-000" });

  // Toggle de visibilidade da senha
  passwordToggle.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    passwordToggle.classList.toggle("fa-eye");
    passwordToggle.classList.toggle("fa-eye-slash");
  });

  // Validação de força da senha
  function updatePasswordStrength(password) {
    let strength = 0;
    const criteria = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password)
    };

    // Calcular força baseada nos critérios
    if (criteria.length) strength += 25;
    if (criteria.lowercase) strength += 25;
    if (criteria.uppercase) strength += 25;
    if (criteria.number) strength += 25;

    // Atualizar a barra de força
    if (strengthBar) {
      strengthBar.style.width = strength + "%";
      
      // Atualizar a cor da barra
      if (strength <= 25) {
        strengthBar.style.backgroundColor = "#dc3545"; // Vermelho
      } else if (strength <= 50) {
        strengthBar.style.backgroundColor = "#ffc107"; // Amarelo
      } else if (strength <= 75) {
        strengthBar.style.backgroundColor = "#28a745"; // Verde
      } else {
        strengthBar.style.backgroundColor = "#198754"; // Verde escuro
      }

      // Atualizar o texto de força
      const strengthText = document.getElementById("passwordStrengthText");
      if (strengthText) {
        if (strength <= 25) {
          strengthText.textContent = "Fraca";
          strengthText.style.color = "#dc3545";
        } else if (strength <= 50) {
          strengthText.textContent = "Média";
          strengthText.style.color = "#ffc107";
        } else if (strength <= 75) {
          strengthText.textContent = "Forte";
          strengthText.style.color = "#28a745";
        } else {
          strengthText.textContent = "Muito Forte";
          strengthText.style.color = "#198754";
        }
      }
    }
  }

  // Adicionar evento de input para a senha
  if (passwordInput) {
    passwordInput.addEventListener("input", function() {
      updatePasswordStrength(this.value);
    });
    
    // Inicializar a força da senha
    updatePasswordStrength(passwordInput.value);
  }

  // Aplicar máscara ao campo RQE
  const rqeInput = document.getElementById("rqe1");
  if (rqeInput) {
    IMask(rqeInput, {
      mask: '000000',
      maxLength: 6,
      prepare: function(str) {
        return str.replace(/[^\d]/g, '');
      }
    });
  }

  // Busca de CEP
  const enderecoInput = document.getElementById("enderecoConsultorio");
  const numeroInput = document.getElementById("numeroConsultorio");

  cepInput.addEventListener("blur", async () => {
    const cep = cepInput.value.replace(/\D/g, "");
    
    if (cep.length !== 8) {
      await Swal.fire({
        title: "CEP Inválido",
        text: "Por favor, insira um CEP válido",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#003366"
      });
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      enderecoInput.value = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
      numeroInput.focus();
    } catch (error) {
      await Swal.fire({
        title: "Erro ao Buscar CEP",
        text: "Não foi possível encontrar o endereço para este CEP",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#003366"
      });
      enderecoInput.value = "";
    }
  });

  // Variáveis globais para controle dos passos
  let currentStep = 0;
  const steps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');

  // Função para mostrar o passo atual
  function showStep(index) {
    console.log('Mostrando passo:', index);
    steps.forEach((step, i) => {
      if (i === index) {
        step.classList.add('active');
        progressSteps[i].classList.add('active');
      } else {
        step.classList.remove('active');
        progressSteps[i].classList.remove('active');
      }
    });
  }

  // Função para validar o passo atual
  function validateStep(stepIndex) {
    console.log('Validando passo:', stepIndex);
    const currentStepElement = document.querySelector(`.step-${stepIndex + 1}`);
    if (!currentStepElement) {
      console.error('Elemento do passo não encontrado:', stepIndex);
      return false;
    }

    // Etapa 1: Pessoais
    if (stepIndex === 0) {
      const nome = document.getElementById('nome');
      const cpf = document.getElementById('cpf');
      const telefone = document.getElementById('telefonePessoal');
      const email = document.getElementById('email');
      const senha = document.getElementById('senha');
      const genero = document.getElementById('genero');

      if (!nome || !cpf || !telefone || !email || !senha || !genero) {
        console.error('Campos não encontrados na etapa 1');
        return false;
      }

      if (!nome.value.trim()) {
        showError(nome, 'Por favor, informe seu nome completo para continuar.');
        nome.focus();
        return false;
      }
      if (!cpf.value.trim() || !validarCPF(cpf.value)) {
        showError(cpf, 'Por favor, informe um CPF válido para continuar.');
        cpf.focus();
        return false;
      }
      if (!telefone.value.trim()) {
        showError(telefone, 'Por favor, informe um número de telefone válido para continuar.');
        telefone.focus();
        return false;
      }
      if (!email.value.trim() || !validarEmail(email.value)) {
        showError(email, 'Por favor, informe um endereço de e-mail válido para continuar.');
        email.focus();
        return false;
      }
      if (!senha.value.trim() || senha.value.length < 8) {
        showError(senha, 'A senha deve ter pelo menos 8 caracteres para garantir a segurança da sua conta.');
        senha.focus();
        return false;
      }
      if (!genero.value) {
        showError(genero, 'Por favor, selecione seu gênero para continuar.');
        genero.focus();
        return false;
      }
    }

    // Etapa 2: Profissionais
    if (stepIndex === 1) {
      const crm = document.getElementById('crm');
      const area = document.getElementById('areaAtuacao');
      const rqe = document.getElementById('rqe1');
      const outraEspecialidade = document.getElementById('outraEspecialidade');

      if (!crm || !area || !rqe) {
        console.error('Campos não encontrados na etapa 2');
        return false;
      }

      if (!crm.value.trim()) {
        showError(crm, 'Por favor, preencha seu CRM.');
        crm.focus();
        return false;
      }
      if (!area.value || area.value === 'Selecione a sua Especialidade') {
        showError(area, 'Por favor, selecione sua especialidade.');
        area.focus();
        return false;
      }
      if (area.value === 'Outros') {
        if (!outraEspecialidade || !outraEspecialidade.value.trim()) {
          showError(outraEspecialidade, 'Por favor, informe sua especialidade.');
          outraEspecialidade?.focus();
          return false;
        }
      }
      if (!rqe.value.trim()) {
        showError(rqe, 'Por favor, preencha seu RQE.');
        rqe.focus();
        return false;
      }
    }

    // Etapa 3: Consultório
    if (stepIndex === 2) {
      const cep = document.getElementById('cep');
      const endereco = document.getElementById('enderecoConsultorio');
      const numero = document.getElementById('numeroConsultorio');
      const telefone = document.getElementById('telefoneConsultorio');
      const termos = document.getElementById('termsAccept');

      if (!cep || !endereco || !numero || !telefone) {
        console.error('Campos não encontrados na etapa 3');
        return false;
      }

      if (!cep.value.trim() || cep.value.replace(/\D/g, '').length !== 8) {
        showError(cep, 'Por favor, digite um CEP válido.');
        cep.focus();
        return false;
      }
      if (!endereco.value.trim()) {
        showError(endereco, 'Por favor, preencha o endereço do consultório.');
        endereco.focus();
        return false;
      }
      if (!numero.value.trim()) {
        showError(numero, 'Por favor, preencha o número do consultório.');
        numero.focus();
        return false;
      }
      if (!telefone.value.trim()) {
        showError(telefone, 'Por favor, preencha o telefone do consultório.');
        telefone.focus();
        return false;
      }
      if (termos && !termos.checked) {
        showError(termos, 'Você precisa aceitar os termos de uso para continuar.');
        termos.focus();
        return false;
      }
    }

    return true;
  }

  // Event listeners para os botões de navegação
  const nextButtons = document.querySelectorAll('.next-btn');
  const prevButtons = document.querySelectorAll('.prev-btn');

  console.log('Botões encontrados:', {
    next: nextButtons.length,
    prev: prevButtons.length
  });

  nextButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Botão próximo clicado, passo atual:', currentStep);
      
      if (validateStep(currentStep)) {
        console.log('Validação passou, avançando para o próximo passo');
        currentStep++;
        if (currentStep >= steps.length) {
          currentStep = steps.length - 1;
        }
        showStep(currentStep);
      } else {
        console.log('Validação falhou');
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Botão voltar clicado, passo atual:', currentStep);
      
      currentStep--;
      if (currentStep < 0) {
        currentStep = 0;
      }
      showStep(currentStep);
    });
  });

  // Mostrar o primeiro passo ao carregar a página
  showStep(0);

  // Função para validar o formulário
  function validateForm() {
    const activeStep = document.querySelector('.form-step.active');
    if (!activeStep) {
        console.error('Nenhum passo ativo encontrado');
        return false;
    }

    const stepNumber = parseInt(activeStep.classList[1].replace('step-', ''));
    return validateStep(stepNumber - 1);
  }

  // Função para mostrar mensagem de sucesso
  function showSuccess(message) {
    Swal.fire({
      icon: 'success',
      title: 'Cadastro Realizado com Sucesso! 🎉',
      html: `
        <div style="text-align: center;">
          <p style="margin-bottom: 15px; font-size: 1.1em;">${message}</p>
          <div style="margin: 20px 0;">
            <i class="fas fa-envelope" style="font-size: 2em; color: #0D6EFD; margin-bottom: 10px;"></i>
            <p style="color: #666; font-size: 0.9em;">Verifique sua caixa de entrada para confirmar seu e-mail.</p>
          </div>
          <p style="color: #666; font-size: 0.9em; margin-top: 20px;">Você será redirecionado para a página de login em instantes...</p>
        </div>
      `,
      confirmButtonText: 'Ir para Login',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      timer: 5000,
      timerProgressBar: true,
      didOpen: (popup) => {
        popup.style.opacity = '0';
        setTimeout(() => {
          popup.style.transition = 'opacity 0.5s ease-in-out';
          popup.style.opacity = '1';
        }, 100);
      },
      willClose: (popup) => {
        popup.style.transition = 'opacity 0.5s ease-in-out';
        popup.style.opacity = '0';
      },
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        content: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-button',
        timerProgressBar: 'custom-swal-timer-progress'
      }
    }).then((result) => {
      // Redireciona para a página de login
      window.location.href = '/client/views/login.html';
    });
  }

  // Função para processar o formulário
  async function processForm(formData) {
    try {
      // Mostrar loading por mais tempo
      Swal.fire({
        title: 'Processando Cadastro',
        html: `
          <div style="text-align: center;">
            <p style="margin-bottom: 15px;">Estamos registrando suas informações...</p>
            <p style="color: #666; font-size: 0.9em;">Isso pode levar alguns instantes.</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          content: 'custom-swal-content'
        }
      });

      // Adiciona um pequeno delay para melhor experiência do usuário
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Garantir que todos os campos obrigatórios estejam presentes
      const requiredFields = {
        nome: formData.nome,
        cpf: formData.cpf,
        genero: formData.genero,
        email: formData.email,
        senha: formData.senha,
        crm: formData.crm,
        areaAtuacao: formData.areaAtuacao,
        telefonePessoal: formData.telefonePessoal,
        cep: formData.cep,
        enderecoConsultorio: formData.enderecoConsultorio,
        numeroConsultorio: formData.numeroConsultorio
      };

      // Verificar campos obrigatórios
      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          throw new Error(`Campo obrigatório não preenchido: ${field}`);
        }
      }

      // Limpar formatação dos campos
      const cleanedData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefonePessoal: formData.telefonePessoal.replace(/\D/g, ''),
        telefoneConsultorio: formData.telefoneConsultorio.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
        crm: formData.crm.replace(/\W/g, '').toUpperCase(),
        rqe: formData.rqe ? [formData.rqe.replace(/\D/g, '')] : []
      };

      console.log('Dados a serem enviados:', cleanedData);

      const API_URL = window.API_URL || 'http://localhost:65432';
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });

      let data = {};
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.warn('Resposta não é JSON:', text);
        }
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', parseError);
      }
      console.log('Resposta do servidor:', data);

      if (!response.ok) {
        let errorMessage = 'Não foi possível processar seu cadastro neste momento. Por favor, tente novamente em alguns instantes.';
        
        if (response.status === 400) {
          if (data.message && (data.message.includes('já existe') || data.message.includes('Usuário já existe'))) {
            errorMessage = 'Este e-mail já está cadastrado em nossa plataforma. Por favor, faça login ou entre em contato com o suporte.';
          } else if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join('\n');
          } else if (data.message) {
            errorMessage = data.message;
          }
        } else if (response.status === 409) {
          errorMessage = 'Este usuário já está cadastrado em nossa plataforma. Por favor, faça login ou entre em contato com o suporte.';
        } else if (response.status === 500) {
          if (data.error && data.error.includes('duplicate key') && data.error.includes('cpf')) {
            errorMessage = 'Este CPF já está cadastrado em nossa plataforma. Por favor, faça login ou entre em contato com o suporte.';
          } else if (data.message && (data.message.includes('já existe') || data.message.includes('Usuário já existe'))) {
            errorMessage = 'Este e-mail já está cadastrado em nossa plataforma. Por favor, faça login ou entre em contato com o suporte.';
          } else if (data.error && data.error.includes('duplicate key') && data.error.includes('email')) {
            errorMessage = 'Este e-mail já está cadastrado em nossa plataforma. Por favor, faça login ou entre em contato com o suporte.';
          } else if (data.message) {
            errorMessage = data.message;
          }
        }
        
        Swal.close();
        await showError(null, errorMessage);
        return false;
      }

      // Mostrar mensagem de sucesso com o nome do usuário
      const successMessage = `Olá ${formData.nome.split(' ')[0]}! Seu cadastro foi realizado com sucesso. Um e-mail de confirmação foi enviado para ${formData.email}.`;
      showSuccess(successMessage);
      return true;

    } catch (error) {
      console.error('Erro detalhado:', error);
      Swal.close();
      showError(null, 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão com a internet e tente novamente.');
      return false;
    }
  }

  // Event listener para o formulário
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Formulário submetido - Iniciando validação'); // Log para debug

    // Validar o passo atual antes de enviar
    if (!validateForm()) {
      console.log('Validação falhou - Retornando'); // Log para debug
      return;
    }

    // Verificar se os termos foram aceitos
    const termosCheckbox = document.getElementById('termsAccept');
    if (termosCheckbox && !termosCheckbox.checked) {
      console.log('Termos não aceitos'); // Log para debug
      showError(termosCheckbox, 'Para continuar com o cadastro, é necessário aceitar os termos de uso e política de privacidade.');
      return;
    }

    // Coletar dados do formulário
    const formData = {
      nome: document.getElementById('nome')?.value?.trim() || '',
      cpf: document.getElementById('cpf')?.value?.replace(/\D/g, '') || '',
      telefonePessoal: document.getElementById('telefonePessoal')?.value?.trim() || '',
      email: document.getElementById('email')?.value?.toLowerCase().trim() || '',
      senha: document.getElementById('senha')?.value || '',
      crm: document.getElementById('crm')?.value?.trim() || '',
      rqe: document.getElementById('rqe1')?.value?.trim() || '',
      areaAtuacao: (() => {
        const area = document.getElementById('areaAtuacao')?.value?.trim() || '';
        const outra = document.getElementById('outraEspecialidade')?.value?.trim() || '';
        return area === 'Outros' ? outra : area;
      })(),
      genero: document.getElementById('genero')?.value || '',
      cep: document.getElementById('cep')?.value?.replace(/\D/g, '') || '',
      enderecoConsultorio: document.getElementById('enderecoConsultorio')?.value?.trim() || '',
      numeroConsultorio: document.getElementById('numeroConsultorio')?.value?.trim() || '',
      telefoneConsultorio: document.getElementById('telefoneConsultorio')?.value?.trim() || '',
      termosAceitos: true
    };

    console.log('Dados coletados do formulário:', formData); // Log para debug

    // Mostrar loading
    Swal.fire({
      title: 'Processando Cadastro',
      text: 'Estamos registrando suas informações. Por favor, aguarde...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        content: 'custom-swal-content'
      }
    });

    try {
      // Processar o formulário
      const success = await processForm(formData);
      console.log('Resultado do processamento:', success); // Log para debug

      if (!success) {
        Swal.close();
        return;
      }
      
      Swal.close();
    } catch (error) {
      console.error('Erro detalhado no processamento:', error); // Log mais detalhado
      Swal.close();
      showError(null, 'Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente em alguns instantes.');
    }
  });
});

// Funções auxiliares
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, "");
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto > 9 ? 0 : resto;
  if (digitoVerificador1 !== parseInt(cpf.charAt(9))) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto > 9 ? 0 : resto;
  if (digitoVerificador2 !== parseInt(cpf.charAt(10))) return false;

  return true;
}

function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}