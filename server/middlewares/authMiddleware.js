import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado, token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const medico = await User.findById(decoded.id);
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    req.user = medico;
    req.user.tipo = 'medico';
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token inválido' });
  }
};
