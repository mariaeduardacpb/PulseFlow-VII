document.addEventListener("DOMContentLoaded", () => {
  console.log("Script criseGastriteNova.js carregado");

  const form = document.querySelector(".form-card");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const paciente = JSON.parse(localStorage.getItem("pacienteSelecionado"));
    console.log("Paciente carregado:", paciente);

    const pacienteId = paciente?._id || paciente?.id;

    if (!pacienteId) {
      alert("Paciente não selecionado. Volte à tela de seleção.");
      return;
    }

    const body = {
      paciente: pacienteId,
      cpfPaciente: paciente.cpf,
      data: document.querySelector('input[type="date"]').value,
      intensidadeDor: parseInt(document.querySelector('select').value),
      sintomas: document.querySelector('input[placeholder="Ex: queimação, azia, náusea..."]').value,
      alimentosIngeridos: document.querySelectorAll('textarea')[0].value,
      medicacao: document.querySelector('input[placeholder="Nome do medicamento"]').value,
      alivioMedicacao: document.querySelectorAll('select')[1].value === 'sim',
      observacoes: document.querySelectorAll('textarea')[1].value
    };

    try {
      const res = await fetch("http://localhost:5500/api/gastrite/crises", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao salvar crise');

      alert("Crise de gastrite salva com sucesso!");
      form.reset();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  });
});
