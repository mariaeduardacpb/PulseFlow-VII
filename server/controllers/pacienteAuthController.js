import Paciente from '../models/Paciente.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registrarPaciente = async (req, res) => {
  const { nome, cpf, email, senha } = req.body;

  try {
    const pacienteExistente = await Paciente.findOne({ email });
    if (pacienteExistente) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const novoPaciente = new Paciente({
      nome,
      cpf,
      email,
      senha: hashedPassword,
    });

    await novoPaciente.save();
    res.status(201).json({ message: 'Paciente cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no registro', error });
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
