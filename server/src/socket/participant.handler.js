import classStateService from '../services/classState.service.js';

export const registerParticipantHandlers = (io, socket) => {
  socket.on('join-room', ({ name, role = 'student', color }) => {
    const status = classStateService.getClassStatus();
    if (!status.isLive && role !== 'admin') {
      socket.emit('error-message', { message: 'Class is currently offline.' });
      return;
    }

    const participant = classStateService.addParticipant(socket.id, name, role, color);

    // Notify other peers in room of new participant
    socket.broadcast.emit('participant-joined', participant);

    // Send current state, participant list, and chat history to the newly joined user
    socket.emit('room-joined', {
      self: participant,
      classStatus: classStateService.getClassStatus(),
      participants: classStateService.getAllParticipants(),
      messages: classStateService.getChatHistory(),
    });

    // Broadcast updated participant list
    io.emit('participant-list', classStateService.getAllParticipants());
  });

  socket.on('toggle-media', ({ mic, cam, hand }) => {
    const updated = classStateService.updateMediaStatus(socket.id, { mic, cam, hand });
    if (updated) {
      io.emit('participant-updated', updated);
      io.emit('participant-list', classStateService.getAllParticipants());
    }
  });

  socket.on('request-mic', () => {
    classStateService.requestMic(socket.id);
    const p = classStateService.getParticipantBySocket(socket.id);
    io.emit('mic-request-received', { socketId: socket.id, name: p ? p.name : 'Student' });
  });
};
