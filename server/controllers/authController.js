import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpService from '../services/otpService.js';
import tokenService from '../services/tokenService.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { senha, email } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const otp = otpService.generateOTP();

    const newUser = new User({
      ...req.body,
      senha: hashedPassword,
      otp: otp.code,
      otpExpires: otp.expires,
    });

    await newUser.save();

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar.', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    const token = tokenService.generateToken({ id: user._id, email: user.email });

    res.status(200).json({ message: 'Login realizado com sucesso!', token });
  } catch (err) {
    console.error('Erro no login:', err); // <-- ADICIONA ISSO
    res.status(500).json({ message: 'Erro ao fazer login.', error: err.message });
  }
};


export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ message: "OTP não encontrado." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Código OTP incorreto." });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Código expirado." });
    }

    // Invalida o OTP após uso
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Verificação 2FA bem-sucedida!" });
  } catch (err) {
    res.status(500).json({ message: "Erro ao verificar OTP.", error: err.message });
  }
};


