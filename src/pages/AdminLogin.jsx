import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';

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

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed.');
      }

      // Save token & admin credentials securely
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userName', data.admin.username);

      navigate('/class');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-screen h-screen flex items-center justify-center ${DARK.bg} ${DARK.text} p-4`}>
      <div className={`w-full max-w-md ${DARK.surface} border ${DARK.border} rounded-2xl p-8 shadow-2xl relative overflow-hidden`}>
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full" style={{ background: `${AMBER}15`, filter: 'blur(30px)' }} />
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${AMBER}1A`, color: AMBER }}>
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
          <p className={`text-xs ${DARK.sub} mt-1`}>Secure Host Authentication for Live Classroom</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold ${DARK.sub} mb-1.5`}>Admin Username</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${DARK.border} ${DARK.surfaceRaised} focus-within:border-[#E8A33D] transition-colors`}>
              <User size={16} className={DARK.faint} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username from .env"
                className={`w-full bg-transparent outline-none text-sm ${DARK.text} placeholder:${DARK.faint}`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold ${DARK.sub} mb-1.5`}>Admin Password</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${DARK.border} ${DARK.surfaceRaised} focus-within:border-[#E8A33D] transition-colors`}>
              <Lock size={16} className={DARK.faint} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password from .env"
                className={`w-full bg-transparent outline-none text-sm ${DARK.text} placeholder:${DARK.faint}`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 mt-2 shadow-lg"
            style={{ background: AMBER, color: '#141822' }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Host'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/class')}
            className={`text-xs ${DARK.sub} hover:underline`}
          >
            Return to Public Classroom
          </button>
        </div>
      </div>
    </div>
  );
}
