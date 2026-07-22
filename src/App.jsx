import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Clock, ShieldAlert, XCircle } from 'lucide-react';
import AdminLogin from './pages/AdminLogin';
import ClassroomPage from './pages/ClassroomPage';
import StudentJoinModal from './components/StudentJoinModal';
import ClassOffline from './components/ClassOffline';

const SOCKET_SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://live-class-meet.onrender.com';

function generateUniqueRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const p1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${p1}-${p2}-${p3}`;
}

function StudentJoinWrapper() {
  const { roomId } = useParams();
  const roomName = roomId || 'live-session';

  const [user, setUser] = useState(null);
  const [isKnocking, setIsKnocking] = useState(false);
  const [knockingName, setKnockingName] = useState('');
  const [denied, setDenied] = useState(false);

  const socketRef = useRef(null);

  const handleJoin = (fullName) => {
    setKnockingName(fullName);
    setIsKnocking(true);
    setDenied(false);

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('request-join', {
      name: fullName,
      role: 'student',
      color: '#6C6FEF',
      roomId: roomName,
    });

    socket.on('room-joined', (data) => {
      setIsKnocking(false);
      setUser({ name: fullName, role: 'student', roomId: roomName });
    });

    socket.on('join-denied', () => {
      setIsKnocking(false);
      setDenied(true);
      if (socketRef.current) socketRef.current.disconnect();
    });

    socket.on('error-message', (err) => {
      setIsKnocking(false);
      alert(err.message || 'Classroom is currently offline.');
      if (socketRef.current) socketRef.current.disconnect();
    });
  };

  const handleCancelKnock = () => {
    setIsKnocking(false);
    if (socketRef.current) socketRef.current.disconnect();
  };

  const handleLeave = () => {
    setUser(null);
    if (socketRef.current) socketRef.current.disconnect();
  };

  if (denied) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0B0E14] text-[#EEF0F4] p-4">
        <div className="w-full max-w-md bg-[#141822] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <XCircle size={28} />
          </div>
          <h2 className="text-lg font-bold">Admission Request Denied</h2>
          <p className="text-xs text-[#8B93A7]">The host teacher has denied your request to join this session.</p>
          <button
            onClick={() => setDenied(false)}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all"
          >
            Try Requesting Again
          </button>
        </div>
      </div>
    );
  }

  if (isKnocking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0B0E14] text-[#EEF0F4] p-4">
        <div className="w-full max-w-md bg-[#141822] border border-[#262C3A] rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-[#E8A33D] flex items-center justify-center mx-auto animate-pulse">
            <Clock size={30} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Waiting for Host Approval...</h2>
            <p className="text-xs text-[#8B93A7] mt-1">
              Hi <strong>{knockingName}</strong>, your request for session <code>{roomName}</code> has been sent to the Teacher. Please wait while they admit you to the live class.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[#E8A33D] bg-amber-500/10 py-2.5 rounded-xl border border-amber-500/20">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Knocking on Classroom Door...</span>
          </div>

          <button
            onClick={handleCancelKnock}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors"
          >
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <StudentJoinModal roomId={roomName} onJoin={handleJoin} />;
  }

  return <ClassroomPage user={user} roomId={roomName} onLeave={handleLeave} />;
}

function MainClassroomWrapper() {
  const { roomId } = useParams();
  const targetRoom = roomId || localStorage.getItem('activeRoomId') || 'live-session';
  const [classStatus, setClassStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/class/status');
      const data = await res.json();
      if (data.success) {
        setClassStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch class status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (adminToken && role === 'admin') {
      setUser({ name: name || 'Admin Host', role: 'admin', roomId: targetRoom });
    }

    fetchStatus();
  }, [targetRoom]);

  const handleStudentJoin = (fullName) => {
    const studentUser = { name: fullName, role: 'student', roomId: targetRoom };
    setUser(studentUser);
  };

  const handleLeave = () => {
    setUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeRoomId');
  };

  if (user && user.role === 'admin') {
    return <ClassroomPage user={user} roomId={targetRoom} onLeave={handleLeave} />;
  }

  if (loading && !classStatus) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0B0E14] text-[#EEF0F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#E8A33D] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8B93A7]">Loading Live Classroom...</span>
        </div>
      </div>
    );
  }

  if (!classStatus?.isLive) {
    return <ClassOffline onRefresh={fetchStatus} />;
  }

  if (!user) {
    return <StudentJoinModal roomId={targetRoom} onJoin={handleStudentJoin} />;
  }

  return <ClassroomPage user={user} roomId={targetRoom} onLeave={handleLeave} />;
}

export default function App() {
  const defaultRoom = localStorage.getItem('activeRoomId') || generateUniqueRoomId();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/join/:roomId" element={<StudentJoinWrapper />} />
        <Route path="/join" element={<Navigate to={`/join/${defaultRoom}`} replace />} />
        <Route path="/room/:roomId" element={<MainClassroomWrapper />} />
        <Route path="/class" element={<Navigate to={`/room/${defaultRoom}`} replace />} />
        <Route path="/" element={<Navigate to={`/join/${defaultRoom}`} replace />} />
        <Route path="*" element={<Navigate to={`/join/${defaultRoom}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
