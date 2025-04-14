document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nome: form.nome.value,
      cpf: form.cpf.value,
      telefonePessoal: form.telefonePessoal.value,
      email: form.email.value,
      senha: form.senha.value,
      crm: form.crm.value,
      areaAtuacao: form.areaAtuacao.value,
      genero: form.genero.value,
      enderecoConsultorio: form.enderecoConsultorio.value,
      telefoneConsultorio: form.telefoneConsultorio.value,
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
      alert("Erro na requisição");
      console.error(err);
    }
  });
});
