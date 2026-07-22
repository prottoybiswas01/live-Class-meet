import classStateService from '../services/classState.service.js';
import { serverLogger } from '../config/winston.js';

export const registerClassControlHandlers = (io, socket) => {
  // Admin Host controls
  socket.on('start-class', () => {
    const status = classStateService.startClass();
    io.emit('class-status-change', status);
  });

  socket.on('end-class', () => {
    const status = classStateService.endClass();
    io.emit('class-status-change', status);
    io.emit('class-ended', { message: 'Class has been ended by Host.' });
  });

  socket.on('toggle-control', ({ control, value }) => {
    const updatedStatus = classStateService.toggleControl(control, value);
    io.emit('control-update', { control, value, updatedStatus });
  });

  socket.on('mute-all', () => {
    classStateService.muteAllStudents();
    io.emit('participant-list', classStateService.getAllParticipants());
    io.emit('mute-all', { message: 'All student microphones muted by Host' });
  });

  socket.on('remove-participant', ({ socketId }) => {
    const p = classStateService.removeParticipant(socketId);
    if (p) {
      serverLogger.info(`Host removed participant ${p.name} (${socketId})`);
      io.to(socketId).emit('removed-by-host', { message: 'You have been removed from the class by the host.' });
      io.emit('participant-list', classStateService.getAllParticipants());
    }
  });

  socket.on('mic-approval', ({ socketId, approved }) => {
    const p = classStateService.approveMicRequest(socketId, approved);
    if (p) {
      io.to(socketId).emit('mic-approval-response', { approved, participant: p });
      io.emit('participant-list', classStateService.getAllParticipants());
    }
  });
};
