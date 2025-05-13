document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const emailError = document.getElementById("emailError");
  const senhaError = document.getElementById("senhaError");
  const mensagemGeral = document.getElementById("mensagemGeral");
  const mensagemTexto = document.getElementById("mensagemTexto");
  const mensagemIcone = document.getElementById("mensagemIcone");

  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    // Reset mensagens e estilos
    emailError.textContent = "";
    senhaError.textContent = "";
    mensagemGeral.style.display = "none";
    mensagemGeral.className = "mensagem-geral";
    emailInput.classList.remove("input-error");
    senhaInput.classList.remove("input-error");

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      emailError.textContent = "O campo de email é obrigatório.";
      emailInput.classList.add("input-error");
      hasError = true;
    } else if (!emailRegex.test(email)) {
      emailError.textContent = "Formato de email inválido.";
      emailInput.classList.add("input-error");
      hasError = true;
    }

    if (!senha) {
      senhaError.textContent = "O campo de senha é obrigatório.";
      senhaInput.classList.add("input-error");
      hasError = true;
    } else if (senha.length < 6) {
      senhaError.textContent = "A senha deve ter pelo menos 6 caracteres.";
      senhaInput.classList.add("input-error");
      hasError = true;
    } else if (senha.length > 20) {
      senhaError.textContent = "A senha deve ter no máximo 20 caracteres.";
      senhaInput.classList.add("input-error");
      hasError = true;
    } else if (senha !== senha.trim()) {
      senhaError.textContent = "A senha não pode conter espaços no início ou fim.";
      senhaInput.classList.add("input-error");
      hasError = true;
    }

    if (hasError) {
      setTimeout(() => {
        emailError.textContent = "";
        senhaError.textContent = "";
        emailInput.classList.remove("input-error");
        senhaInput.classList.remove("input-error");
      }, 3000);
      isSubmitting = false;
      return;
    }

    const data = { email, senha };

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        mensagemTexto.textContent = "Código de verificação enviado! Redirecionando...";
        mensagemGeral.classList.add("sucesso");
        mensagemIcone.className = "fas fa-check-circle";
        mensagemGeral.style.display = "flex";

        localStorage.setItem("userId", result.userId); // importante para o verify.js

        setTimeout(() => {
          window.location.href = "/client/views/verify-2fa.html";
        }, 1500);
      } else {
        mensagemTexto.textContent = result.message || "Email ou senha incorretos.";
        mensagemGeral.classList.add("erro");
        mensagemIcone.className = "fas fa-exclamation-triangle";
        mensagemGeral.style.display = "flex";

        setTimeout(() => {
          mensagemGeral.style.display = "none";
        }, 4000);
      }
    } catch (err) {
      mensagemTexto.textContent = "Erro ao conectar com o servidor.";
      mensagemGeral.classList.add("erro");
      mensagemIcone.className = "fas fa-exclamation-triangle";
      mensagemGeral.style.display = "flex";

      setTimeout(() => {
        mensagemGeral.style.display = "none";
      }, 4000);
      console.error(err);
    } finally {
      isSubmitting = false;
    }
  });
});
