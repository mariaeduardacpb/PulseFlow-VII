document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  const showError = (field, message) => {
    const errorSpan = document.getElementById(`${field.id}Error`);
    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.style.color = "red";
    }
  };

  const clearError = (field) => {
    const errorSpan = document.getElementById(`${field.id}Error`);
    if (errorSpan) errorSpan.textContent = "";
  };

  const maskCPF = (input) => {
    input.addEventListener("input", () => {
      let value = input.value.replace(/\D/g, "").slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      input.value = value;
    });
  };

  const maskPhone = (input) => {
    input.addEventListener("input", () => {
      let value = input.value.replace(/\D/g, "").slice(0, 11);
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else {
        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
      }
      input.value = value.trim().replace(/[-\s]+$/, "");
    });
  };

  const maskCRM = (input) => {
    input.addEventListener("input", () => {
      let value = input.value.replace(/\W/g, "").toUpperCase().slice(0, 15);
      input.value = value;
    });
  };

  // Aplicar máscaras
  maskCPF(form.cpf);
  maskPhone(form.telefonePessoal);
  maskPhone(form.telefoneConsultorio);
  maskCRM(form.crm);
  // ❌ NÃO aplicar máscara em enderecoConsultorio, pois é texto com número

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

      // Validações específicas
      if (!value) {
        showError(field, "Este campo é obrigatório");
        isValid = false;
      } else if (fieldName === "cpf" && value.length !== 14) {
        showError(field, "CPF inválido");
        isValid = false;
      } else if (fieldName === "email" && !/\S+@\S+\.\S+/.test(value)) {
        showError(field, "E-mail inválido");
        isValid = false;
      } else if (fieldName === "senha" && value.length < 6) {
        showError(field, "A senha deve ter pelo menos 6 caracteres");
        isValid = false;
      } else if (fieldName === "crm" && value.length < 4) {
        showError(field, "CRM inválido");
        isValid = false;
      } else if (fieldName === "enderecoConsultorio" && value.length < 5) {
        showError(field, "Endereço muito curto");
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

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Cadastro realizado com sucesso!");
        window.location.href = "/client/views/login.html";
      } else {
        alert(result.message || "Erro ao registrar");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
      console.error(err);
    }
  });
});
