export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

export const CLASS_STATUS = {
  OFFLINE: 'OFFLINE',
  LIVE: 'LIVE',
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_CLASS: 'join-class',
  LEAVE_CLASS: 'leave-class',
  CLASS_STATUS_CHANGE: 'class-status-change',
  CONTROL_UPDATE: 'control-update',
  PARTICIPANT_LIST: 'participant-list',
  PARTICIPANT_JOINED: 'participant-joined',
  PARTICIPANT_LEFT: 'participant-left',
  CHAT_MESSAGE: 'chat-message',
  HAND_RAISE: 'hand-raise',
  MIC_REQUEST: 'mic-request',
  MIC_APPROVAL: 'mic-approval',
  MUTE_ALL: 'mute-all',
  REMOVE_PARTICIPANT: 'remove-participant',
  WEBRTC_OFFER: 'webrtc-offer',
  WEBRTC_ANSWER: 'webrtc-answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc-ice-candidate',
  RECORDING_STATUS_CHANGE: 'recording-status-change',
  RECORDING_UPLOAD_PROGRESS: 'recording-upload-progress',
};
