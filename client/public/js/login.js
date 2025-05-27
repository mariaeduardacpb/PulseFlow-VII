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
  let errorTimeout = null;

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
      submitBtn.setAttribute("aria-busy", "true");

      // Adicionar efeito de pulso suave
      submitBtn.style.animation = "pulse 1.5s infinite";
    } else {
      buttonText.textContent = "Acessar Sistema";
      buttonIcon.className = "fas fa-sign-in-alt";
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      submitBtn.removeAttribute("aria-busy");
      submitBtn.style.animation = "none";
    }
  };

  // Função para mostrar mensagens de feedback
  const showMessage = (message, type, duration = 4000) => {
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      mensagemGeral.style.opacity = "0";
      mensagemGeral.style.transform = "scale(0.95)";
    }

    mensagemTexto.textContent = message;
    mensagemGeral.className = `mensagem-geral ${type}`;
    mensagemIcone.className = type === "sucesso" ? "fas fa-check-circle" : "fas fa-exclamation-triangle";
    mensagemGeral.setAttribute("role", "alert");
    mensagemGeral.setAttribute("aria-live", "polite");

    // Animar entrada da mensagem com spring effect
    requestAnimationFrame(() => {
      mensagemGeral.style.display = "flex";
      mensagemGeral.style.opacity = "1";
      mensagemGeral.style.transform = "scale(1)";
    });

    if (duration) {
      errorTimeout = setTimeout(() => {
        mensagemGeral.style.opacity = "0";
        mensagemGeral.style.transform = "scale(0.95)";
        setTimeout(() => {
          mensagemGeral.style.display = "none";
        }, 300);
      }, duration);
    }
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
    if (senha !== senha.trim()) {
      return "A senha não pode conter espaços no início ou fim.";
    }
    return "";
  };

  // Função para limpar erros
  const clearErrors = () => {
    emailError.textContent = "";
    senhaError.textContent = "";
    emailInput.classList.remove("input-error");
    senhaInput.classList.remove("input-error");
    emailInput.setAttribute("aria-invalid", "false");
    senhaInput.setAttribute("aria-invalid", "false");
  };

  // Toggle de visibilidade da senha com animação melhorada
  passwordToggle.addEventListener("click", () => {
    const type = senhaInput.getAttribute("type") === "password" ? "text" : "password";
    const icon = passwordToggle.querySelector("i");
    const inputIcon = senhaInput.parentElement;

    // Adicionar classe de animação
    passwordToggle.classList.add("active");
    inputIcon.classList.add("password-visible");

    // Animar transição do ícone
    icon.style.transform = "scale(0.8) rotate(-10deg)";
    
    setTimeout(() => {
      senhaInput.setAttribute("type", type);
      icon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
      icon.style.transform = "scale(1) rotate(0deg)";
      passwordToggle.setAttribute("aria-label",
        type === "password" ? "Mostrar senha" : "Ocultar senha"
      );
      passwordToggle.setAttribute("aria-pressed", type === "text");

      // Remover classes de animação
      setTimeout(() => {
        passwordToggle.classList.remove("active");
        if (type === "password") {
          inputIcon.classList.remove("password-visible");
        }
      }, 300);
    }, 150);
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
      errorElement.style.opacity = "0";
      requestAnimationFrame(() => {
        errorElement.style.opacity = "1";
      });
    } else {
      input.classList.remove("input-error");
      input.setAttribute("aria-invalid", "false");
      errorElement.style.opacity = "0";
      setTimeout(() => {
        errorElement.textContent = "";
      }, 300);
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
    const inputIcon = input.parentElement;
    
    input.addEventListener("focus", () => {
      clearErrors();
      inputIcon.classList.add("focused");
      inputIcon.style.transform = 'translateY(-2px)';
      inputIcon.style.boxShadow = '0 4px 12px rgba(0, 195, 183, 0.15)';
    });

    input.addEventListener("blur", () => {
      inputIcon.classList.remove("focused");
      inputIcon.style.transform = 'translateY(0)';
      inputIcon.style.boxShadow = 'none';
      
      // Validar ao sair do campo
      if (input === emailInput) {
        validateInput(emailInput, emailError, validateEmail);
      } else {
        validateInput(senhaInput, senhaError, validatePassword);
      }
    });

    // Adicionar efeito de hover
    input.addEventListener("mouseenter", () => {
      if (!inputIcon.classList.contains("focused")) {
        inputIcon.style.borderColor = "var(--secondary-color)";
      }
    });

    input.addEventListener("mouseleave", () => {
      if (!inputIcon.classList.contains("focused")) {
        inputIcon.style.borderColor = "var(--border-color)";
      }
    });

    // Melhorar feedback visual de erro
    input.addEventListener("input", () => {
      if (input.classList.contains("input-error")) {
        inputIcon.classList.add("input-error");
      } else {
        inputIcon.classList.remove("input-error");
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
      // Scroll para o primeiro erro
      const firstError = document.querySelector(".input-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        firstError.focus();
      }
      return;
    }

    isSubmitting = true;
    updateSubmitButton(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
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

        // Transição suave antes do redirecionamento
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.5s ease";

        setTimeout(() => {
          window.location.href = "/client/views/verify-2fa.html";
        }, 1500);
      } else {
        showMessage(result.message || "Email ou senha incorretos.", "erro");
        // Destacar campos com erro
        emailInput.classList.add("input-error");
        senhaInput.classList.add("input-error");
        emailInput.setAttribute("aria-invalid", "true");
        senhaInput.setAttribute("aria-invalid", "true");
        // Limpar senha
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

  // Adicionar animação sequencial aos feature items
  document.querySelectorAll('.feature-item').forEach((item, index) => {
    item.style.setProperty('--item-index', index);
  });

  // Melhorar animação do botão de submit
  submitBtn.addEventListener('mouseenter', () => {
    submitBtn.style.transform = 'translateY(-2px)';
    submitBtn.style.boxShadow = '0 6px 20px rgba(0, 57, 79, 0.15)';
  });

  submitBtn.addEventListener('mouseleave', () => {
    submitBtn.style.transform = 'translateY(0)';
    submitBtn.style.boxShadow = 'var(--card-shadow)';
  });

  // Melhorar animação dos inputs
  const inputs = document.querySelectorAll('.input-icon input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.style.transform = 'translateY(-2px)';
      input.parentElement.style.boxShadow = '0 4px 12px rgba(0, 195, 183, 0.15)';
    });

    input.addEventListener('blur', () => {
      input.parentElement.style.transform = 'translateY(0)';
      input.parentElement.style.boxShadow = 'none';
    });
  });

  // Adicionar estilos para animações
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    .input-icon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .input-icon input {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .password-toggle i {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .submit-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mensagem-geral {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .feature-item {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .register-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .form-container {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  document.head.appendChild(style);

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