import classStateService from '../services/classState.service.js';

export const registerParticipantHandlers = (io, socket) => {
  socket.on('request-join', ({ name, role = 'student', color }) => {
    const status = classStateService.getClassStatus();
    if (!status.isLive && role !== 'admin') {
      socket.emit('error-message', { message: 'Class is currently offline.' });
      return;
    }

    if (role === 'admin') {
      const participant = classStateService.addParticipant(socket.id, name, role, color);
      socket.emit('room-joined', {
        self: participant,
        classStatus: classStateService.getClassStatus(),
        participants: classStateService.getAllParticipants(),
        messages: classStateService.getChatHistory(),
      });
      io.emit('participant-list', classStateService.getAllParticipants());
    } else {
      // Broadcast knock admission request to all sockets so active Host/Teacher receives it reliably
      io.emit('join-request-received', {
        socketId: socket.id,
        name,
        role,
        color,
      });

      socket.emit('waiting-for-approval', { message: 'Waiting for host to admit you to the class...' });
    }
  });

  socket.on('approve-join', ({ socketId, approved, name, color }) => {
    if (approved) {
      const participant = classStateService.addParticipant(socketId, name || 'Student', 'student', color || '#6C6FEF');
      io.to(socketId).emit('room-joined', {
        self: participant,
        classStatus: classStateService.getClassStatus(),
        participants: classStateService.getAllParticipants(),
        messages: classStateService.getChatHistory(),
      });
      io.emit('participant-joined', participant);
      io.emit('participant-list', classStateService.getAllParticipants());
    } else {
      io.to(socketId).emit('join-denied', { message: 'The host has denied your request to join the class.' });
    }
  });

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
