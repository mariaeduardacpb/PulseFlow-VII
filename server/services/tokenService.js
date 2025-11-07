import jwt from 'jsonwebtoken';

const generateToken = (payload, expiresIn = '24h') => {
  console.log('Gerando token com payload:', payload); // Debug
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  console.log('Token gerado:', token); // Debug
  return token;
};

const verifyToken = (token) => {
  console.log('Verificando token:', token); // Debug
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificado com sucesso:', decoded); // Debug
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token:', error); // Debug
    throw error;
  }
};

const refreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    return generateToken({ id: decoded.id, email: decoded.email });
  } catch (error) {
    throw new Error('Token inválido para refresh');
  }
};

export default {
  generateToken,
  verifyToken,
  refreshToken
};
