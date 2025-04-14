// authController.js

import User from '../models/User.js';  // Importando o modelo do usuário
import bcrypt from 'bcrypt';          // Biblioteca para criptografar senhas
import otpService from '../services/otpService.js';  // Importando o serviço de OTP

export const register = async (req, res) => {
  try {
    // Desestruturando os dados recebidos da requisição
    const { senha, email } = req.body;

    // Criptografando a senha com bcrypt
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Gerando o OTP usando o serviço otpService
    const otp = otpService.generateOTP();

    // Criando um novo usuário com os dados fornecidos, incluindo a senha criptografada e o OTP
    const newUser = new User({
      ...req.body,
      senha: hashedPassword,
      otp: otp.code,         // Código OTP gerado
      otpExpires: otp.expires,  // Data de expiração do OTP
    });

    // Salvando o novo usuário no banco de dados
    await newUser.save();

    // Retornando a resposta para o cliente
    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    // Caso ocorra algum erro, retornamos uma resposta com o erro
    res.status(500).json({ message: 'Erro ao registrar.', error: err.message });
  }
};
