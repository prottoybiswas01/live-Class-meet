import React, { useState, useEffect, useRef } from 'react';
import { User, LogIn, Mic, MicOff, Video, VideoOff, ShieldCheck } from 'lucide-react';

const DARK = {
  bg: "bg-[#0B0E14]",
  surface: "bg-[#141822]",
  surfaceRaised: "bg-[#1B2029]",
  border: "border-[#262C3A]",
  text: "text-[#EEF0F4]",
  sub: "text-[#8B93A7]",
  faint: "text-[#5B637A]",
};
const AMBER = "#E8A33D";
const RED = "#E5484D";

export default function StudentJoinModal({ onJoin }) {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera/mic preview on mount
  useEffect(() => {
    let isMounted = true;
    async function getMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (isMounted) {
          streamRef.current = mediaStream;
          setStream(mediaStream);
        } else {
          mediaStream.getTracks().forEach((t) => t.stop());
        }
      } catch (err) {
        console.warn("Camera/Mic permission denied or unavailable:", err);
        if (isMounted) {
          setCam(false);
        }
      }
    }
    getMedia();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleToggleCam = () => {
    const nextCam = !cam;
    setCam(nextCam);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nextCam;
      });
    }
  };

  const handleToggleMic = () => {
    const nextMic = !mic;
    setMic(nextMic);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextMic;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name to join.');
      return;
    }
    if (fullName.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    // Clean up preview stream tracks so main classroom can acquire stream cleanly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onJoin(fullName.trim());
  };

  return (
    <div className={`w-screen h-screen flex items-center justify-center ${DARK.bg} ${DARK.text} p-4`}>
      <div className={`w-full max-w-lg ${DARK.surface} border ${DARK.border} rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center`}>
        <div className="flex flex-col items-center mb-5 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: `${AMBER}1A`, color: AMBER }}>
            <LogIn size={26} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Ready to Join Classroom?</h2>
          <p className={`text-xs ${DARK.sub} mt-0.5`}>Check your audio & video permissions before entering</p>
        </div>

        {/* Live Camera Preview Stage */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#262C3A] mb-5 flex items-center justify-center shadow-inner">
          {cam && stream ? (
            <video
              ref={(el) => {
                if (el && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-300">
                {fullName.trim() ? fullName.trim().slice(0, 2).toUpperCase() : "ST"}
              </div>
              <span className="text-xs">Camera is turned off</span>
            </div>
          )}

          {/* Floating Mic & Camera Permission Toggles */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-10">
            <button
              type="button"
              onClick={handleToggleMic}
              title={mic ? "Mute Microphone" : "Unmute Microphone"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                mic ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
              }`}
            >
              {mic ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

            <button
              type="button"
              onClick={handleToggleCam}
              title={cam ? "Turn Off Camera" : "Turn On Camera"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                cam ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
              }`}
            >
              {cam ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className={`block text-xs font-semibold ${DARK.sub} mb-1.5`}>Your Full Name</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${DARK.border} ${DARK.surfaceRaised} focus-within:border-[#E8A33D] transition-colors`}>
              <User size={16} className={DARK.faint} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name to join live class"
                className={`w-full bg-transparent outline-none text-sm ${DARK.text} placeholder:${DARK.faint}`}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
            style={{ background: AMBER, color: '#141822' }}
          >
            <ShieldCheck size={18} /> Join Classroom Now
          </button>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/admin"
            className={`text-xs ${DARK.sub} hover:text-[#E8A33D] hover:underline transition-colors`}
          >
            Are you the Host? Sign in as Teacher / Admin
          </a>
        </div>
      </div>
    </div>
  );
}
