import express from 'express';
import {
  getRecordingStatus,
  startRecording,
  stopRecording,
  uploadRecording,
} from '../controllers/recording.controller.js';
import { verifyAdminJWT } from '../middleware/auth.middleware.js';
import { recordingUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/status', getRecordingStatus);
router.post('/start', verifyAdminJWT, startRecording);
router.post('/stop', verifyAdminJWT, stopRecording);
router.post('/upload', verifyAdminJWT, recordingUpload.single('video'), uploadRecording);

export default router;
