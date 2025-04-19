import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpService from '../services/otpService.js';
import tokenService from '../services/tokenService.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';


export const confirmResetPassword = async (req, res) => {
  const { senha, token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    user.senha = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao redefinir a senha.' });
    console.error(err);
  }
};


export const resetPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Usuário não encontrado.' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const resetLink = `http://localhost:5000/client/views/reset-password-form.html?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Redefinição de Senha - PulseFlow',
    html: `
      <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <div style="text-align: center;">
          <h1 style="color: #007bff; font-size: 28px;">PulseFlow</h1>
          <h2 style="color: #333; font-size: 22px;">Olá, ${user.nome || 'usuário'} 👋</h2>
        </div>

        <p style="font-size: 16px; color: #555;">Recebemos uma solicitação para redefinir a sua senha. Para prosseguir, basta clicar no botão abaixo:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
            🔁 Redefinir minha senha
          </a>
        </div>

        <p style="font-size: 14px; color: #888;">Se você não solicitou esta redefinição, pode ignorar este e-mail. O link é válido por 1 hora.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

        <p style="font-size: 14px; color: #aaa;">Esta mensagem foi enviada automaticamente. Por favor, não responda a este e-mail.</p>
        <p style="font-size: 14px; color: #aaa;">Atenciosamente, Equipe PulseFlow 🚀</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Link de redefinição de senha enviado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar e-mail de redefinição de senha.' });
    console.error(err);
  }
};

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

    if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) return res.status(401).json({ message: 'Senha incorreta.' });

    const token = tokenService.generateToken({ id: user._id, email: user.email });
    res.status(200).json({ message: 'Login realizado com sucesso!', token });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login.', error: err.message });
  }
};
