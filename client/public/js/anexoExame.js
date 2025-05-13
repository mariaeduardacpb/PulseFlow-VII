document.addEventListener("DOMContentLoaded", () => {
  const examGrid = document.getElementById("examGrid");
  const semExamesMsg = document.getElementById("no-data-msg");
  const contadorExames = document.getElementById("contador-exames");

  let examesCarregados = []; // <<< variável global para armazenar exames

  function renderizarExames(listaExames) {
    examGrid.innerHTML = "";

    if (listaExames.length === 0) {
      semExamesMsg.style.display = "block";
      contadorExames.style.display = "none";
    } else {
      semExamesMsg.style.display = "none";
      contadorExames.style.display = "block";
      contadorExames.textContent = `🔎 ${listaExames.length} exame${listaExames.length > 1 ? 's' : ''} encontrado${listaExames.length > 1 ? 's' : ''}.`;

      listaExames.forEach((exame) => {
        const card = document.createElement("div");
        card.className = "exam-card";
        card.innerHTML = `
          <p><strong>${exame.nome}</strong></p>
          <p>Especialidade: ${exame.categoria}</p>
          <p>Data: ${new Date(exame.data).toLocaleDateString()}</p>
          <button onclick="baixarExame('${exame._id}', '${exame.nome}')">Baixar</button>
        `;
        examGrid.appendChild(card);
      });
    }
  }

  // Buscar exames do paciente
  async function buscarExamesPaciente() {
    try {
      const tokenMedico = localStorage.getItem('token');
      const tokenPaciente = localStorage.getItem('tokenPaciente');

      if (!tokenMedico || !tokenPaciente) {
        alert("Sessão expirada. Faça login novamente!");
        return;
      }

      const [, payloadBase64] = tokenPaciente.split('.');
      if (!payloadBase64) {
        alert("Token de paciente inválido.");
        return;
      }

      const decodedPayload = JSON.parse(atob(payloadBase64));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        alert("CPF não encontrado no token do paciente.");
        return;
      }

      const response = await fetch(`http://localhost:5500/api/anexoExame/medico?cpf=${cpf}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      const exames = await response.json();

      if (!response.ok) {
        alert("Erro ao buscar exames!");
        return;
      }

      examesCarregados = exames; // <<< salva para usar no filtro
      renderizarExames(examesCarregados);

    } catch (error) {
      console.error('Erro ao buscar exames:', error);
      alert("Erro interno ao buscar exames.");
    }
  }

  // Função para baixar exame
  window.baixarExame = async function (idExame, nomeExame) {
    try {
      const token = localStorage.getItem('token');
  
      const response = await fetch(`http://localhost:5000/api/anexoExame/download/${idExame}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        alert("Erro ao baixar o exame!");
        return;
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      // Pega a extensão real pelo tipo MIME retornado
      const contentType = response.headers.get("Content-Type");
      let extensao = '';
  
      if (contentType.includes('pdf')) {
        extensao = 'pdf';
      } else if (contentType.includes('jpeg')) {
        extensao = 'jpg'; // para imagens JPEG ou JFIF
      } else if (contentType.includes('jfif')) {
        extensao = 'jfif';
      } else if (contentType.includes('png')) {
        extensao = 'png';
      } else {
        extensao = 'file'; // fallback
      }
  
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nomeExame}.${extensao}`; // agora usa a extensão real!
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar exame:', error);
      alert("Erro interno ao baixar exame.");
    }
  };

  // Filtro local dos exames carregados
  document.getElementById("buscarExameBtn").addEventListener("click", () => {
    const nomeBusca = document.getElementById('nomeExame').value.trim().toLowerCase();
    const especialidadeBusca = document.getElementById('especialidade').value.trim().toLowerCase();
    const dataBusca = document.getElementById('dataExame').value;

    const examesFiltrados = examesCarregados.filter(exame => {
      const nomeExame = exame.nome.toLowerCase();
      const categoriaExame = exame.categoria.toLowerCase();
      const dataExame = new Date(exame.data);
      const dataExameFormatada = `${dataExame.getFullYear()}-${String(dataExame.getMonth() + 1).padStart(2, '0')}-${String(dataExame.getDate()).padStart(2, '0')}`;

      let nomeCombina = true;
      let especialidadeCombina = true;
      let dataCombina = true;

      if (nomeBusca) {
        nomeCombina = nomeExame.includes(nomeBusca);
      }

      if (especialidadeBusca) {
        especialidadeCombina = categoriaExame.includes(especialidadeBusca);
      }

      if (dataBusca) {
        dataCombina = dataBusca === dataExameFormatada;
      }

      return nomeCombina && especialidadeCombina && dataCombina;
    });

    renderizarExames(examesFiltrados);
  });

  // Carrega os exames assim que a página abrir
  buscarExamesPaciente();
});
