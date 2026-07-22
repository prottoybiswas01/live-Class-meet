import jwt from 'jsonwebtoken';
import { authLogger } from '../config/winston.js';

export const adminLogin = (req, res) => {
  const { username, password } = req.body;
  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (username !== envUsername || password !== envPassword) {
    authLogger.warn(`Failed admin login attempt for username: "${username}" from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid Admin credentials.',
    });
  }

  const token = jwt.sign(
    { role: 'admin', username: envUsername },
    process.env.JWT_SECRET || 'super-secret-admin-jwt-token-key-change-in-production',
    { expiresIn: '24h' }
  );

  authLogger.info(`Admin successfully authenticated from IP: ${req.ip}`);

  return res.status(200).json({
    success: true,
    message: 'Admin authentication successful.',
    token,
    admin: {
      username: envUsername,
      role: 'admin',
    },
  });
};

export const getAdminProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
  });
};
