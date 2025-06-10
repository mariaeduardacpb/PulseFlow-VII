document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      // Limpa mensagens anteriores
      emailError.textContent = "";
  
      const email = emailInput.value.trim();
      let hasError = false;
  
      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailError.textContent = "Email inválido.";
        hasError = true;
      }
  
      if (hasError) return;
  
      const data = { email };
  
      try {
        const response = await fetch("http://localhost:65432/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert("Verifique seu e-mail para redefinir a senha.");
          window.location.href = "/client/views/login.html";
        } else {
          alert(result.message || "Erro ao enviar link de redefinição");
        }
      } catch (err) {
        alert("Erro na requisição");
        console.error(err);
      }
    });
  });
  