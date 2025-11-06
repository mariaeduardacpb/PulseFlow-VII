document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            title: 'Erro',
            text: 'Você precisa estar logado para acessar esta página',
            icon: 'error',
            confirmButtonText: 'Ir para Login',
            confirmButtonColor: '#002A42'
        }).then(() => {
            window.location.href = '../views/login.html';
        });
        return;
    }

    // Máscaras para os campos
    const telefoneMask = IMask(document.getElementById('telefone'), {
        mask: '(00) 00000-0000'
    });

    const telefoneConsultorioMask = IMask(document.getElementById('telefoneConsultorio'), {
        mask: [
            { mask: '(00) 0000-0000' }, // Telefone fixo
            { mask: '(00) 00000-0000' } // Celular
        ]
    });

    const cepMask = IMask(document.getElementById('cep'), {
        mask: '00000-000'
    });

    const cpfMask = IMask(document.getElementById('cpf'), {
        mask: '000.000.000-00'
    });

    // Event listeners
    document.getElementById('profileForm').addEventListener('submit', salvarAlteracoes);
    document.getElementById('editBtn').addEventListener('click', habilitarEdicao);
    document.getElementById('saveBtn').addEventListener('click', salvarAlteracoes);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        Swal.fire({
            title: 'Cancelar Edição',
            text: 'Tem certeza que deseja cancelar as alterações?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, Cancelar',
            cancelButtonText: 'Não, Continuar Editando',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#002A42'
        }).then((result) => {
            if (result.isConfirmed) {
                desabilitarEdicao();
            }
        });
    });
    document.getElementById('logoutBtn').addEventListener('click', fazerLogout);
    document.getElementById('cep').addEventListener('blur', buscarCep);
    document.getElementById('changePhotoBtn').addEventListener('click', alterarFoto);
    document.getElementById('addRqeBtn').addEventListener('click', adicionarCampoRQE);

    // Carregar dados iniciais
    carregarDadosMedico();
});

async function refreshToken() {
    try {
        const oldToken = localStorage.getItem('token');
        const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: oldToken })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar token');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        return data.token;
    } catch (error) {
        console.error('Erro ao atualizar token:', error);
        throw error;
    }
}

async function carregarDadosMedico() {
    try {
        const API_URL = window.API_URL || 'http://localhost:65432';
        const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados do médico');
        }

        const medico = await response.json();
        console.log('Dados recebidos da API:', medico);
        
        // Formatar telefones em um objeto
        const telefones = {
            pessoal: medico.telefonePessoal || '',
            consultorio: medico.telefoneConsultorio || ''
        };
        console.log('Telefones formatados:', telefones);

        // Preencher campos do formulário
        document.getElementById('nome').value = medico.nome || '';
        document.getElementById('cpf').value = medico.cpf || '';
        document.getElementById('email').value = medico.email || '';
        document.getElementById('genero').value = medico.genero || '';
        document.getElementById('crm').value = medico.crm || '';
        document.getElementById('especialidade').value = medico.areaAtuacao || '';
        document.getElementById('telefone').value = telefones.pessoal;
        document.getElementById('telefoneConsultorio').value = telefones.consultorio;
        document.getElementById('cep').value = medico.cep || '';
        document.getElementById('endereco').value = medico.enderecoConsultorio || '';
        document.getElementById('numero').value = medico.numeroConsultorio || '';
        document.getElementById('complemento').value = medico.complemento || '';
        document.getElementById('bairro').value = medico.bairro || '';
        document.getElementById('cidade').value = medico.cidade || '';
        document.getElementById('estado').value = medico.estado || '';

        // Aplicar máscaras nos campos
        IMask(document.getElementById('telefone'), {
            mask: '(00) 00000-0000'
        });
        
        IMask(document.getElementById('telefoneConsultorio'), {
            mask: [
                { mask: '(00) 0000-0000' }, // Telefone fixo
                { mask: '(00) 00000-0000' } // Celular
            ]
        });
        
        IMask(document.getElementById('cep'), {
            mask: '00000-000'
        });

        IMask(document.getElementById('cpf'), {
            mask: '000.000.000-00'
        });

        // Carregar foto do perfil
        if (medico.foto) {
            document.getElementById('profileImage').src = medico.foto;
        }

        // Limpar e recriar campos RQE
        const rqeContainer = document.getElementById('rqeContainer');
        rqeContainer.innerHTML = '';
        
        console.log('RQEs recebidos:', medico.rqe);
        
        // Se não houver RQEs, cria um campo vazio
        if (!medico.rqe || medico.rqe.length === 0) {
            const rqeField = criarCampoRQE('');
            rqeContainer.appendChild(rqeField);
        } else {
            // Adiciona cada RQE como um campo
            medico.rqe.forEach(rqe => {
                if (rqe !== null && rqe !== undefined) {
                    const rqeField = criarCampoRQE(rqe.toString());
                    rqeContainer.appendChild(rqeField);
                }
            });
        }

    } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar os dados do perfil'
        });
    }
}

