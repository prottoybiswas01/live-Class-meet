import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, Circle,
  Users, MessageSquare, Hand, PhoneOff, Search, Sun, Moon, Monitor,
  X, Send, Smile, Radio, Wifi, MoreVertical, Pin,
} from "lucide-react";

/* ---------------------------------------------------------------
   Tokens
   Studio-stage palette: deep navy-black "auditorium" surfaces with
   a single warm amber "stage light" accent for live/active states.
   Avoids the generic cream+terracotta and neon-on-black defaults.
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

const NAMES = [
  "Maya Chen", "Aarav Singh", "Zoe Martinez", "Liam O'Brien", "Fatima Noor",
  "Theo Nakamura", "Ines Duarte", "Oscar Lund", "Priya Rao", "Ethan Wolfe",
  "Sofia Rossi", "Kwame Boateng", "Nora Kristensen", "Diego Ibarra", "Amara Okafor",
  "Felix Braun", "Lena Kowalski", "Ravi Patel", "Clara Dubois", "Mateo Silva",
  "Yuki Tanaka", "Isla Fraser", "Noah Bergman", "Wanjiru Kamau", "Hugo Fischer",
  "Elif Yildiz", "Sana Malik", "Leo Moreau", "Ingrid Solberg", "Tariq Hassan",
  "Mila Novak", "Adrian Cruz", "Freya Lindqvist", "Kofi Mensah", "Ava Sullivan",
  "Ren Watanabe", "Zara Ahmed", "Julian Voss", "Nadia Popescu", "Marco Conti",
];

function useParticipants(count) {
  return useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      name: NAMES[i % NAMES.length],
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      mic: Math.random() > 0.35,
      cam: Math.random() > 0.5,
      hand: Math.random() > 0.9,
      connection: Math.random() > 0.12 ? "good" : "weak",
    }));
  }, [count]);
}

function initials(name) {
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
   Small building blocks
----------------------------------------------------------------*/
function Avatar({ name, color, size = 56, ring }) {
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

function ParticipantCard({ p, t, speaking, compact }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border transition-all duration-300 ${t.border} ${t.surfaceRaised} flex items-center justify-center`}
      style={{
        aspectRatio: "4/3",
        boxShadow: speaking ? `0 0 0 2px ${AMBER}, 0 0 24px -4px ${AMBER}66` : "none",
      }}
    >
      {p.cam ? (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${p.color}33, transparent 70%)` }}
        />
      ) : null}
      <Avatar name={p.name} color={p.color} size={compact ? 32 : 48} />
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
        <span className={`text-[11px] font-medium truncate px-1.5 py-0.5 rounded-md bg-black/40 text-white`}>
          {p.name.split(" ")[0]}
        </span>
        <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-black/40">
          {p.hand && <Hand size={11} color={AMBER} />}
          {p.mic ? <Mic size={11} color="#fff" /> : <MicOff size={11} color={RED} />}
        </div>
      </div>
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
   Main component
