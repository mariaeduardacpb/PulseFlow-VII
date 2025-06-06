document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const senhaInput = document.getElementById("senha");
    const senhaError = document.getElementById("senhaError");
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      senhaError.textContent = "";
      
      const senha = senhaInput.value.trim();
      let hasError = false;
  
      if (!senha || senha.length < 6) {
        senhaError.textContent = "A senha deve ter pelo menos 6 caracteres.";
        hasError = true;
      }
  
      if (hasError) return;
  
      const data = { senha, token };
  
      try {
        const response = await fetch("http://localhost:65432/api/auth/confirm-reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert("Senha redefinida com sucesso!");
          window.location.href = "/client/views/login.html";
        } else {
          alert(result.message || "Erro ao redefinir a senha");
        }
      } catch (err) {
        alert("Erro na requisição");
        console.error(err);
      }
    });
  });
  