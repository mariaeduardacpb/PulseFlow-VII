import jwt from 'jsonwebtoken';
import Paciente from '../models/Paciente.js';

export const authPacienteMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const paciente = await Paciente.findById(decoded.id);
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    req.user = paciente;
    req.user.tipo = 'paciente';
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Token inválido' });
  }
};