import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, Circle,
  Users, MessageSquare, Hand, PhoneOff, Search, Sun, Moon, Monitor,
  X, Send, Smile, Radio, Wifi, Pin, ShieldCheck, VolumeX, UserX,
  PlayCircle, StopCircle, Upload, MonitorUp, Copy, Check, UserCheck
} from "lucide-react";

/* ---------------------------------------------------------------
   Theme & Styling Palette
----------------------------------------------------------------*/
const DARK = {
  bg: "bg-[#0B0E14]",
  surface: "bg-[#141822]",
  surfaceRaised: "bg-[#1B2029]",
  border: "border-[#262C3A]",
  text: "text-[#EEF0F4]",
  sub: "text-[#8B93A7]",
  faint: "text-[#5B637A]",
  ring: "ring-[#262C3A]",
  hoverSurface: "hover:bg-[#20242F]",
};

const LIGHT = {
  bg: "bg-[#F3F4F7]",
  surface: "bg-white",
  surfaceRaised: "bg-white",
  border: "border-[#E5E7EC]",
  text: "text-[#14161C]",
  sub: "text-[#666E80]",
  faint: "text-[#9198A8]",
  ring: "ring-[#E5E7EC]",
  hoverSurface: "hover:bg-[#F0F1F5]",
};

const AMBER = "#E8A33D";
const GREEN = "#5FC08B";
const RED = "#E5484D";

const AVATAR_COLORS = [
  "#6C6FEF", "#E8A33D", "#5FC08B", "#E5688C", "#4CB4C9",
  "#B18AF0", "#E27D5F", "#5FA8E8", "#C9C15F", "#E56A6A",
];

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function initials(name) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function gridColumns(n) {
  if (n <= 2) return 2;
  if (n <= 4) return 2;
  if (n <= 6) return 3;
  if (n <= 9) return 3;
  if (n <= 12) return 4;
  if (n <= 16) return 4;
  if (n <= 25) return 5;
  return 7;
}

/* ---------------------------------------------------------------
   Building Blocks
----------------------------------------------------------------*/
function Avatar({ name, color = "#6C6FEF", size = 56, ring }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{
        width: size, height: size, background: `${color}26`, color,
        fontSize: size * 0.36,
        boxShadow: ring ? `0 0 0 2px ${color}` : "none",
      }}
    >
      {initials(name)}
    </div>
  );
}

function StatusDot({ ok }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: ok ? GREEN : "#D9A441" }}
    />
  );
}

function ParticipantCard({ p, t, speaking, compact, onRemove, isSelf, localStream, remoteStream }) {
  const activeStream = isSelf ? localStream : remoteStream;
  const showVideo = p.cam && activeStream;

  return (
    <div
      className={`relative rounded-xl overflow-hidden border transition-all duration-300 ${t.border} ${t.surfaceRaised} flex items-center justify-center group bg-black`}
      style={{
        aspectRatio: compact ? "16/9" : "4/3",
        boxShadow: speaking ? `0 0 0 2px ${AMBER}, 0 0 24px -4px ${AMBER}66` : "none",
      }}
    >
      {showVideo ? (
        <video
          ref={(el) => {
            if (el && el.srcObject !== activeStream) {
              el.srcObject = activeStream;
            }
          }}
          autoPlay
          playsInline
          muted={isSelf}
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />
      ) : (
        <Avatar name={p.name} color={p.color || '#6C6FEF'} size={compact ? 32 : 48} />
      )}

      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 z-10">
        <span className="text-[10px] sm:text-[11px] font-medium truncate px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
          {p.name ? p.name.split(" ")[0] : "Student"} {p.role === 'admin' && '(Host)'}
        </span>
        <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
          {p.hand && <Hand size={11} color={AMBER} />}
          {p.mic ? <Mic size={11} color="#fff" /> : <MicOff size={11} color={RED} />}
        </div>
      </div>

      {onRemove && p.role !== 'admin' && (
        <button
          onClick={() => onRemove(p.socketId)}
          title="Remove Participant"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <UserX size={14} />
        </button>
      )}

      {speaking && (
        <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse z-10" style={{ boxShadow: `inset 0 0 0 1px ${AMBER}55` }} />
      )}
    </div>
  );
}

