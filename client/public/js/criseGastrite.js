document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('criseForm');
    const crisesList = document.getElementById('crisesList');
    const filterForm = document.getElementById('filterForm');
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');
    const intensityFilter = document.getElementById('intensityFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');

    // Carregar crises ao iniciar
    loadCrises();

    // Manipular envio do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const pacienteSelecionado = JSON.parse(localStorage.getItem('pacienteSelecionado'));
            
            if (!token) {
                throw new Error('Token não encontrado');
            }
            
            if (!pacienteSelecionado || !pacienteSelecionado.cpf) {
                throw new Error('Paciente não selecionado. Por favor, selecione um paciente primeiro.');
            }

            const formData = {
                cpfPaciente: pacienteSelecionado.cpf,
                data: document.getElementById('data').value,
                intensidadeDor: parseInt(document.getElementById('intensidadeDor').value),
                sintomas: document.getElementById('sintomas').value,
                alimentosIngeridos: document.getElementById('alimentosIngeridos').value,
                medicacao: document.getElementById('medicacao').value,
                alivioMedicacao: document.getElementById('alivioMedicacao').checked,
                observacoes: document.getElementById('observacoes').value
            };

            const response = await fetch('http://localhost:65432/api/crise-gastrite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar crise');
            }

            alert('Crise registrada com sucesso!');
            form.reset();
            loadCrises();

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao salvar crise: ' + error.message);
        }
    });

    // Carregar crises
    async function loadCrises() {
        try {
            const token = localStorage.getItem('token');
            const pacienteSelecionado = JSON.parse(localStorage.getItem('pacienteSelecionado'));
            
            if (!token) {
                throw new Error('Token não encontrado');
            }
            
            if (!pacienteSelecionado || !pacienteSelecionado.cpf) {
                throw new Error('Paciente não selecionado. Por favor, selecione um paciente primeiro.');
            }

            let url = `http://localhost:65432/api/crise-gastrite/${pacienteSelecionado.cpf}`;
            const params = new URLSearchParams();

            if (monthFilter.value) {
                params.append('month', monthFilter.value);
            }
            if (yearFilter.value) {
                params.append('year', yearFilter.value);
            }
            if (intensityFilter.value) {
                params.append('intensity', intensityFilter.value);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar crises');
            }

            const crises = await response.json();
            displayCrises(crises);

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar crises: ' + error.message);
        }
    }

    // Exibir crises na lista
    function displayCrises(crises) {
        crisesList.innerHTML = '';
        
        if (crises.length === 0) {
            crisesList.innerHTML = '<p class="text-center text-muted">Nenhuma crise registrada</p>';
            return;
        }

        crises.forEach(crise => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title">Crise em ${new Date(crise.data).toLocaleDateString()}</h5>
                        <span class="badge ${getIntensityBadgeClass(crise.intensidadeDor)}">
                            Intensidade: ${crise.intensidadeDor}/10
                        </span>
                    </div>
                    <div class="mt-2">
                        <p><strong>Sintomas:</strong> ${crise.sintomas || 'Não informado'}</p>
                        <p><strong>Alimentos ingeridos:</strong> ${crise.alimentosIngeridos || 'Não informado'}</p>
                        <p><strong>Medicação:</strong> ${crise.medicacao || 'Não informado'}</p>
                        <p><strong>Alívio com medicação:</strong> ${crise.alivioMedicacao ? 'Sim' : 'Não'}</p>
                        ${crise.observacoes ? `<p><strong>Observações:</strong> ${crise.observacoes}</p>` : ''}
                    </div>
                </div>
            `;
            crisesList.appendChild(card);
        });
    }

    // Função auxiliar para definir a classe do badge de intensidade
    function getIntensityBadgeClass(intensidade) {
        if (intensidade <= 3) return 'bg-success';
        if (intensidade <= 7) return 'bg-warning';
        return 'bg-danger';
    }

    // Manipular filtros
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadCrises();
    });

    // Limpar filtros
    clearFiltersBtn.addEventListener('click', () => {
        monthFilter.value = '';
        yearFilter.value = '';
        intensityFilter.value = '';
        loadCrises();
    });

    // Preencher o select de anos
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}); 