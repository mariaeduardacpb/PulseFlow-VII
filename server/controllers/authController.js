import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import otpService from '../services/otpService.js';
import tokenService from '../services/tokenService.js';

// Função para registrar um novo usuário
export const register = async (req, res) => {
  try {
    const { senha, email } = req.body;

    // Verificando se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    // Criptografando a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criando um novo usuário
    const newUser = new User({
      ...req.body,
      senha: hashedPassword,
    });

    // Salvando o novo usuário no banco de dados
    await newUser.save();

    // Enviando e-mail de boas-vindas
    await sendWelcomeEmail(email);

    res.status(201).json({ message: 'Usuário registrado com sucesso! Um e-mail de boas-vindas foi enviado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar.', error: err.message });
  }
};

// Função para enviar o e-mail de boas-vindas
const sendWelcomeEmail = async (email) => {
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
    subject: 'Bem-vindo ao PulseFlow!',
    html: `
      <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <div style="text-align: center;">
          <h1 style="color: #007bff; font-size: 28px;">PulseFlow</h1>
          <h2 style="color: #333; font-size: 22px;">Olá, ${email} 👋</h2>
        </div>
        <p style="font-size: 16px; color: #555;">Bem-vindo à nossa plataforma PulseFlow! Estamos muito felizes em tê-lo conosco.</p>
        <p style="font-size: 16px; color: #555;">Se você tiver alguma dúvida, nossa equipe está à disposição para ajudar.</p>
        <p style="font-size: 16px; color: #555;">Atenciosamente, <br /> Equipe PulseFlow 🚀</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 14px; color: #aaa;">Esta mensagem foi enviada automaticamente. Por favor, não responda.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Função para login com envio de OTP
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

    // Verificando a senha
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) return res.status(401).json({ message: 'Senha incorreta.' });

    // Gerando OTP para o login
    const otp = otpService.generateOTP();
    user.otp = otp.code;
    user.otpExpires = otp.expires;
    await user.save();

    // Enviando o OTP por e-mail
    await sendOTPByEmail(email, otp.code);

    res.status(200).json({
      message: 'Código de verificação enviado para o e-mail.',
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login.', error: err.message });
  }
};

// Função para verificar o OTP
export const verifyOTP = async (req, res) => {
  const { userId, code } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    // Verificando se o código do OTP é válido e não expirou
    if (user.otp !== code || new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Código inválido ou expirado.' });
    }

    // Limpa o OTP após a verificação
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Gerando token JWT
    const token = tokenService.generateToken({ id: user._id, email: user.email });
    res.status(200).json({ message: 'Verificação concluída com sucesso!', token });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao verificar código.', error: err.message });
  }
};

// Função para enviar um novo OTP
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    // Gerando um novo OTP
    const otp = otpService.generateOTP();
    user.otp = otp.code;
    user.otpExpires = otp.expires;
    await user.save();

    // Enviando o OTP por e-mail
    await sendOTPByEmail(email, otp.code);

    res.status(200).json({ message: 'Novo código de verificação enviado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar o OTP.', error: err.message });
  }
};

// Função para enviar e-mail com OTP
const sendOTPByEmail = async (email, otpCode) => {
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
    subject: 'Código de Verificação',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h2 style="color: #007bff;">Código de Verificação</h2>
        <p style="font-size: 16px;">Seu código de verificação é:</p>
        <h3 style="font-size: 24px; color: #333;">${otpCode}</h3>
        <p style="font-size: 14px;">Este código é válido por 10 minutos.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Função para solicitar redefinição de senha
export const resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado.' });

    // Gerando token de redefinição de senha
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
          <p style="font-size: 16px; color: #555;">Recebemos uma solicitação para redefinir sua senha. Para prosseguir, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; display: inline-block;">🔁 Redefinir minha senha</a>
          </div>
          <p style="font-size: 14px; color: #888;">Se você não solicitou esta redefinição, pode ignorar este e-mail. O link é válido por 1 hora.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 14px; color: #aaa;">Esta mensagem foi enviada automaticamente. Por favor, não responda.</p>
          <p style="font-size: 14px; color: #aaa;">Atenciosamente, Equipe PulseFlow 🚀</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Link de redefinição de senha enviado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar e-mail.', error: err.message });
  }
};

// Confirmação da redefinição de senha
export const confirmResetPassword = async (req, res) => {
  const { senha, token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    // Criptografando a nova senha
    const hashedPassword = await bcrypt.hash(senha, 10);
    user.senha = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao redefinir a senha.', error: err.message });
  }
};
