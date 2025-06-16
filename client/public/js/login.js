import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const emailError = document.getElementById("emailError");
  const senhaError = document.getElementById("senhaError");
  const mensagemGeral = document.getElementById("mensagemGeral");
  const mensagemTexto = document.getElementById("mensagemTexto");
  const mensagemIcone = document.getElementById("mensagemIcone");
  const passwordToggle = document.querySelector(".password-toggle");
  const submitBtn = document.querySelector(".submit-btn");

  let isSubmitting = false;

  // Função para atualizar o estado do botão de submit
  const updateSubmitButton = (isLoading) => {
    const buttonText = submitBtn.querySelector("span");
    const buttonIcon = submitBtn.querySelector("i");

    if (isLoading) {
      buttonText.textContent = "Acessando...";
      buttonIcon.className = "fas fa-spinner fa-spin";
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.8";
      submitBtn.style.cursor = "not-allowed";
    } else {
      buttonText.textContent = "Acessar Sistema";
      buttonIcon.className = "fas fa-sign-in-alt";
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    }
  };

  // Função para mostrar mensagens de feedback
  const showMessage = (message, type) => {
    mensagemTexto.textContent = message;
    mensagemGeral.className = `mensagem-geral ${type}`;
    mensagemIcone.className = type === "sucesso" ? "fas fa-check-circle" : "fas fa-exclamation-triangle";
    mensagemGeral.style.display = "flex";
    mensagemGeral.setAttribute("role", "alert");
    mensagemGeral.setAttribute("aria-live", "polite");

    setTimeout(() => {
      mensagemGeral.style.display = "none";
    }, 4000);
  };

  // Função para validar email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "O campo de email é obrigatório.";
    }
    if (!emailRegex.test(email)) {
      return "Formato de email inválido.";
    }
    return "";
  };

  // Função para validar senha
  const validatePassword = (senha) => {
    if (!senha) {
      return "O campo de senha é obrigatório.";
    }
    if (senha.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }
    if (senha.length > 20) {
      return "A senha deve ter no máximo 20 caracteres.";
    }
    return "";
  };

  // Função para limpar erros
  const clearErrors = () => {
    emailError.textContent = "";
    senhaError.textContent = "";
    emailInput.classList.remove("input-error");
    senhaInput.classList.remove("input-error");
  };

  // Toggle de visibilidade da senha
  passwordToggle.addEventListener("click", () => {
    const type = senhaInput.getAttribute("type") === "password" ? "text" : "password";
    const icon = passwordToggle.querySelector("i");
    
    senhaInput.setAttribute("type", type);
    icon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
    passwordToggle.setAttribute("aria-label",
      type === "password" ? "Mostrar senha" : "Ocultar senha"
    );
    passwordToggle.setAttribute("aria-pressed", type === "text");
  });

  // Validação em tempo real com debounce
  let emailTimeout, senhaTimeout;

  const debounce = (func, delay) => {
    return (...args) => {
      clearTimeout(args[0] === emailInput ? emailTimeout : senhaTimeout);
      if (args[0] === emailInput) {
        emailTimeout = setTimeout(() => func(...args), delay);
      } else {
        senhaTimeout = setTimeout(() => func(...args), delay);
      }
    };
  };

  const validateInput = (input, errorElement, validateFunc) => {
    const error = validateFunc(input.value.trim());
    if (error) {
      input.classList.add("input-error");
      input.setAttribute("aria-invalid", "true");
      errorElement.textContent = error;
    } else {
      input.classList.remove("input-error");
      input.setAttribute("aria-invalid", "false");
      errorElement.textContent = "";
    }
  };

  // Validação em tempo real dos campos
  emailInput.addEventListener("input", debounce(() => {
    validateInput(emailInput, emailError, validateEmail);
  }, 300));

  senhaInput.addEventListener("input", debounce(() => {
    validateInput(senhaInput, senhaError, validatePassword);
  }, 300));

  // Melhorar interatividade dos inputs
  [emailInput, senhaInput].forEach(input => {
    input.addEventListener("focus", () => {
      clearErrors();
    });

    input.addEventListener("blur", () => {
      if (input === emailInput) {
        validateInput(emailInput, emailError, validateEmail);
      } else {
        validateInput(senhaInput, senhaError, validatePassword);
      }
    });

    // Adicionar suporte a teclas de atalho
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !isSubmitting) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    });
  });

  // Submit do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    // Validar campos
    const emailErrorMsg = validateEmail(email);
    const senhaErrorMsg = validatePassword(senha);

    if (emailErrorMsg || senhaErrorMsg) {
      if (emailErrorMsg) {
        emailInput.classList.add("input-error");
        emailInput.setAttribute("aria-invalid", "true");
        emailError.textContent = emailErrorMsg;
      }
      if (senhaErrorMsg) {
        senhaInput.classList.add("input-error");
        senhaInput.setAttribute("aria-invalid", "true");
        senhaError.textContent = senhaErrorMsg;
      }
      return;
    }

    isSubmitting = true;
    updateSubmitButton(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, senha }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage("Código de verificação enviado! Redirecionando...", "sucesso");
        localStorage.setItem("userId", result.userId);
        setTimeout(() => {
          window.location.href = "/client/views/verify-2fa.html";
        }, 1500);
      } else {
        showMessage(result.message || "Email ou senha incorretos.", "erro");
        emailInput.classList.add("input-error");
        senhaInput.classList.add("input-error");
        emailInput.setAttribute("aria-invalid", "true");
        senhaInput.setAttribute("aria-invalid", "true");
        senhaInput.value = "";
        senhaInput.focus();
      }
    } catch (err) {
      showMessage("Erro ao conectar com o servidor. Verifique sua conexão.", "erro");
      console.error("Erro de conexão:", err);
    } finally {
      isSubmitting = false;
      updateSubmitButton(false);
    }
  });

  // Prevenir múltiplos envios
  form.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && isSubmitting) {
      e.preventDefault();
    }
  });

  // Atalhos de teclado
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "r") {
      e.preventDefault();
      window.location.href = "/client/views/reset-password.html";
    }
    if (e.altKey && e.key === "n") {
      e.preventDefault();
      window.location.href = "/client/views/register.html";
    }
  });
});