function criarCampoRQE(valor = '') {
    const rqeRow = document.createElement('div');
    rqeRow.className = 'rqe-row';
    
    const rqeGroup = document.createElement('div');
    rqeGroup.className = 'rqe-group';
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = 'RQE';
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-certificate input-icon';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = valor;
    input.readOnly = true;
    input.maxLength = 6;
    
    // Aplicar máscara de 6 dígitos
    IMask(input, {
        mask: '000000',
        prepare: function(str) {
            return str.replace(/[^0-9]/g, '');
        }
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-rqe-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.style.display = 'none';
    
    removeBtn.onclick = function() {
        rqeRow.remove();
        atualizarBotoesRQE();
    };
    
    // Montar a estrutura corretamente
    inputWrapper.appendChild(icon);
    inputWrapper.appendChild(input);
    inputGroup.appendChild(label);
    inputGroup.appendChild(inputWrapper);
    rqeGroup.appendChild(inputGroup);
    rqeGroup.appendChild(removeBtn);
    rqeRow.appendChild(rqeGroup);
    
    return rqeRow;
}

function atualizarBotoesRQE() {
    const rqeContainer = document.getElementById('rqeContainer');
    const addRqeRow = document.getElementById('addRqeRow');
    const rqeRows = rqeContainer.getElementsByClassName('rqe-row');
    
    // Mostra o botão de adicionar apenas se estiver em modo de edição
    if (document.getElementById('editBtn').style.display === 'none') {
        addRqeRow.style.display = 'flex';
    }
    
    // Atualiza os números dos RQEs
    Array.from(rqeRows).forEach((row, index) => {
        const label = row.querySelector('label');
        const input = row.querySelector('input');
        const numero = index + 1;
        label.htmlFor = `rqe${numero}`;
        label.textContent = `RQE ${numero}`;
        input.id = `rqe${numero}`;
        input.name = `rqe${numero}`;
    });
}

function adicionarCampoRQE() {
    const rqeContainer = document.getElementById('rqeContainer');
    const rqeRows = rqeContainer.getElementsByClassName('rqe-row');
    const novoNumero = rqeRows.length + 1;
    
    const novoCampo = criarCampoRQE(novoNumero);
    rqeContainer.appendChild(novoCampo);
    
    // Se estiver em modo de edição, mostrar o botão de remover e tornar o campo editável
    if (document.getElementById('editBtn').style.display === 'none') {
        const removeBtn = novoCampo.querySelector('.remove-rqe-btn');
        const input = novoCampo.querySelector('input');
        
        removeBtn.style.display = 'flex';
        input.readOnly = false;
        
        // Reaplicar a máscara para o novo campo
        IMask(input, {
            mask: '000000',
            prepare: function(str) {
                return str.replace(/[^0-9]/g, '');
            }
        });
    }
    
    atualizarBotoesRQE();
}

function preencherFormulario(user) {
    console.log('Preenchendo formulário com dados:', user);
    
    // Campos do formulário
    document.getElementById('nome').value = user.nome || '';
    document.getElementById('genero').value = user.genero || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('crm').value = user.crm || '';
    
    // Limpar e preencher RQEs
    const rqeContainer = document.getElementById('rqeContainer');
    rqeContainer.innerHTML = '';
    
    const rqeArray = Array.isArray(user.rqe) ? user.rqe : [];
    rqeArray.forEach((rqe, index) => {
        const rqeRow = criarCampoRQE(index + 1, rqe);
        rqeContainer.appendChild(rqeRow);
    });
    
    document.getElementById('especialidade').value = user.areaAtuacao || '';
    
    // Aplicar máscaras aos telefones
    const telefoneMask = IMask(document.getElementById('telefone'), {
        mask: '(00) 00000-0000'
    });
    telefoneMask.value = user.telefonePessoal || '';
    
    const telefoneConsultorioMask = IMask(document.getElementById('telefoneConsultorio'), {
        mask: [
            { mask: '(00) 0000-0000' }, // Telefone fixo
            { mask: '(00) 00000-0000' } // Celular
        ]
    });
    telefoneConsultorioMask.value = user.telefoneConsultorio || '';
    
    // Endereço
    const cepMask = IMask(document.getElementById('cep'), {
        mask: '00000-000'
    });
    cepMask.value = user.cep || '';
    
    document.getElementById('endereco').value = user.enderecoConsultorio || '';
    document.getElementById('numero').value = user.numeroConsultorio || '';

    // Foto do perfil
    const profileImage = document.getElementById('profileImage');
    if (user.foto) {
        console.log('URL da foto:', user.foto);
        profileImage.src = user.foto;
        profileImage.onerror = () => {
            console.error('Erro ao carregar imagem:', user.foto);
            profileImage.src = '../public/assets/user_logo.png';
        };
    } else {
        console.log('Nenhuma foto encontrada, usando imagem padrão');
        profileImage.src = '../public/assets/user_logo.png';
    }
}

async function alterarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verificar tamanho do arquivo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                title: 'Erro',
                text: 'A imagem deve ter no máximo 5MB',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#002A42'
            });
            return;
        }

        // Verificar tipo do arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                title: 'Erro',
                text: 'Formato de arquivo não suportado. Use apenas JPG, JPEG ou PNG.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#002A42'
            });
            return;
        }

        // Mostrar preview da imagem antes do upload
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result;
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('foto', file);

        try {
            let token = localStorage.getItem('token');
            console.log('Token usado no upload:', token);

            const response = await fetch('/api/usuarios/perfil/foto', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.status === 401) {
                // Token expirado, tenta refresh
                token = await refreshToken();
                // Tenta o upload novamente com o novo token
                const newResponse = await fetch('/api/usuarios/perfil/foto', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!newResponse.ok) {
                    const errorData = await newResponse.json();
                    throw new Error(errorData.message || 'Erro ao atualizar foto');
                }

                const newData = await newResponse.json();
                document.getElementById('profileImage').src = newData.fotoUrl;
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao atualizar foto');
            }

            // Atualiza a imagem com a URL retornada pelo servidor
            document.getElementById('profileImage').src = data.fotoUrl;

            Swal.fire({
                title: 'Sucesso!',
                text: 'Foto atualizada com sucesso.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#002A42'
            });
        } catch (error) {
            console.error('Erro ao atualizar foto:', error);
            // Reverte para a imagem anterior em caso de erro
            carregarDadosMedico();
            
            if (error.message.includes('Token inválido') || error.message.includes('não autorizado')) {
                Swal.fire({
                    title: 'Sessão Expirada',
                    text: 'Sua sessão expirou. Por favor, faça login novamente.',
                    icon: 'warning',
                    confirmButtonText: 'Ir para Login',
                    confirmButtonColor: '#002A42'
                }).then(() => {
                    window.location.href = '../views/login.html';
                });
                return;
            }
            
            Swal.fire({
                title: 'Erro',
                text: error.message || 'Não foi possível atualizar a foto. Por favor, tente novamente.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#002A42'
            });
        }
    };

    input.click();
}

