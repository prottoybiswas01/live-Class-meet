import { serverLogger } from '../config/winston.js';

export const registerSignalingHandlers = (io, socket) => {
  // Relay SDP offer from one peer to another target peer
  socket.on('webrtc-offer', ({ targetSocketId, offer }) => {
    serverLogger.info(`WebRTC offer relayed from ${socket.id} to ${targetSocketId}`);
    socket.to(targetSocketId).emit('webrtc-offer', {
      senderSocketId: socket.id,
      offer,
    });
  });

  // Relay SDP answer back to host / caller
  socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
    serverLogger.info(`WebRTC answer relayed from ${socket.id} to ${targetSocketId}`);
    socket.to(targetSocketId).emit('webrtc-answer', {
      senderSocketId: socket.id,
      answer,
    });
  });

  // Relay ICE candidate between peers
  socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
    socket.to(targetSocketId).emit('webrtc-ice-candidate', {
      senderSocketId: socket.id,
      candidate,
    });
  });
};
