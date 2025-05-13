document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token"); // Médico logado

  // Recupera o CPF do paciente selecionado
  const paciente = JSON.parse(localStorage.getItem("pacienteSelecionado"));
  const cpf = paciente?.cpf;

  if (!cpf) {
    alert("Paciente não selecionado. Volte à tela de seleção.");
    return;
  }

  const body = {
    cpf,
    titulo: document.getElementById("titulo").value,
    data: document.getElementById("data").value,
    categoria: document.getElementById("categoria").value,
    medico: document.getElementById("medico").value,
    anotacao: document.getElementById("prontuario").value,
  };

  try {
    const res = await fetch("http://localhost:5000/api/anotacoes/nova", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Erro ao salvar');

    alert("Anotação salva com sucesso!");
    document.querySelector("form").reset(); // limpa o formulário
  } catch (err) {
    alert("Erro: " + err.message);
  }
});
