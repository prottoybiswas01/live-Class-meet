import { v4 as uuidv4 } from 'uuid';
import { serverLogger } from '../config/winston.js';

class ClassStateService {
  constructor() {
    this.isLive = true; // Default to live session active
    this.isRecording = false;
    this.recStartTime = null;
    this.classStartTime = new Date();

    // Controls
    this.screenShareAllowed = true;
    this.chatAllowed = true;

    // Active participants: Map<socketId, ParticipantObject>
    this.participants = new Map();

    // Attendance Log: Array<{ id, name, joinTime, leaveTime, role }>
    this.attendanceLogs = [];

    // Chat messages: Array<{ id, senderName, senderRole, text, timestamp, color }>
    this.chatMessages = [];

    // Pending mic requests: Set<socketId>
    this.micRequests = new Set();
  }

  // --- Class Controls ---
  startClass() {
    this.isLive = true;
    this.classStartTime = new Date();
    serverLogger.info('Classroom marked LIVE by Admin');
    return this.getClassStatus();
  }

  endClass() {
    this.isLive = false;
    this.isRecording = false;
    const now = new Date();

    // Mark all active participants as left
    this.participants.forEach((participant, socketId) => {
      this.recordLeaveTime(socketId, now);
    });
    this.participants.clear();
    this.micRequests.clear();

    serverLogger.info('Classroom marked OFFLINE by Admin');
    return this.getClassStatus();
  }

  getClassStatus() {
    return {
      isLive: this.isLive,
      isRecording: this.isRecording,
      recStartTime: this.recStartTime,
      classStartTime: this.classStartTime,
      screenShareAllowed: this.screenShareAllowed,
      chatAllowed: this.chatAllowed,
      participantCount: this.participants.size,
    };
  }

  setRecordingStatus(isRecording) {
    this.isRecording = isRecording;
    this.recStartTime = isRecording ? new Date() : null;
    return this.getClassStatus();
  }

  toggleControl(controlName, value) {
    if (controlName === 'screenShare') {
      this.screenShareAllowed = typeof value === 'boolean' ? value : !this.screenShareAllowed;
    } else if (controlName === 'chat') {
      this.chatAllowed = typeof value === 'boolean' ? value : !this.chatAllowed;
    }
    return this.getClassStatus();
  }

  // --- Participant Operations ---
  addParticipant(socketId, name, role = 'student', color = '#6C6FEF') {
    const joinTime = new Date();
    const id = uuidv4();

    const participant = {
      id,
      socketId,
      name,
      role,
      color,
      joinTime,
      leaveTime: null,
      mic: role === 'admin', // Admin mic default on, student off
      cam: false,
      hand: false,
      connection: 'good',
    };

    this.participants.set(socketId, participant);

    // Track in attendance log
    this.attendanceLogs.push({
      id,
      name,
      role,
      joinTime,
      leaveTime: null,
    });

    serverLogger.info(`Participant joined: ${name} (${role}) [Socket: ${socketId}]`);
    return participant;
  }

  removeParticipant(socketId) {
    const participant = this.participants.get(socketId);
    if (participant) {
      const leaveTime = new Date();
      this.recordLeaveTime(socketId, leaveTime);
      this.participants.delete(socketId);
      this.micRequests.delete(socketId);
      serverLogger.info(`Participant left: ${participant.name} [Socket: ${socketId}]`);
      return participant;
    }
    return null;
  }

  recordLeaveTime(socketId, leaveTime = new Date()) {
    const participant = this.participants.get(socketId);
    if (participant) {
      const log = this.attendanceLogs.find((item) => item.id === participant.id && !item.leaveTime);
      if (log) {
        log.leaveTime = leaveTime;
      }
    }
  }

  getParticipantBySocket(socketId) {
    return this.participants.get(socketId);
  }

  getAllParticipants() {
    return Array.from(this.participants.values());
  }

  getAttendanceReport() {
    return this.attendanceLogs;
  }

  updateMediaStatus(socketId, { mic, cam, hand }) {
    const p = this.participants.get(socketId);
    if (!p) return null;

    if (typeof mic === 'boolean') p.mic = mic;
    if (typeof cam === 'boolean') p.cam = cam;
    if (typeof hand === 'boolean') p.hand = hand;

    return p;
  }

  muteAllStudents() {
    this.participants.forEach((p) => {
      if (p.role !== 'admin') {
        p.mic = false;
      }
    });
    this.micRequests.clear();
    serverLogger.info('Admin muted all student microphones');
    return this.getAllParticipants();
  }

  requestMic(socketId) {
    this.micRequests.add(socketId);
    return true;
  }

  approveMicRequest(socketId, approved) {
    this.micRequests.delete(socketId);
    const p = this.participants.get(socketId);
    if (p && approved) {
      p.mic = true;
    }
    return p;
  }

  // --- Chat ---
  addChatMessage(senderSocketId, text) {
    if (!this.chatAllowed) {
      throw new Error('Chat is currently disabled by the host');
    }

    const sender = this.participants.get(senderSocketId);
    const message = {
      id: uuidv4(),
      name: sender ? sender.name : 'Unknown',
      role: sender ? sender.role : 'student',
      color: sender ? sender.color : '#6C6FEF',
      text,
      timestamp: new Date(),
    };

    this.chatMessages.push(message);
    return message;
  }

  getChatHistory() {
    return this.chatMessages;
  }
}

export const classStateService = new ClassStateService();
export default classStateService;
