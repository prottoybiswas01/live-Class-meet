import classStateService from '../services/classState.service.js';

export const registerParticipantHandlers = (io, socket) => {
  // Always join the global classroom socket room
  socket.join('live-class-room');

  socket.on('request-join', ({ name, role = 'student', color }) => {
    // If Host joins, automatically mark class as live
    if (role === 'admin') {
      classStateService.startClass();
      const participant = classStateService.addParticipant(socket.id, name, role, color);
      socket.emit('room-joined', {
        self: participant,
        classStatus: classStateService.getClassStatus(),
        participants: classStateService.getAllParticipants(),
        messages: classStateService.getChatHistory(),
      });
      io.to('live-class-room').emit('participant-list', classStateService.getAllParticipants());
      io.to('live-class-room').emit('class-status-change', classStateService.getClassStatus());
      return;
    }

    // Always broadcast student knock admission request to Host
    io.to('live-class-room').emit('join-request-received', {
      socketId: socket.id,
      name,
      role: 'student',
      color: color || '#6C6FEF',
    });

    socket.emit('waiting-for-approval', { message: 'Waiting for host to admit you to the class...' });
  });

  socket.on('approve-join', ({ socketId, approved, name, color }) => {
    if (approved) {
      // Auto start class if host admits student
      classStateService.startClass();

      const participant = classStateService.addParticipant(socketId, name || 'Student', 'student', color || '#6C6FEF');
      io.to(socketId).emit('room-joined', {
        self: participant,
        classStatus: classStateService.getClassStatus(),
        participants: classStateService.getAllParticipants(),
        messages: classStateService.getChatHistory(),
      });
      io.to('live-class-room').emit('participant-joined', participant);
      io.to('live-class-room').emit('participant-list', classStateService.getAllParticipants());
    } else {
      io.to(socketId).emit('join-denied', { message: 'The host has denied your request to join the class.' });
    }
  });

  socket.on('join-room', ({ name, role = 'student', color }) => {
    if (role === 'admin') {
      classStateService.startClass();
    }

    const participant = classStateService.addParticipant(socket.id, name, role, color);

    // Notify other peers in room of new participant
    socket.broadcast.to('live-class-room').emit('participant-joined', participant);

    // Send current state, participant list, and chat history to the newly joined user
    socket.emit('room-joined', {
      self: participant,
      classStatus: classStateService.getClassStatus(),
      participants: classStateService.getAllParticipants(),
      messages: classStateService.getChatHistory(),
    });

    // Broadcast updated participant list
    io.to('live-class-room').emit('participant-list', classStateService.getAllParticipants());
  });

  socket.on('toggle-media', ({ mic, cam, hand }) => {
    const updated = classStateService.updateMediaStatus(socket.id, { mic, cam, hand });
    if (updated) {
      io.to('live-class-room').emit('participant-updated', updated);
      io.to('live-class-room').emit('participant-list', classStateService.getAllParticipants());
    }
  });

  socket.on('request-mic', () => {
    classStateService.requestMic(socket.id);
    const p = classStateService.getParticipantBySocket(socket.id);
    io.to('live-class-room').emit('mic-request-received', { socketId: socket.id, name: p ? p.name : 'Student' });
  });

  socket.on('end-class', () => {
    const status = classStateService.endClass();
    io.to('live-class-room').emit('class-ended', { message: 'The teacher has ended this live lecture session.' });
    io.to('live-class-room').emit('class-status-change', status);
  });

  socket.on('disconnect', () => {
    const participant = classStateService.removeParticipant(socket.id);
    if (participant) {
      io.to('live-class-room').emit('participant-left', { socketId: socket.id, name: participant.name });
      io.to('live-class-room').emit('participant-list', classStateService.getAllParticipants());

      // If Host disconnects, automatically notify all students and mark class ended
      if (participant.role === 'admin') {
        const status = classStateService.endClass();
        io.to('live-class-room').emit('class-ended', { message: 'The teacher has ended or left the live lecture session.' });
        io.to('live-class-room').emit('class-status-change', status);
      }
    }
  });
};
