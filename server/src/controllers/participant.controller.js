import classStateService from '../services/classState.service.js';

export const getParticipants = (req, res) => {
  const list = classStateService.getAllParticipants();
  return res.status(200).json({
    success: true,
    data: list,
  });
};

export const joinParticipant = (req, res) => {
  const { sanitizedName } = req.body;
  const status = classStateService.getClassStatus();

  if (!status.isLive) {
    return res.status(403).json({
      success: false,
      message: 'Class is currently offline.',
      isLive: false,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Allowed to join class.',
    participant: {
      name: sanitizedName,
      role: 'student',
    },
  });
};

export const leaveParticipant = (req, res) => {
  const { socketId } = req.body;
  if (socketId) {
    classStateService.removeParticipant(socketId);
  }
  return res.status(200).json({
    success: true,
    message: 'Left class.',
  });
};

export const getAttendanceLogs = (req, res) => {
  const logs = classStateService.getAttendanceReport();
  return res.status(200).json({
    success: true,
    data: logs,
  });
};
