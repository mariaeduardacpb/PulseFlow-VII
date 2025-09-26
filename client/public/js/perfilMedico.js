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
        mask: '(00) 00000-0000'
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
        const response = await fetch('http://localhost:65432/api/usuarios/perfil', {
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
            mask: '(00) 0000-0000'
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
    
    const label = document.createElement('label');
    label.textContent = 'RQE';
    
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
    
    rqeGroup.appendChild(label);
    rqeGroup.appendChild(input);
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
        mask: '(00) 00000-0000'
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
        const formData = new FormData();
        const token = localStorage.getItem('token');

        // Coletar dados do formulário
        formData.append('nome', document.getElementById('nome').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('genero', document.getElementById('genero').value);
        formData.append('crm', document.getElementById('crm').value);
        formData.append('areaAtuacao', document.getElementById('especialidade').value);
        formData.append('telefonePessoal', document.getElementById('telefone').value.replace(/\D/g, ''));
        formData.append('telefoneConsultorio', document.getElementById('telefoneConsultorio').value.replace(/\D/g, ''));
        formData.append('cep', document.getElementById('cep').value.replace(/\D/g, ''));
        formData.append('enderecoConsultorio', document.getElementById('endereco').value);
        formData.append('numeroConsultorio', document.getElementById('numero').value);

        // Coletar RQEs
        const rqeInputs = document.querySelectorAll('#rqeContainer input');
        const rqeValues = Array.from(rqeInputs).map(input => input.value.replace(/\D/g, ''));
        formData.append('rqe', JSON.stringify(rqeValues));

        // Fazer a requisição
        const response = await fetch('http://localhost:65432/api/usuarios/perfil', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar alterações');
        }

        // Fechar popup de salvamento e mostrar sucesso
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Suas informações foram salvas com sucesso.',
            confirmButtonColor: '#002A42'
        });

        desabilitarEdicao();
        await carregarDadosMedico();

    } catch (error) {
        console.error('Erro:', error);
        // Fechar popup de salvamento e mostrar erro
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível salvar as alterações. Por favor, tente novamente.',
            confirmButtonColor: '#002A42'
        });
    }
}

async function buscarCep() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        return;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        document.getElementById('endereco').value = data.logradouro;
        document.getElementById('numero').value = '';

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        Swal.fire({
            title: 'Erro',
            text: 'Não foi possível buscar o CEP. Por favor, verifique se o CEP está correto.',
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
                    mask: '(00) 00000-0000'
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