import classStateService from '../services/classState.service.js';
import { serverLogger } from '../config/winston.js';

export const getClassStatus = (req, res) => {
  const status = classStateService.getClassStatus();
  return res.status(200).json({
    success: true,
    data: status,
  });
};

export const startClass = (req, res) => {
  const status = classStateService.startClass();
  serverLogger.info('REST API: Class started by Admin');

  // Notify socket clients via io attachment if present
  if (req.io) {
    req.io.emit('class-status-change', status);
  }

  return res.status(200).json({
    success: true,
    message: 'Classroom is now LIVE.',
    data: status,
  });
};

export const endClass = (req, res) => {
  const status = classStateService.endClass();
  serverLogger.info('REST API: Class ended by Admin');

  if (req.io) {
    req.io.emit('class-status-change', status);
  }

  return res.status(200).json({
    success: true,
    message: 'Classroom has been ended.',
    data: status,
  });
};

export const updateClassControls = (req, res) => {
  const { control, value } = req.body;
  if (!control) {
    return res.status(400).json({
      success: false,
      message: 'Control name is required.',
    });
  }

  const updatedStatus = classStateService.toggleControl(control, value);

  if (req.io) {
    req.io.emit('control-update', { control, value, updatedStatus });
  }

  return res.status(200).json({
    success: true,
    message: `Control ${control} updated.`,
    data: updatedStatus,
  });
};

export const muteAllParticipants = (req, res) => {
  const participants = classStateService.muteAllStudents();

  if (req.io) {
    req.io.emit('mute-all', { message: 'All student microphones muted by Host' });
    req.io.emit('participant-list', participants);
  }

  return res.status(200).json({
    success: true,
    message: 'Muted all student microphones.',
  });
};