function ControlButton({ icon: Icon, active, danger, label, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 shrink-0
        ${danger ? "bg-[#E5484D] hover:bg-[#d13d42]" : active ? "text-white" : "bg-white/5 hover:bg-white/10 text-[#EEF0F4]"}
      `}
      style={active && !danger ? { background: AMBER, color: "#141822" } : undefined}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      {badge ? (
        <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 sm:h-4 px-1 rounded-full bg-[#E5484D] text-white text-[9px] sm:text-[10px] flex items-center justify-center font-semibold">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* ---------------------------------------------------------------
   Main Classroom Component
----------------------------------------------------------------*/
export default function ClassroomPage({ user, roomId, onLeave }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const activeRoomId = user?.roomId || roomId || 'class-session-1';

  // Theme states
  const [themeMode, setThemeMode] = useState("dark");
  const [systemDark, setSystemDark] = useState(true);
  const isDark = themeMode === "system" ? systemDark : themeMode === "dark";
  const t = isDark ? DARK : LIGHT;

  // Real-time server & socket state
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  const [classStatus, setClassStatus] = useState({
    isLive: true,
    isRecording: false,
    screenShareAllowed: true,
    chatAllowed: true,
  });
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  // Host Admission Requests State
  const [joinRequests, setJoinRequests] = useState([]);

  // Real Media Stream Refs & State
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Copy Link State
  const [copiedLink, setCopiedLink] = useState(false);

  // MediaRecorder for Recording
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Media states
  const [mic, setMic] = useState(isAdmin);
  const [cam, setCam] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [recElapsed, setRecElapsed] = useState(0);
  const [micRequests, setMicRequests] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
  }, []);

  // Class Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Recording Timer
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // WebRTC Peer Connection Creator
  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    const streamToSend = screenStreamRef.current || localStreamRef.current;
    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => {
        pc.addTrack(track, streamToSend);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("webrtc-ice-candidate", {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetSocketId]: event.streams[0],
        }));
      }
    };

    return pc;
  };

  // Broadcast WebRTC SDP renegotiation when new video/audio tracks are toggled
  const broadcastNewMediaStream = async (stream) => {
    if (!stream) return;
    for (const [targetSocketId, pc] of Object.entries(peerConnectionsRef.current)) {
      try {
        const senders = pc.getSenders();
        senders.forEach((sender) => pc.removeSender(sender));
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('webrtc-offer', { targetSocketId, offer });
      } catch (err) {
        console.warn(`WebRTC renegotiation error with ${targetSocketId}:`, err);
      }
    }
  };

  // Socket.IO & WebRTC Setup
  useEffect(() => {
    const SOCKET_SERVER_URL = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : 'https://live-class-meet.onrender.com';

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Join room
    socket.emit('join-room', {
      name: user.name,
      role: user.role,
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      roomId: activeRoomId,
    });

    socket.on('room-joined', (data) => {
      if (data.classStatus) setClassStatus(data.classStatus);
      if (data.participants) setParticipants(data.participants);
      if (data.messages) setMessages(data.messages);
    });

    socket.on('participant-list', (list) => {
      setParticipants(list);
    });

    socket.on('participant-joined', async (p) => {
      if (p.socketId !== socket.id) {
        try {
          const pc = createPeerConnection(p.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { targetSocketId: p.socketId, offer });
        } catch (e) {
          console.warn("WebRTC offer creation error:", e);
        }
      }
    });

    socket.on('webrtc-offer', async ({ senderSocketId, offer }) => {
      try {
        const pc = createPeerConnection(senderSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { targetSocketId: senderSocketId, answer });
      } catch (e) {
        console.warn("WebRTC answer creation error:", e);
      }
    });

    socket.on('webrtc-answer', async ({ senderSocketId, answer }) => {
      try {
        const pc = peerConnectionsRef.current[senderSocketId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        console.warn("WebRTC setRemoteDescription answer error:", e);
      }
    });

    socket.on('webrtc-ice-candidate', async ({ senderSocketId, candidate }) => {
      try {
        const pc = peerConnectionsRef.current[senderSocketId];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.warn("WebRTC addIceCandidate error:", e);
      }
    });

    socket.on('join-request-received', (reqData) => {
      if (user?.role === 'admin') {
        setJoinRequests((prev) => {
          const exists = prev.some((r) => r.socketId === reqData.socketId);
          if (exists) return prev;
          return [...prev, reqData];
        });
      }
    });

    socket.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('class-ended', ({ message }) => {
      cleanupMediaStreams();
      if (!user?.role || user?.role !== 'admin') {
        alert(message || "The teacher has ended this live lecture session.");
        onLeave();
      }
    });

    socket.on('class-status-change', (status) => {
      setClassStatus(status);
      setRecording(status.isRecording);
      if (!status.isLive && user?.role !== 'admin') {
        cleanupMediaStreams();
        onLeave();
      }
    });

    socket.on('control-update', ({ control, value, updatedStatus }) => {
      if (updatedStatus) setClassStatus(updatedStatus);
    });

    socket.on('mute-all', () => {
      setMic(false);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
      }
      socket.emit('toggle-media', { mic: false, cam, hand: handRaised });
    });

    socket.on('mic-request-received', (reqData) => {
      setMicRequests((prev) => [...prev, reqData]);
    });

    socket.on('removed-by-host', () => {
      alert("You have been removed from the class by the host.");
      handleCleanLeave();
    });

    socket.on('recording-status-change', ({ isRecording }) => {
      setRecording(isRecording);
      if (!isRecording) setRecElapsed(0);
    });

    socket.on('recording-upload-progress', (progressData) => {
      setUploadStatus(progressData);
    });

    return () => {
      socket.disconnect();
      cleanupMediaStreams();
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, [user]);

  const cleanupMediaStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
  };

  const handleCleanLeave = () => {
    cleanupMediaStreams();
    onLeave();
  };

  // Copy Class Link for Students
  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/join/${activeRoomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApproveJoin = (socketId, approved, name, color) => {
    socketRef.current?.emit('approve-join', { socketId, approved, name, color });
    setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId));
  };

  // Toggle Camera
  const handleToggleCam = async () => {
    if (!cam) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: mic,
        });
        localStreamRef.current = mediaStream;
        setLocalStream(mediaStream);
        setCam(true);
        socketRef.current?.emit('toggle-media', { mic, cam: true, hand: handRaised });

        await broadcastNewMediaStream(mediaStream);
      } catch (err) {
        console.error("Camera access denied or unavailable:", err);
        setCam(false);
        alert("Camera could not be accessed. Please allow camera permissions in browser settings.");
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
      }
      setCam(false);
      socketRef.current?.emit('toggle-media', { mic, cam: false, hand: handRaised });
    }
  };

  // Toggle Mic
  const handleToggleMic = async () => {
    const nextMic = !mic;
    setMic(nextMic);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMic;
      });
    } else if (nextMic) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localStreamRef.current) {
          audioStream.getAudioTracks().forEach((t) => localStreamRef.current.addTrack(t));
        } else {
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
        }
        await broadcastNewMediaStream(audioStream);
      } catch (e) {
        console.warn("Microphone access error:", e);
      }
    }

    socketRef.current?.emit('toggle-media', { mic: nextMic, cam, hand: handRaised });
  };

  // Toggle Screen Share (Google Meet style)
  const handleToggleScreenShare = async () => {
    if (!classStatus.screenShareAllowed && !isAdmin) {
      alert("Screen sharing is currently restricted by the host.");
      return;
    }

    if (!sharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true,
        });

        screenStreamRef.current = displayStream;
        setScreenStream(displayStream);
        setSharing(true);

        displayStream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };

        await broadcastNewMediaStream(displayStream);

        socketRef.current?.emit('toggle-media', { mic, cam, hand: handRaised, sharing: true });
      } catch (err) {
        console.error("Screen sharing error:", err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setSharing(false);
    socketRef.current?.emit('toggle-media', { mic, cam, hand: handRaised, sharing: false });
  };

  const handleToggleHand = () => {
    const newHand = !handRaised;
    setHandRaised(newHand);
    socketRef.current?.emit('toggle-media', { mic, cam: newHand });

    if (newHand && !isAdmin) {
      socketRef.current?.emit('request-mic');
    }
  };

  // Chat message sending
  const sendMessage = () => {
    if (!draft.trim()) return;
    socketRef.current?.emit('chat-message', { text: draft.trim() });
    setDraft("");
  };

  // Recording Toggle Handler (Browser MediaRecorder)
  const handleToggleRecording = async () => {
    const token = localStorage.getItem('adminToken');
    if (!recording) {
      const recordStream = screenStreamRef.current || localStreamRef.current;
      if (!recordStream) {
        alert("Please turn on your Camera or Screen Share first to start recording lecture video!");
        return;
      }

      try {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(recordStream, { mimeType: 'video/webm;codecs=vp9,opus' });
        
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Lecture-Class-Recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setRecording(true);

        await fetch('/api/class/recording/start', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Recording error:", err);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);

      await fetch('/api/class/recording/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  // Admin Control Handlers
  const handleStartClass = async () => {
    const token = localStorage.getItem('adminToken');
    await fetch('/api/class/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleEndClass = async () => {
    if (window.confirm("Are you sure you want to end the class for everyone?")) {
      const token = localStorage.getItem('adminToken');
      await fetch('/api/class/end', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  const handleMuteAll = async () => {
    const token = localStorage.getItem('adminToken');
    await fetch('/api/class/mute-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleRemoveParticipant = (socketId) => {
    socketRef.current?.emit('remove-participant', { socketId });
  };

  const handleApproveMic = (socketId, approved) => {
    socketRef.current?.emit('mic-approval', { socketId, approved });
    setMicRequests((prev) => prev.filter((r) => r.socketId !== socketId));
  };

  const cols = gridColumns(participants.length);
  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic Host Participant info
  const hostParticipant = participants.find((p) => p.role === 'admin');
  const hostDisplayName = hostParticipant ? hostParticipant.name : (isAdmin ? user.name : 'Teacher / Host');

  return (
    <div className={`w-full h-screen flex flex-col ${t.bg} ${t.text} font-sans overflow-hidden relative`}>
      {/* Hidden Audio Elements for Remote WebRTC Audio Tracks */}
      {Object.entries(remoteStreams).map(([socketId, rStream]) => (
        <audio
          key={socketId}
          autoPlay
          ref={(el) => {
            if (el && el.srcObject !== rStream) {
              el.srcObject = rStream;
            }
          }}
        />
      ))}

      {/* Host Knock/Admission Approval Popup Overlay */}
      {isAdmin && joinRequests.length > 0 && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-amber-500 text-zinc-950 font-semibold text-xs shadow-2xl backdrop-blur-md animate-bounce border-2 border-amber-300 max-w-[92vw]">
          <UserCheck size={18} className="shrink-0" />
          <span className="truncate"><strong>{joinRequests[0].name}</strong> wants to join ({joinRequests.length} pending)</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleApproveJoin(joinRequests[0].socketId, true, joinRequests[0].name, joinRequests[0].color)}
              className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-all shadow text-[11px]"
            >
              Admit
            </button>
            <button
              onClick={() => handleApproveJoin(joinRequests[0].socketId, false, joinRequests[0].name, joinRequests[0].color)}
              className="px-2.5 py-1 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-all shadow text-[11px]"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b ${t.border} ${t.surface} shrink-0 gap-2 flex-wrap sm:flex-nowrap`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-0" style={{ background: classStatus.isLive ? `${GREEN}1A` : `${RED}1A` }}>
            <Radio size={11} color={classStatus.isLive ? GREEN : RED} className={classStatus.isLive ? "rec-dot" : ""} />
            <span className="text-[11px] sm:text-xs font-semibold" style={{ color: classStatus.isLive ? GREEN : RED }}>
              {classStatus.isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <h1 className="text-xs sm:text-sm font-semibold truncate max-w-[140px] sm:max-w-none">Live Lecture Session</h1>
          <span className={`text-[11px] sm:text-xs mono ${t.sub} shrink-0`}>{formatTime(elapsed)}</span>

          {recording && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${RED}14` }}>
              <span className="w-1.5 h-1.5 rounded-full rec-dot" style={{ background: RED }} />
              <span className="text-xs font-medium mono" style={{ color: RED }}>REC {formatTime(recElapsed)}</span>
            </div>
          )}
        </div>

        {/* Copy Invite Link & Theme Toggles (Host ONLY sees Copy Link!) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isAdmin && (
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all ${
                copiedLink
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                  : "border-[#262C3A] hover:bg-white/10 text-[#EEF0F4]"
              }`}
              title="Copy Student Join Link"
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>
          )}

          {isAdmin && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border ${t.border} bg-white/5`}>
              {!classStatus.isLive ? (
                <button
                  onClick={handleStartClass}
                  className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1"
                >
                  <PlayCircle size={12} /> Start
                </button>
              ) : (
                <button
                  onClick={handleEndClass}
                  className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1"
                >
                  <StopCircle size={12} /> End
                </button>
              )}

              <button
                onClick={handleToggleRecording}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-colors flex items-center gap-1 ${
                  recording ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Circle size={10} fill={recording ? RED : "none"} color={recording ? RED : "white"} />
                {recording ? 'REC' : 'REC'}
              </button>
            </div>
          )}

          {/* Theme selector */}
          <div className={`flex items-center gap-0.5 rounded-full p-0.5 sm:p-1 border ${t.border}`}>
            {[
              { key: "light", icon: Sun },
              { key: "system", icon: Monitor },
              { key: "dark", icon: Moon },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setThemeMode(key)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors ${themeMode === key ? "" : t.hoverSurface}`}
                style={themeMode === key ? { background: AMBER, color: "#141822" } : undefined}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col overflow-hidden p-2 sm:p-4">
          {sharing ? (
            <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
              {/* Screen share Google Meet presentation stage */}
              <div className={`relative flex-1 rounded-2xl border ${t.border} overflow-hidden bg-black flex items-center justify-center min-h-[200px]`}>
                <video
                  ref={(el) => {
                    if (el && el.srcObject !== screenStream) {
                      el.srcObject = screenStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />

                {/* Presenting Badge & Stop Button */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] sm:text-xs">
                  <MonitorUp size={14} color={AMBER} className="animate-pulse" />
                  <span className="font-medium truncate max-w-[120px] sm:max-w-none">Screen Sharing Active</span>
                  {isAdmin && (
                    <button
                      onClick={stopScreenSharing}
                      className="ml-1 px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-semibold transition-colors"
                    >
                      Stop
                    </button>
                  )}
                </div>

                {/* Host Local Camera PiP */}
                {cam && (
                  <div className={`absolute bottom-3 right-3 w-28 sm:w-44 rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-300 z-20`}
                    style={{ borderColor: AMBER, aspectRatio: "16/9" }}>
                    <video
                      ref={(el) => {
                        if (el && el.srcObject !== localStream) {
                          el.srcObject = localStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] sm:text-[10px] font-medium px-1 py-0.5 rounded bg-black/60 text-white truncate max-w-[90%]">
                      {user.name} (You)
                    </span>
                  </div>
                )}
              </div>

              {/* Side strip for participants */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-44 shrink-0 pb-1 lg:pb-0">
                {participants.map((p) => (
                  <div key={p.id || p.socketId} className="w-24 sm:w-28 lg:w-full shrink-0">
                    <ParticipantCard
                      p={p}
                      t={t}
                      compact
                      isSelf={p.socketId === socketRef.current?.id}
                      localStream={localStream}
                      remoteStream={remoteStreams[p.socketId]}
                      onRemove={isAdmin ? handleRemoveParticipant : null}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-y-auto pb-16">
              {/* Host spotlight card */}
              <div className={`relative w-full rounded-2xl border ${t.border} ${t.surfaceRaised} overflow-hidden shrink-0 bg-zinc-950 min-h-[160px] sm:min-h-[220px]`}
                style={{ aspectRatio: "16/9" }}>
                {(cam && isAdmin && localStream) || (hostParticipant?.cam && remoteStreams[hostParticipant?.socketId]) ? (
                  <video
                    ref={(el) => {
                      const streamToPlay = isAdmin ? localStream : remoteStreams[hostParticipant?.socketId];
                      if (el && el.srcObject !== streamToPlay) {
                        el.srcObject = streamToPlay;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={isAdmin}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 40%, ${AVATAR_COLORS[0]}22, transparent 60%)` }} />
                    <div className="absolute inset-0 flex items-center gap-3 sm:gap-4 px-4 sm:px-8">
                      <Avatar name={hostDisplayName} color={AVATAR_COLORS[0]} size={56} ring />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2 truncate">
                          <span className="truncate">{hostDisplayName}</span>
                          <ShieldCheck size={18} color={AMBER} className="shrink-0" />
                        </div>
                        <div className={`text-[11px] sm:text-xs ${t.sub} flex items-center gap-1 mt-0.5`}>
                          <Pin size={11} className="shrink-0" /> Host · Main Classroom Stage
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm z-10">
                  <Mic size={11} color={mic ? "#fff" : RED} />
                  <Wifi size={11} color={GREEN} />
                </div>
              </div>

              {/* Grid of participants */}
              <div
                className="grid gap-2 sm:gap-3"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {participants.map((p) => (
                  <ParticipantCard
                    key={p.id || p.socketId}
                    p={p}
                    t={t}
                    isSelf={p.socketId === socketRef.current?.id}
                    localStream={localStream}
                    remoteStream={remoteStreams[p.socketId]}
                    onRemove={isAdmin ? handleRemoveParticipant : null}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Chat Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-full sm:w-80 border-l ${t.border} ${t.surface} flex flex-col transition-transform duration-300 ease-out z-40`}
          style={{ transform: chatOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className="font-semibold text-sm">Class Chat</span>
            <button onClick={() => setChatOpen(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.hoverSurface}`}>
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={m.id || i} className="flex gap-2.5">
                <Avatar name={m.name} color={m.color} size={30} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{m.name}</span>
                    {m.role === 'admin' && (
                      <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-400">Host</span>
                    )}
                  </div>
                  <div className={`text-sm ${t.text} mt-0.5 break-words`}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={`p-3 border-t ${t.border}`}>
            <div className={`flex items-center gap-2 rounded-full border ${t.border} px-3 py-1.5`}>
              <button className={`shrink-0 ${t.sub}`}><Smile size={17} /></button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={classStatus.chatAllowed ? "Send a message" : "Chat disabled by host"}
                disabled={!classStatus.chatAllowed}
                className={`flex-1 bg-transparent outline-none text-sm ${t.text} placeholder:${t.faint}`}
              />
              <button onClick={sendMessage} disabled={!classStatus.chatAllowed} className="shrink-0" style={{ color: classStatus.chatAllowed ? AMBER : t.faint }}>
                <Send size={17} />
              </button>
            </div>
          </div>
        </aside>

        {/* Participants Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-full sm:w-80 border-l ${t.border} ${t.surface} flex flex-col transition-transform duration-300 ease-out z-40`}
          style={{ transform: participantsOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className="font-semibold text-sm">Participants ({participants.length})</span>
            <button onClick={() => setParticipantsOpen(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.hoverSurface}`}>
              <X size={16} />
            </button>
          </div>

          {/* Pending Admission Requests Section (Admin view) */}
          {isAdmin && joinRequests.length > 0 && (
            <div className="p-3 border-b border-amber-500/40 bg-amber-500/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">Pending Join Requests ({joinRequests.length})</span>
                <button
                  onClick={() => {
                    joinRequests.forEach(req => handleApproveJoin(req.socketId, true, req.name, req.color));
                  }}
                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Admit All
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {joinRequests.map((req) => (
                  <div key={req.socketId} className="flex items-center justify-between py-1 text-xs bg-black/30 px-2 rounded-lg">
                    <span className="truncate max-w-[120px] font-medium">{req.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleApproveJoin(req.socketId, true, req.name, req.color)}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                      >
                        Admit
                      </button>
                      <button
                        onClick={() => handleApproveJoin(req.socketId, false, req.name, req.color)}
                        className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px]"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Mic Requests Section (Admin view) */}
          {isAdmin && micRequests.length > 0 && (
            <div className="p-3 border-b border-amber-500/30 bg-amber-500/10">
              <span className="text-xs font-semibold text-amber-400 block mb-2">Mic Permission Requests ({micRequests.length})</span>
              {micRequests.map((req) => (
                <div key={req.socketId} className="flex items-center justify-between py-1 text-xs">
                  <span>{req.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApproveMic(req.socketId, true)}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium text-[11px]"
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => handleApproveMic(req.socketId, false)}
                      className="px-2 py-0.5 rounded bg-red-600 text-white font-medium text-[11px]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`px-4 py-2.5 border-b ${t.border}`}>
            <div className={`flex items-center gap-2 rounded-full border ${t.border} px-3 py-1.5`}>
              <Search size={14} className={t.faint} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search participants"
                className={`flex-1 bg-transparent outline-none text-sm ${t.text} placeholder:${t.faint}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {filtered.map((p) => (
              <div key={p.id || p.socketId} className={`flex items-center gap-3 px-2.5 py-2 rounded-lg ${t.hoverSurface}`}>
                <Avatar name={p.name} color={p.color} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name} {p.role === 'admin' && '(Host)'}</div>
                  <div className={`text-[11px] ${t.faint} flex items-center gap-1`}>
                    <StatusDot ok={p.connection === "good"} /> {p.connection === "good" ? "Connected" : "Weak connection"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.hand && <Hand size={14} color={AMBER} />}
                  {p.cam ? <Video size={14} className={t.sub} /> : <VideoOff size={14} color={RED} />}
                  {p.mic ? <Mic size={14} className={t.sub} /> : <MicOff size={14} color={RED} />}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Floating Mobile Responsive Control Bar */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] overflow-x-auto">
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-full border ${t.border} shadow-2xl shrink-0`}
          style={{ background: isDark ? "rgba(20,24,34,0.92)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}>
          <ControlButton icon={mic ? Mic : MicOff} active={mic} label="Microphone" onClick={handleToggleMic} />
          <ControlButton icon={cam ? Video : VideoOff} active={cam} label="Camera" onClick={handleToggleCam} />
          {isAdmin && <ControlButton icon={sharing ? ScreenShareOff : ScreenShare} active={sharing} label="Share screen" onClick={handleToggleScreenShare} />}
          {isAdmin && <ControlButton icon={Circle} active={recording} label="Record" onClick={handleToggleRecording} />}
          <div className={`w-px h-5 sm:h-6 mx-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <ControlButton icon={Users} active={participantsOpen} label="Participants" badge={participants.length + joinRequests.length} onClick={() => { setParticipantsOpen((v) => !v); setChatOpen(false); }} />
          <ControlButton icon={MessageSquare} active={chatOpen} label="Chat" badge={!chatOpen ? messages.length : null} onClick={() => { setChatOpen((v) => !v); setParticipantsOpen(false); }} />
          <ControlButton icon={Hand} active={handRaised} label="Raise hand" onClick={handleToggleHand} />
          <div className={`w-px h-5 sm:h-6 mx-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <ControlButton icon={PhoneOff} danger label="Leave class" onClick={handleCleanLeave} />
        </div>
      </div>
    </div>
  );
}
