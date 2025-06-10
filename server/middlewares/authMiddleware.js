import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Token recebido no middleware:', token); // Debug

  if (!token) {
    console.log('Token não fornecido'); // Debug
    return res.status(401).json({ message: 'Acesso negado, token não fornecido' });
  }

  try {
    console.log('Tentando decodificar token...'); // Debug
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded); // Debug

    const medico = await User.findById(decoded.id);
    if (!medico) {
      console.log('Médico não encontrado'); // Debug
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    req.user = medico;
    req.user.tipo = 'medico';
    next();
  } catch (err) {
    console.error('Erro ao verificar token:', err); // Debug
    res.status(400).json({ message: 'Token inválido' });
  }
};