async function salvarAlteracoes(event) {
    event.preventDefault();

    // Mostrar popup de salvamento
    Swal.fire({
        title: 'Salvando alterações...',
        text: 'Por favor, aguarde enquanto salvamos suas informações.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const token = localStorage.getItem('token');

        // Coletar dados do formulário
        const dadosPerfil = {
            nome: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            genero: document.getElementById('genero').value.trim(),
            crm: document.getElementById('crm').value.trim(),
            areaAtuacao: document.getElementById('especialidade').value.trim(),
            telefonePessoal: document.getElementById('telefone').value.replace(/\D/g, ''),
            telefoneConsultorio: document.getElementById('telefoneConsultorio').value.replace(/\D/g, ''),
            cep: document.getElementById('cep').value.replace(/\D/g, ''),
            enderecoConsultorio: document.getElementById('endereco').value.trim(),
            numeroConsultorio: document.getElementById('numero').value.trim(),
            complemento: document.getElementById('complemento').value.trim(),
            bairro: document.getElementById('bairro').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            estado: document.getElementById('estado').value.trim()
        };

        // Coletar RQEs
        const rqeInputs = document.querySelectorAll('#rqeContainer input');
        const rqeValues = Array.from(rqeInputs)
            .map(input => input.value.replace(/\D/g, ''))
            .filter(rqe => rqe && rqe.trim() !== '');
        
        dadosPerfil.rqe = rqeValues;

        console.log('Dados a serem enviados:', dadosPerfil);

        // Fazer a requisição com JSON
        const API_URL = window.API_URL || 'http://localhost:65432';
        const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosPerfil)
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Se a resposta não for ok, lançar erro com a mensagem do servidor
            const errorMessage = responseData.message || responseData.error || 'Erro ao salvar alterações';
            throw new Error(errorMessage);
        }

        // Atualizar Firestore se disponível (para monitoramento em tempo real)
        // Fazer de forma não-bloqueante (não esperar, apenas tentar)
        if (window.firebaseDb && typeof firebase !== 'undefined') {
            // Executar em background, não bloquear o fluxo
            (async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const userId = payload._id || payload.id || payload.userId;
                        
                        if (userId) {
                            // Usar os dados retornados ou montar objeto com os dados salvos
                            const firestoreData = responseData.usuario || responseData || dadosPerfil;
                            
                            // Criar objeto de atualização
                            const updateData = {
                                ...firestoreData,
                                updatedAt: typeof firebase !== 'undefined' && firebase.firestore 
                                    ? firebase.firestore.FieldValue.serverTimestamp() 
                                    : new Date()
                            };
                            
                            // Tentar atualizar com timeout
                            const updatePromise = window.firebaseDb.collection('medicos').doc(userId).set(updateData, { merge: true });
                            const timeoutPromise = new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Timeout')), 3000)
                            );
                            
                            await Promise.race([updatePromise, timeoutPromise]);
                            console.log('✅ Dados atualizados no Firestore');
                        }
                    }
                } catch (firestoreError) {
                    // Silenciar erros do Firestore - não é crítico, o polling vai detectar mudanças
                    console.log('ℹ️ Firestore não disponível para atualização (usando polling)');
                }
            })();
        }

        // Fechar popup de salvamento e mostrar sucesso
        Swal.close();
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: responseData.message || 'Suas informações foram salvas com sucesso.',
            confirmButtonColor: '#002A42'
        });

        desabilitarEdicao();
        await carregarDadosMedico();

    } catch (error) {
        console.error('Erro ao salvar:', error);
        Swal.close();
        
        // Mostrar mensagem de erro específica
        let errorMessage = 'Não foi possível salvar as alterações. Por favor, tente novamente.';
        
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response && error.response.data) {
            errorMessage = error.response.data.message || errorMessage;
        }

        // Verificar se é erro de autenticação
        if (errorMessage.includes('Token') || errorMessage.includes('não autorizado') || errorMessage.includes('expirou')) {
            Swal.fire({
                icon: 'warning',
                title: 'Sessão Expirada',
                text: 'Sua sessão expirou. Por favor, faça login novamente.',
                confirmButtonText: 'Ir para Login',
                confirmButtonColor: '#002A42'
            }).then(() => {
                window.location.href = '../views/login.html';
            });
            return;
        }

        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: errorMessage,
            confirmButtonColor: '#002A42'
        });
    }
}

