import express from 'express';
import {
  getClassStatus,
  startClass,
  endClass,
  updateClassControls,
  muteAllParticipants,
} from '../controllers/class.controller.js';
import { verifyAdminJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route to check class status
router.get('/status', getClassStatus);

// Admin Protected Routes
router.post('/start', verifyAdminJWT, startClass);
router.post('/end', verifyAdminJWT, endClass);
router.post('/controls', verifyAdminJWT, updateClassControls);
router.post('/mute-all', verifyAdminJWT, muteAllParticipants);

export default router;
