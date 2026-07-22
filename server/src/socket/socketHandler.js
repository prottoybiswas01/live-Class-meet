import { registerSignalingHandlers } from './signaling.handler.js';
import { registerChatHandlers } from './chat.handler.js';
import { registerClassControlHandlers } from './classControl.handler.js';
import { registerParticipantHandlers } from './participant.handler.js';
import classStateService from '../services/classState.service.js';
import { serverLogger } from '../config/winston.js';

export const initializeSocketIO = (io) => {
  io.on('connection', (socket) => {
    serverLogger.info(`New Socket.IO Connection: ${socket.id}`);

    // Register modular handlers
    registerSignalingHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerClassControlHandlers(io, socket);
    registerParticipantHandlers(io, socket);

    socket.on('disconnect', () => {
      serverLogger.info(`Socket disconnected: ${socket.id}`);
      const participant = classStateService.removeParticipant(socket.id);
      if (participant) {
        io.emit('participant-left', { socketId: socket.id, participant });
        io.emit('participant-list', classStateService.getAllParticipants());
      }
    });
  });
};
