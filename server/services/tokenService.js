import jwt from 'jsonwebtoken';

const generateToken = (payload, expiresIn = '2h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export default {
  generateToken,
  verifyToken
};