async function buscarCep() {
    const cepInput = document.getElementById('cep');
    
    // Só buscar CEP se o campo estiver editável
    if (cepInput.readOnly) {
        return;
    }
    
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        return;
    }

    try {
        // Mostrar loading
        Swal.fire({
            title: 'Buscando CEP...',
            text: 'Por favor, aguarde.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        Swal.close();

        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        // Preencher todos os campos do endereço
        document.getElementById('endereco').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
        
        // Limpar o campo número apenas se não estiver preenchido
        if (!document.getElementById('numero').value) {
            document.getElementById('numero').value = '';
        }

        // Mostrar mensagem de sucesso
        Swal.fire({
            title: 'CEP encontrado!',
            text: 'Os dados do endereço foram preenchidos automaticamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#002A42'
        });

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        Swal.fire({
            title: 'Erro',
            text: error.message === 'CEP não encontrado' 
                ? 'CEP não encontrado. Por favor, verifique se o CEP está correto.' 
                : 'Não foi possível buscar o CEP. Por favor, verifique sua conexão e tente novamente.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#002A42'
        });
    }
}

function fazerLogout() {
    window.location.href = '../views/selecao.html';
}

function habilitarEdicao() {
    // Esconder botão de editar e mostrar botões de salvar e cancelar
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('changePhotoBtn').disabled = false;
    document.getElementById('changePhotoBtn').style.display = 'inline-block';
    
    // Esconder botão voltar
    document.getElementById('logoutBtn').style.display = 'none';
    
    // Mostrar botão de adicionar RQE
    document.getElementById('addRqeRow').style.display = 'table-row';
    
    // Mostrar botões de remover RQE
    const removeButtons = document.querySelectorAll('.remove-rqe-btn');
    removeButtons.forEach(btn => btn.style.display = 'inline-block');
    
    // Tornar campos editáveis
    const camposEditaveis = [
        'telefone',
        'telefoneConsultorio',
        'cep',
        'endereco',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'estado',
        'especialidade'
    ];
    
    camposEditaveis.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.readOnly = false;
            
            // Aplicar máscaras específicas para cada campo
            if (campo === 'telefone') {
                IMask(input, {
                    mask: '(00) 00000-0000'
                });
            } else if (campo === 'telefoneConsultorio') {
                IMask(input, {
                    mask: [
                        { mask: '(00) 0000-0000' }, // Telefone fixo
                        { mask: '(00) 00000-0000' } // Celular
                    ]
                });
            } else if (campo === 'cep') {
                IMask(input, {
                    mask: '00000-000'
                });
            }
        }
    });
    
    // Tornar campos RQE editáveis
    const rqeInputs = document.querySelectorAll('#rqeContainer input');
    rqeInputs.forEach(input => {
        input.readOnly = false;
        IMask(input, {
            mask: '000000'
        });
    });
}

function desabilitarEdicao() {
    // Esconder botões de edição
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('changePhotoBtn').disabled = true;
    document.getElementById('changePhotoBtn').style.display = 'none';
    
    // Mostrar botão voltar
    document.getElementById('logoutBtn').style.display = 'inline-block';
    
    // Esconder botão de adicionar RQE
    document.getElementById('addRqeRow').style.display = 'none';
    
    // Esconder botões de remover RQE
    const removeButtons = document.querySelectorAll('.remove-rqe-btn');
    removeButtons.forEach(btn => btn.style.display = 'none');
    
    // Tornar todos os campos readonly
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => input.readOnly = true);
    
    // Recarregar dados do médico
    carregarDadosMedico().catch(error => {
        console.error('Erro ao recarregar dados:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Não foi possível recarregar os dados do perfil. Por favor, tente novamente.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#002A42'
        }).then(() => {
            window.location.reload();
        });
    });
}