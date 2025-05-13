document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitBtn = form.querySelector("button[type='submit']");

  const showError = (field, message) => {
    const errorSpan = document.getElementById(`${field.id}Error`);
    if (errorSpan) errorSpan.textContent = message;
    field.classList.add("input-error");
  };

  const clearError = (field) => {
    const errorSpan = document.getElementById(`${field.id}Error`);
    if (errorSpan) errorSpan.textContent = "";
    field.classList.remove("input-error");
  };

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    const fields = [
      "nome",
      "cpf",
      "telefonePessoal",
      "email",
      "senha",
      "crm",
      "areaAtuacao",
      "genero",
      "enderecoConsultorio",
      "telefoneConsultorio"
    ];

    fields.forEach((fieldName) => {
      const field = form[fieldName];
      const value = field.value.trim();

      if (!value) {
        showError(field, "Este campo é obrigatório.");
        isValid = false;
      } else if (fieldName === "cpf" && value.length !== 14) {
        showError(field, "CPF inválido.");
        isValid = false;
      } else if (fieldName === "email" && !/\S+@\S+\.\S+/.test(value)) {
        showError(field, "E-mail inválido.");
        isValid = false;
      } else if (fieldName === "senha" && value.length < 6) {
        showError(field, "A senha deve ter no mínimo 6 caracteres.");
        isValid = false;
      } else if (fieldName === "crm" && value.length < 4) {
        showError(field, "CRM inválido.");
        isValid = false;
      } else if (fieldName === "enderecoConsultorio" && value.length < 5) {
        showError(field, "Endereço muito curto.");
        isValid = false;
      } else {
        clearError(field);
      }
    });

    if (!isValid) return;

    const data = {
      nome: form.nome.value.trim(),
      cpf: form.cpf.value.trim(),
      telefonePessoal: form.telefonePessoal.value.trim(),
      email: form.email.value.trim(),
      senha: form.senha.value.trim(),
      crm: form.crm.value.trim(),
      areaAtuacao: form.areaAtuacao.value.trim(),
      genero: form.genero.value.trim(),
      enderecoConsultorio: form.enderecoConsultorio.value.trim(),
      telefoneConsultorio: form.telefoneConsultorio.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const response = await fetch("http://localhost:5500/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Cadastro realizado com sucesso! Redirecionando...");
        form.reset();
        setTimeout(() => {
          window.location.href = "/client/views/login.html";
        }, 1000);
      } else {
        alert(result.message || "Erro ao cadastrar. Verifique os dados.");
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro de rede. Tente novamente.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Cadastrar";
    }
  });

  const passwordInput = form.senha;
  const passwordToggle = document.querySelector(".password-toggle");

  if (passwordToggle) {
    passwordToggle.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
    });
  }

  passwordInput.addEventListener("input", () => {
    const strengthBar = document.querySelector(".password-strength-bar");
    const passwordValue = passwordInput.value;
    const strength = getPasswordStrength(passwordValue);

    strengthBar.classList.remove("strength-weak", "strength-medium", "strength-strong");
    if (strength === "weak") {
      strengthBar.classList.add("strength-weak");
    } else if (strength === "medium") {
      strengthBar.classList.add("strength-medium");
    } else {
      strengthBar.classList.add("strength-strong");
    }
  });

  function getPasswordStrength(password) {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (hasLower && hasUpper && hasNumber && hasSpecial && password.length >= 8) return "strong";
    if ((hasLower || hasUpper) && hasNumber && password.length >= 6) return "medium";
    return "weak";
  }
});
