import classStateService from '../services/classState.service.js';
import { uploadFileToDrive } from '../services/googleDrive.service.js';
import { recordingLogger } from '../config/winston.js';

export const getRecordingStatus = (req, res) => {
  const status = classStateService.getClassStatus();
  return res.status(200).json({
    success: true,
    isRecording: status.isRecording,
    recStartTime: status.recStartTime,
  });
};

export const startRecording = (req, res) => {
  const status = classStateService.setRecordingStatus(true);
  recordingLogger.info('Recording started by Host');

  if (req.io) {
    req.io.emit('recording-status-change', { isRecording: true, recStartTime: status.recStartTime });
  }

  return res.status(200).json({
    success: true,
    message: 'Recording started.',
    data: status,
  });
};

export const stopRecording = (req, res) => {
  const status = classStateService.setRecordingStatus(false);
  recordingLogger.info('Recording stopped by Host');

  if (req.io) {
    req.io.emit('recording-status-change', { isRecording: false });
  }

  return res.status(200).json({
    success: true,
    message: 'Recording stopped. Ready for Google Drive upload.',
    data: status,
  });
};

export const uploadRecording = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video recording file provided in request.',
      });
    }

    const filePath = req.file.path;
    const fileName = `Lecture-Recording-${Date.now()}${req.file.filename.slice(req.file.filename.lastIndexOf('.'))}`;

    recordingLogger.info(`Received recording file for upload: ${req.file.filename} (${req.file.size} bytes)`);

    // Notify clients that Google Drive upload has started
    if (req.io) {
      req.io.emit('recording-upload-progress', { status: 'uploading', progress: 0 });
    }

    // Trigger upload service with exponential backoff & auto local deletion
    const driveResult = await uploadFileToDrive({
      filePath,
      fileName,
      mimeType: req.file.mimetype || 'video/webm',
      onProgress: (progress) => {
        if (req.io) {
          req.io.emit('recording-upload-progress', { status: 'uploading', progress });
        }
      },
    });

    if (req.io) {
      req.io.emit('recording-upload-progress', {
        status: 'completed',
        progress: 100,
        result: driveResult,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Recording uploaded successfully to Google Drive. Temporary local file deleted.',
      data: driveResult,
    });
  } catch (error) {
    recordingLogger.error(`Upload recording failed: ${error.message}`);
    if (req.io) {
      req.io.emit('recording-upload-progress', { status: 'failed', error: error.message });
    }
    next(error);
  }
};