----------------------------------------------------------------*/
export default function LiveClassroom() {
  const [themeMode, setThemeMode] = useState("dark"); // 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = useState(true);
  const isDark = themeMode === "system" ? systemDark : themeMode === "dark";
  const t = isDark ? DARK : LIGHT;

  const [count, setCount] = useState(9);
  const participants = useParticipants(count);

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [recElapsed, setRecElapsed] = useState(0);
  const [speakerIdx, setSpeakerIdx] = useState(0);
  const [messages, setMessages] = useState([
    { name: "Priya Rao", color: AVATAR_COLORS[8], text: "Could you re-share the last slide?" },
    { name: "Ethan Wolfe", color: AVATAR_COLORS[9], text: "Sound is a little quiet on my end" },
    { name: "Sofia Rossi", color: AVATAR_COLORS[5], text: "Got it, thank you!" },
  ]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    const id = setInterval(() => {
      setSpeakerIdx((i) => (i + 1) % Math.max(count, 1));
    }, 3500);
    return () => clearInterval(id);
  }, [count]);

  const cols = gridColumns(count);
  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const unread = 2;

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { name: "You", color: AMBER, text: draft.trim() }]);
    setDraft("");
  }

  return (
    <div className={`w-full h-screen flex flex-col ${t.bg} ${t.text} font-sans overflow-hidden`}>
      <style>{`
        @keyframes recBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
        .rec-dot { animation: recBlink 1.4s ease-in-out infinite; }
        * { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      {/* Header */}
      <header className={`flex items-center justify-between px-5 py-3 border-b ${t.border} ${t.surface} shrink-0`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${RED}1A` }}>
            <Radio size={12} color={RED} className="rec-dot" />
            <span className="text-xs font-semibold" style={{ color: RED }}>LIVE</span>
          </div>
          <h1 className="text-sm font-semibold truncate">Advanced Organic Chemistry — Lecture 14</h1>
          <span className={`text-xs mono ${t.sub}`}>{formatTime(elapsed)}</span>
          {recording && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${RED}14` }}>
              <span className="w-1.5 h-1.5 rounded-full rec-dot" style={{ background: RED }} />
              <span className="text-xs font-medium mono" style={{ color: RED }}>REC {formatTime(recElapsed)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* demo control: participant count, not part of the product surface */}
          <div className={`hidden md:flex items-center gap-1 rounded-full p-1 border ${t.border}`}>
            {[2, 5, 10, 20, 40].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${count === n ? "" : `${t.sub} ${t.hoverSurface}`}`}
                style={count === n ? { background: AMBER, color: "#141822", fontWeight: 600 } : undefined}
              >
                {n}
              </button>
            ))}
          </div>

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

      {/* Body */}
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
                  <span className={`text-xs ${t.faint}`}>Dr. Amara Okafor is presenting — Slide 14 of 22</span>
                </div>

                {/* Teacher PiP */}
                <div className={`absolute bottom-4 right-4 w-32 sm:w-44 md:w-56 rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-300`}
                  style={{ borderColor: AMBER, aspectRatio: "16/10" }}>
                  <div className={`w-full h-full ${t.surfaceRaised} flex items-center justify-center relative`}>
                    <Avatar name="Amara Okafor" color={AVATAR_COLORS[0]} size={44} ring />
                    <span className="absolute bottom-1 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/50 text-white">
                      Dr. Okafor (Host)
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
                    <ParticipantCard p={p} t={t} speaking={p.id === speakerIdx} compact />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
              {/* Teacher spotlight */}
              <div className={`relative w-full rounded-2xl border ${t.border} ${t.surfaceRaised} overflow-hidden shrink-0`}
                style={{ aspectRatio: "21/8" }}>
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 40%, ${AVATAR_COLORS[0]}22, transparent 60%)` }} />
                <div className="absolute inset-0 flex items-center gap-4 px-8">
                  <Avatar name="Amara Okafor" color={AVATAR_COLORS[0]} size={72} ring />
                  <div>
                    <div className="font-semibold text-lg">Dr. Amara Okafor</div>
                    <div className={`text-xs ${t.sub} flex items-center gap-1.5 mt-0.5`}>
                      <Pin size={11} /> Host · Teaching
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30">
                  <Mic size={12} color="#fff" />
                  <Wifi size={12} color={GREEN} />
                </div>
              </div>

              {/* Adaptive grid */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {participants.map((p) => (
                  <ParticipantCard key={p.id} p={p} t={t} speaking={p.id === speakerIdx} />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Chat panel */}
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
              <div key={i} className="flex gap-2.5">
                <Avatar name={m.name} color={m.color} size={30} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{m.name}</span>
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
                placeholder="Send a message"
                className={`flex-1 bg-transparent outline-none text-sm ${t.text} placeholder:${t.faint}`}
              />
              <button onClick={sendMessage} className="shrink-0" style={{ color: AMBER }}>
                <Send size={17} />
              </button>
            </div>
          </div>
        </aside>

        {/* Participants panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-full sm:w-80 border-l ${t.border} ${t.surface} flex flex-col transition-transform duration-300 ease-out z-10`}
          style={{ transform: participantsOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className="font-semibold text-sm">Participants ({count})</span>
            <button onClick={() => setParticipantsOpen(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.hoverSurface}`}>
              <X size={16} />
            </button>
          </div>
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
              <div key={p.id} className={`flex items-center gap-3 px-2.5 py-2 rounded-lg ${t.hoverSurface}`}>
                <Avatar name={p.name} color={p.color} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
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

      {/* Floating control bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-full border ${t.border} shadow-2xl`}
          style={{ background: isDark ? "rgba(20,24,34,0.85)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)" }}>
          <ControlButton icon={mic ? Mic : MicOff} active={mic} label="Microphone" onClick={() => setMic((v) => !v)} />
          <ControlButton icon={cam ? Video : VideoOff} active={cam} label="Camera" onClick={() => setCam((v) => !v)} />
          <ControlButton icon={sharing ? ScreenShareOff : ScreenShare} active={sharing} label="Share screen" onClick={() => setSharing((v) => !v)} />
          <ControlButton icon={Circle} active={recording} label="Record" onClick={() => setRecording((v) => !v)} />
          <div className={`w-px h-6 mx-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <ControlButton icon={Users} active={participantsOpen} label="Participants" badge={count} onClick={() => { setParticipantsOpen((v) => !v); setChatOpen(false); }} />
          <ControlButton icon={MessageSquare} active={chatOpen} label="Chat" badge={!chatOpen ? unread : null} onClick={() => { setChatOpen((v) => !v); setParticipantsOpen(false); }} />
          <ControlButton icon={Hand} active={handRaised} label="Raise hand" onClick={() => setHandRaised((v) => !v)} />
          <div className={`w-px h-6 mx-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <ControlButton icon={PhoneOff} danger label="Leave class" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}
