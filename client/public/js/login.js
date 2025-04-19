document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const emailError = document.getElementById("emailError");
  const senhaError = document.getElementById("senhaError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Limpa mensagens anteriores
    emailError.textContent = "";
    senhaError.textContent = "";

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    let hasError = false;

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailError.textContent = "Email inválido.";
      hasError = true;
    }

    // Validação de senha
    if (!senha || senha.length < 4) {
      senhaError.textContent = "Senha inválida ou muito curta.";
      hasError = true;
    }

    if (hasError) return;

    const data = { email, senha };

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Login realizado com sucesso!");
        localStorage.setItem("token", result.token);
        window.location.href = "/client/views/verify-2fa.html";
      } else {
        alert(result.message || "Erro ao fazer login");
      }
    } catch (err) {
      alert("Erro na requisição");
      console.error(err);
    }
  });
});
