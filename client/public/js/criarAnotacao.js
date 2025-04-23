document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token"); // Médico logado

  // CPF de teste — troque por um que esteja cadastrado no seu MongoDB
  const cpf = "14789636584";

  const body = {
    cpf, // usando o CPF fixo
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
  } catch (err) {
    alert("Erro: " + err.message);
  }
});
