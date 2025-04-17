import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationCode = async (to, code) => {
  try {
    await transporter.sendMail({
      from: `"PulseFlow" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Código de verificação 2FA',
      text: `Seu código de verificação é: ${code}`,
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error('Erro ao enviar código de verificação.');
  }
};
