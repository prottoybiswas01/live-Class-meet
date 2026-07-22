import express from 'express';
import {
  getParticipants,
  joinParticipant,
  leaveParticipant,
  getAttendanceLogs,
} from '../controllers/participant.controller.js';
import { validateJoinInput } from '../middleware/validate.middleware.js';
import { verifyAdminJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getParticipants);
router.post('/join', validateJoinInput, joinParticipant);
router.post('/leave', leaveParticipant);
router.get('/attendance', verifyAdminJWT, getAttendanceLogs);

export default router;
