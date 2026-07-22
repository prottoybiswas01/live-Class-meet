import express from 'express';
import { adminLogin, getAdminProfile } from '../controllers/admin.controller.js';
import { verifyAdminJWT } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateLoginInput } from '../middleware/validate.middleware.js';

const router = express.Router();

router.post('/login', authLimiter, validateLoginInput, adminLogin);
router.get('/me', verifyAdminJWT, getAdminProfile);

export default router;
