import jwt from 'jsonwebtoken';
import { authLogger } from '../config/winston.js';

export const verifyAdminJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      authLogger.warn(`Unauthorized admin API access attempt from IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication token required.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-admin-jwt-token-key-change-in-production');
    
    if (decoded.role !== 'admin') {
      authLogger.warn(`Forbidden access attempt with non-admin token from IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin credentials required.',
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    authLogger.error(`Invalid JWT token attempt: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token.',
    });
  }
};
