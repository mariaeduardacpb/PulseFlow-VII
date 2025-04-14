document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      email: form.email.value,
      senha: form.senha.value,
    };

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
