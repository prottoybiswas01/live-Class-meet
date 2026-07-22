import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import ClassroomPage from './pages/ClassroomPage';
import StudentJoinModal from './components/StudentJoinModal';
import ClassOffline from './components/ClassOffline';

function StudentJoinWrapper() {
  const { roomId } = useParams();
  const roomName = roomId || 'class-session-1';
  const [user, setUser] = useState(null);

  const handleJoin = (fullName) => {
    setUser({ name: fullName, role: 'student', roomId: roomName });
  };

  const handleLeave = () => {
    setUser(null);
  };

  if (!user) {
    return <StudentJoinModal roomId={roomName} onJoin={handleJoin} />;
  }

  return <ClassroomPage user={user} roomId={roomName} onLeave={handleLeave} />;
}

function MainClassroomWrapper() {
  const { roomId } = useParams();
  const targetRoom = roomId || 'class-session-1';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/join/:roomId" element={<StudentJoinWrapper />} />
        <Route path="/join" element={<StudentJoinWrapper />} />
        <Route path="/room/:roomId" element={<MainClassroomWrapper />} />
        <Route path="/class" element={<MainClassroomWrapper />} />
        <Route path="/" element={<Navigate to="/join" replace />} />
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
