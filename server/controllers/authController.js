import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import otpService from '../services/otpService.js';
import tokenService from '../services/tokenService.js';

// Função para registrar um novo usuário
export const register = async (req, res) => {
  try {
    const { senha, email, rqe } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    const requiredFields = [
      'nome', 'cpf', 'genero', 'email', 'senha', 'crm',
      'areaAtuacao', 'telefonePessoal', 'cep',
      'enderecoConsultorio', 'numeroConsultorio'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `Campo obrigatório ausente: ${field}` });
      }
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const rqeArray = Array.isArray(rqe) ? rqe.filter(r => r) : [];

    const newUser = new User({
      ...req.body,
      senha: hashedPassword,
      rqe: rqeArray
    });

    await newUser.save();

    try {
      await sendWelcomeEmail(email);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de boas-vindas:', emailError);
    }

    res.status(201).json({ message: 'Usuário registrado com sucesso! Um e-mail de boas-vindas foi enviado.' });
  } catch (err) {
    console.error('Erro detalhado no registro:', err);
    res.status(500).json({ 
      message: 'Erro ao registrar.',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
    });
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
    subject: '🎉 Bem-vindo(a) ao PulseFlow!',
    html: `
      <div style="max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border-radius: 10px; border: 1px solid #e0e0e0; font-family: 'Segoe UI', sans-serif;">
        <div style="text-align: center;">
          <img src="https://imgur.com/8WWX04s" alt="Logo Pulse Flow" style="max-width: 200px;" />
          <h2 style="color: #333;">Olá, ${email} 👋</h2>
        </div>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">
          Seja muito bem-vindo(a) à nossa plataforma! Agora você pode acompanhar sua saúde de forma integrada e inteligente com o PulseFlow.
        </p>
        <p style="font-size: 16px; color: #444;">
          Caso tenha dúvidas, nossa equipe está pronta para te ajudar.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pulseflow.app" style="background-color: #0D6EFD; color: #ffffff; padding: 12px 24px; font-size: 16px; border-radius: 6px; text-decoration: none;">🌐 Acessar Plataforma</a>
        </div>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Esta é uma mensagem automática. Por favor, não responda.</p>
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
  subject: '🔐 Seu Código de Verificação - PulseFlow',
  html: `
    <div style="max-width: 600px; margin: auto; padding: 40px; background-color: #fefefe; border-radius: 10px; border: 1px solid #ccc; font-family: Arial, sans-serif;">
      <img src="https://imgur.com/8WWX04s" alt="Logo Pulse Flow" style="max-width: 200px;" />
      <h2 style="color: #0D6EFD; text-align: center;">Código de Verificação</h2>
      <p style="text-align: center; font-size: 16px; color: #333;">Utilize o código abaixo para continuar seu login:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #222; background-color: #eee; padding: 10px 20px; border-radius: 8px; display: inline-block;">
          ${otpCode}
        </span>
      </div>
      <p style="font-size: 14px; text-align: center; color: #666;">Este código é válido por 10 minutos.</p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #aaa; text-align: center;">Se você não solicitou esse código, ignore este e-mail.</p>
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
    const resetLink = `http://localhost:65432/client/views/reset-password-form.html?token=${token}`;

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
      subject: '🔑 Redefinição de Senha - PulseFlow',
      html: `
        <div style="max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border-radius: 10px; border: 1px solid #ccc; font-family: 'Segoe UI', sans-serif;">
          <div style="text-align: center;">
          <img src="https://imgur.com/8WWX04s" alt="Logo Pulse Flow" style="max-width: 200px;" />
            <h2 style="color: #333;">Olá, ${user.nome || 'usuário'} 👋</h2>
          </div>
          <p style="font-size: 16px; color: #555;">Recebemos uma solicitação para redefinir sua senha.</p>
          <p style="font-size: 16px; color: #555;">Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0D6EFD; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px;">🔁 Redefinir Senha</a>
          </div>
          <p style="font-size: 14px; color: #888;">Se você não fez essa solicitação, ignore este e-mail. O link expira em 1 hora.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">Esta é uma mensagem automática. Não é necessário responder.</p>
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
