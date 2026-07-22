import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, Circle,
  Users, MessageSquare, Hand, PhoneOff, Search, Sun, Moon, Monitor,
  X, Send, Smile, Radio, Wifi, Pin, ShieldCheck, VolumeX, UserX,
  PlayCircle, StopCircle, CheckCircle, Upload
} from "lucide-react";

/* ---------------------------------------------------------------
   Tokens matching exact original design palette
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

function ParticipantCard({ p, t, speaking, compact, onRemove }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border transition-all duration-300 ${t.border} ${t.surfaceRaised} flex items-center justify-center group`}
      style={{
        aspectRatio: "4/3",
        boxShadow: speaking ? `0 0 0 2px ${AMBER}, 0 0 24px -4px ${AMBER}66` : "none",
      }}
    >
      {p.cam ? (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${p.color || '#6C6FEF'}33, transparent 70%)` }}
        />
      ) : null}
      <Avatar name={p.name} color={p.color || '#6C6FEF'} size={compact ? 32 : 48} />

      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium truncate px-1.5 py-0.5 rounded-md bg-black/40 text-white">
          {p.name ? p.name.split(" ")[0] : "Student"} {p.role === 'admin' && '(Host)'}
        </span>
        <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-black/40">
          {p.hand && <Hand size={11} color={AMBER} />}
          {p.mic ? <Mic size={11} color="#fff" /> : <MicOff size={11} color={RED} />}
        </div>
      </div>

      {onRemove && p.role !== 'admin' && (
        <button
          onClick={() => onRemove(p.socketId)}
          title="Remove Participant"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UserX size={14} />
        </button>
      )}

      {speaking && (
        <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse" style={{ boxShadow: `inset 0 0 0 1px ${AMBER}55` }} />
      )}
    </div>
  );
}

function ControlButton({ icon: Icon, active, danger, label, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
        ${danger ? "bg-[#E5484D] hover:bg-[#d13d42]" : active ? "text-white" : "bg-white/5 hover:bg-white/10 text-[#EEF0F4]"}
      `}
      style={active && !danger ? { background: AMBER, color: "#141822" } : undefined}
    >
      <Icon size={19} />
      {badge ? (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E5484D] text-white text-[10px] flex items-center justify-center font-semibold">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* ---------------------------------------------------------------
   Main Classroom Component
----------------------------------------------------------------*/
export default function ClassroomPage({ user, onLeave }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Theme states
  const [themeMode, setThemeMode] = useState("dark");
  const [systemDark, setSystemDark] = useState(true);
  const isDark = themeMode === "system" ? systemDark : themeMode === "dark";
  const t = isDark ? DARK : LIGHT;

  // Real-time server & socket state
  const socketRef = useRef(null);
  const [classStatus, setClassStatus] = useState({
    isLive: true,
    isRecording: false,
    screenShareAllowed: true,
    chatAllowed: true,
  });
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

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

  // Recording MediaRecorder ref
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

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

  // Socket.IO Setup
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Join room
    socket.emit('join-room', {
      name: user.name,
      role: user.role,
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    });

    socket.on('room-joined', (data) => {
      if (data.classStatus) setClassStatus(data.classStatus);
      if (data.participants) setParticipants(data.participants);
      if (data.messages) setMessages(data.messages);
    });

    socket.on('participant-list', (list) => {
      setParticipants(list);
    });

    socket.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('class-status-change', (status) => {
      setClassStatus(status);
      setRecording(status.isRecording);
    });

    socket.on('control-update', ({ control, value, updatedStatus }) => {
      if (updatedStatus) setClassStatus(updatedStatus);
    });

    socket.on('mute-all', () => {
      setMic(false);
      socket.emit('toggle-media', { mic: false, cam, hand: handRaised });
    });

    socket.on('mic-request-received', (reqData) => {
      setMicRequests((prev) => [...prev, reqData]);
    });

    socket.on('removed-by-host', () => {
      alert("You have been removed from the class by the host.");
      onLeave();
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
    };
  }, [user]);

  // Broadcast local media changes
  const handleToggleMic = () => {
    const newMic = !mic;
    setMic(newMic);
    socketRef.current?.emit('toggle-media', { mic: newMic, cam, hand: handRaised });
  };

  const handleToggleCam = () => {
    const newCam = !cam;
    setCam(newCam);
    socketRef.current?.emit('toggle-media', { mic, cam: newCam, hand: handRaised });
  };

  const handleToggleHand = () => {
    const newHand = !handRaised;
    setHandRaised(newHand);
    socketRef.current?.emit('toggle-media', { mic, cam, hand: newHand });

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

  const handleToggleRecording = async () => {
    const token = localStorage.getItem('adminToken');
    if (!recording) {
      // Start recording API
      await fetch('/api/class/recording/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      // Stop recording API & Trigger Google Drive Upload
      await fetch('/api/class/recording/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  const handleToggleScreenShareControl = async () => {
    const token = localStorage.getItem('adminToken');
    await fetch('/api/class/controls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ control: 'screenShare', value: !classStatus.screenShareAllowed }),
    });
  };

  const handleToggleChatControl = async () => {
    const token = localStorage.getItem('adminToken');
    await fetch('/api/class/controls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ control: 'chat', value: !classStatus.chatAllowed }),
    });
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

  return (
    <div className={`w-full h-screen flex flex-col ${t.bg} ${t.text} font-sans overflow-hidden`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-5 py-3 border-b ${t.border} ${t.surface} shrink-0`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: classStatus.isLive ? `${GREEN}1A` : `${RED}1A` }}>
            <Radio size={12} color={classStatus.isLive ? GREEN : RED} className={classStatus.isLive ? "rec-dot" : ""} />
            <span className="text-xs font-semibold" style={{ color: classStatus.isLive ? GREEN : RED }}>
              {classStatus.isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <h1 className="text-sm font-semibold truncate">Advanced Organic Chemistry — Lecture Session</h1>
          <span className={`text-xs mono ${t.sub}`}>{formatTime(elapsed)}</span>

          {recording && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${RED}14` }}>
              <span className="w-1.5 h-1.5 rounded-full rec-dot" style={{ background: RED }} />
              <span className="text-xs font-medium mono" style={{ color: RED }}>REC {formatTime(recElapsed)}</span>
            </div>
          )}

          {uploadStatus && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs">
              <Upload size={12} className="animate-spin" />
              <span>Drive Upload: {uploadStatus.progress}%</span>
            </div>
          )}
        </div>

        {/* Admin Dashboard Controls Bar & Theme Toggles */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${t.border} bg-white/5`}>
              {!classStatus.isLive ? (
                <button
                  onClick={handleStartClass}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1"
                >
                  <PlayCircle size={13} /> Start Class
                </button>
              ) : (
                <button
                  onClick={handleEndClass}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1"
                >
                  <StopCircle size={13} /> End Class
                </button>
              )}

              <button
                onClick={handleToggleRecording}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
                  recording ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Circle size={11} fill={recording ? RED : "none"} color={recording ? RED : "white"} />
                {recording ? 'REC ON' : 'REC OFF'}
              </button>

              <button
                onClick={handleMuteAll}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
                title="Mute All Students"
              >
                <VolumeX size={13} /> Mute All
              </button>
            </div>
          )}

          {/* Theme selector */}
          <div className={`flex items-center gap-0.5 rounded-full p-1 border ${t.border}`}>
            {[
              { key: "light", icon: Sun },
              { key: "system", icon: Monitor },
              { key: "dark", icon: Moon },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setThemeMode(key)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${themeMode === key ? "" : t.hoverSurface}`}
                style={themeMode === key ? { background: AMBER, color: "#141822" } : undefined}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col overflow-hidden">
          {sharing ? (
            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
              {/* Screen share stage */}
              <div className={`relative flex-1 rounded-2xl border ${t.border} overflow-hidden`}
                style={{ background: isDark ? "#0E121A" : "#EDEEF2" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                  <div className={`w-full max-w-xl aspect-video rounded-xl border ${t.border} ${t.surface} flex flex-col p-6 gap-3`}>
                    <div className="h-3 w-1/3 rounded-full" style={{ background: `${AMBER}55` }} />
                    <div className={`h-2 w-full rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                    <div className={`h-2 w-5/6 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                    <div className="flex-1 rounded-lg mt-2" style={{ background: `linear-gradient(135deg, ${AMBER}22, transparent)` }} />
                  </div>
                  <span className={`text-xs ${t.faint}`}>Screen Sharing Active — Host Presentation</span>
                </div>

                {/* Host PiP */}
                <div className={`absolute bottom-4 right-4 w-32 sm:w-44 md:w-56 rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-300`}
                  style={{ borderColor: AMBER, aspectRatio: "16/10" }}>
                  <div className={`w-full h-full ${t.surfaceRaised} flex items-center justify-center relative`}>
                    <Avatar name={user.name} color={AVATAR_COLORS[0]} size={44} ring />
                    <span className="absolute bottom-1 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/50 text-white">
                      {user.name} (Host)
                    </span>
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40">
                  <ScreenShare size={12} color="#fff" />
                  <span className="text-[11px] text-white font-medium">Presenting</span>
                </div>
              </div>

              {/* Side strip */}
              <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:w-40 shrink-0 pb-1 lg:pb-0">
                {participants.map((p) => (
                  <div key={p.id} className="w-28 lg:w-full shrink-0">
                    <ParticipantCard p={p} t={t} compact onRemove={isAdmin ? handleRemoveParticipant : null} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
              {/* Host spotlight card */}
              <div className={`relative w-full rounded-2xl border ${t.border} ${t.surfaceRaised} overflow-hidden shrink-0`}
                style={{ aspectRatio: "21/8" }}>
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 40%, ${AVATAR_COLORS[0]}22, transparent 60%)` }} />
                <div className="absolute inset-0 flex items-center gap-4 px-8">
                  <Avatar name="Dr. Amara Okafor" color={AVATAR_COLORS[0]} size={72} ring />
                  <div>
                    <div className="font-semibold text-lg flex items-center gap-2">
                      Dr. Amara Okafor
                      <ShieldCheck size={18} color={AMBER} />
                    </div>
                    <div className={`text-xs ${t.sub} flex items-center gap-1.5 mt-0.5`}>
                      <Pin size={11} /> Host · Instructor
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30">
                  <Mic size={12} color="#fff" />
                  <Wifi size={12} color={GREEN} />
                </div>
              </div>

              {/* Grid of participants */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {participants.map((p) => (
                  <ParticipantCard
                    key={p.id}
                    p={p}
                    t={t}
                    onRemove={isAdmin ? handleRemoveParticipant : null}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Chat Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-full sm:w-80 border-l ${t.border} ${t.surface} flex flex-col transition-transform duration-300 ease-out z-20`}
          style={{ transform: chatOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className="font-semibold text-sm">Class chat</span>
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
          className={`absolute top-0 right-0 h-full w-full sm:w-80 border-l ${t.border} ${t.surface} flex flex-col transition-transform duration-300 ease-out z-10`}
          style={{ transform: participantsOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className="font-semibold text-sm">Participants ({participants.length})</span>
            <button onClick={() => setParticipantsOpen(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.hoverSurface}`}>
              <X size={16} />
            </button>
          </div>

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
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium"
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => handleApproveMic(req.socketId, false)}
                      className="px-2 py-0.5 rounded bg-red-600 text-white font-medium"
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

      {/* Floating Control Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-full border ${t.border} shadow-2xl`}
          style={{ background: isDark ? "rgba(20,24,34,0.85)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)" }}>
          <ControlButton icon={mic ? Mic : MicOff} active={mic} label="Microphone" onClick={handleToggleMic} />
          <ControlButton icon={cam ? Video : VideoOff} active={cam} label="Camera" onClick={handleToggleCam} />
          <ControlButton icon={sharing ? ScreenShareOff : ScreenShare} active={sharing} label="Share screen" onClick={() => setSharing((v) => !v)} />
          <ControlButton icon={Circle} active={recording} label="Record" onClick={handleToggleRecording} />
          <div className={`w-px h-6 mx-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <ControlButton icon={Users} active={participantsOpen} label="Participants" badge={participants.length} onClick={() => { setParticipantsOpen((v) => !v); setChatOpen(false); }} />
          <ControlButton icon={MessageSquare} active={chatOpen} label="Chat" badge={!chatOpen ? messages.length : null} onClick={() => { setChatOpen((v) => !v); setParticipantsOpen(false); }} />
          <ControlButton icon={Hand} active={handRaised} label="Raise hand" onClick={handleToggleHand} />
          <div className={`w-px h-6 mx-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <ControlButton icon={PhoneOff} danger label="Leave class" onClick={onLeave} />
        </div>
      </div>
    </div>
  );
}
