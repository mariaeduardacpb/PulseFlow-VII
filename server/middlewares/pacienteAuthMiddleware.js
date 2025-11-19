import jwt from 'jsonwebtoken';
import Paciente from '../models/Paciente.js';

export const authPacienteMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key_for_development_2024';
    
    const decoded = jwt.verify(token, jwtSecret);

    const pacienteId = decoded.id || decoded.sub;
    if (!pacienteId) {
      return res.status(400).json({ message: 'Token inválido: ID do paciente não encontrado' });
    }

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    req.user = paciente;
    req.user.tipo = 'paciente';
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: `Token inválido: ${err.message}. Faça login novamente.` });
    }
    return res.status(400).json({ message: `Token inválido: ${err.message}` });
  }
};