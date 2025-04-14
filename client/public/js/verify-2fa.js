document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("verifyForm");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const otp = form.otp.value;
      const token = localStorage.getItem("token");
  
      if (!token) {
        alert("Token não encontrado. Faça login novamente.");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp }),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert("Verificação 2FA bem-sucedida!");
          // Redirecionar para dashboard ou perfil
          window.location.href = "/client/views/perfil.html";
        } else {
          alert(result.message || "Código incorreto");
        }
      } catch (err) {
        alert("Erro na requisição");
        console.error(err);
      }
    });
  });
  