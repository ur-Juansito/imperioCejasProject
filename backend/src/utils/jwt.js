const jwt = require('jsonwebtoken');

exports.generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '8h') => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres.');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

exports.verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
