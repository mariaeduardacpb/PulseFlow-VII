document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verifyForm");
  const methodSelect = document.getElementById("method");
  const codeInput = document.getElementById("codeInput");
  const sendCodeBtn = document.getElementById("sendCodeBtn");
  const infoText = document.getElementById("infoText");
  const resendLink = document.getElementById("resendLink");

  methodSelect.addEventListener("change", () => {
    sendCodeBtn.style.display = "block";
    codeInput.style.display = "none";
    infoText.style.display = "none";
    resendLink.style.display = "none";
  });

  sendCodeBtn.addEventListener("click", async () => {
    const method = methodSelect.value;

    try {
      const response = await fetch("http://localhost:5000/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method })
      });

      const result = await response.json();

      if (response.ok) {
        infoText.textContent = `Um código foi enviado por ${method.toUpperCase()}.`;
        infoText.style.display = "block";
        codeInput.style.display = "block";
        resendLink.style.display = "inline";
      } else {
        alert(result.message || "Erro ao enviar código");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na requisição");
    }
  });

  resendLink.addEventListener("click", (e) => {
    e.preventDefault();
    sendCodeBtn.click();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const method = methodSelect.value;
    const code = codeInput.value.trim();

    if (!method || code.length !== 6) {
      alert("Selecione o método e digite um código válido de 6 dígitos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, code })
      });

      const result = await response.json();

      if (response.ok) {
        alert("Verificação bem-sucedida!");
        window.location.href = "/client/views/dashboard.html";
      } else {
        alert(result.message || "Código inválido.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao verificar o código.");
    }
  });
});
