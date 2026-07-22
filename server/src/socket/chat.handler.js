import classStateService from '../services/classState.service.js';

export const registerChatHandlers = (io, socket) => {
  socket.on('chat-message', ({ text }) => {
    try {
      if (!text || !text.trim()) return;

      const message = classStateService.addChatMessage(socket.id, text.trim());
      io.emit('chat-message', message);
    } catch (error) {
      socket.emit('error-message', { message: error.message });
    }
  });
};
