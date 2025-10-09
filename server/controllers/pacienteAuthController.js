import Paciente from '../models/Paciente.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registrarPaciente = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      cpf,
      rg,
      phone,
      secondaryPhone,
      birthDate,
      gender,
      maritalStatus,
      nationality,
      address,
      height,
      weight,
      profession,
      acceptedTerms,
      profilePhoto
    } = req.body;

    // Verificar se o email já existe
    const pacienteExistente = await Paciente.findOne({ email });
    if (pacienteExistente) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Verificar se o CPF já existe
    const cpfExistente = await Paciente.findOne({ cpf });
    if (cpfExistente) {
      return res.status(400).json({ message: 'CPF já cadastrado' });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o paciente com todos os campos
    const novoPaciente = new Paciente({
      name,
      email,
      password: hashedPassword,
      cpf,
      rg,
      phone,
      secondaryPhone,
      birthDate,
      gender,
      maritalStatus,
      nationality,
      address,
      height,
      weight,
      profession,
      acceptedTerms: acceptedTerms || false,
      profilePhoto,
      // Campos legacy para compatibilidade
      nome: name,
      senha: hashedPassword,
      telefone: phone,
      dataNascimento: birthDate,
      genero: gender,
      fotoPerfil: profilePhoto,
      altura: height?.toString(),
      peso: weight?.toString(),
      profissao: profession
    });

    await novoPaciente.save();
    
    // Retornar o paciente criado (sem a senha)
    const pacienteResponse = novoPaciente.toObject();
    delete pacienteResponse.password;
    delete pacienteResponse.senha;
    
    res.status(201).json({
      message: 'Paciente cadastrado com sucesso!',
      patient: pacienteResponse
    });
  } catch (error) {
    console.error('Erro no registro de paciente:', error);
    res.status(500).json({
      message: 'Erro no registro',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
    });
  }
};

export const loginPaciente = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const paciente = await Paciente.findOne({ email });
    if (!paciente) {
      return res.status(400).json({ message: 'Paciente não encontrado' });
    }

    const senhaOk = await bcrypt.compare(senha, paciente.senha);
    if (!senhaOk) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: paciente._id, cpf: paciente.cpf },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );    

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Erro no login', error });
  }
};
