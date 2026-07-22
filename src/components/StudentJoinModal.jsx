import React, { useState } from 'react';
import { User, LogIn } from 'lucide-react';

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

export default function StudentJoinModal({ onJoin }) {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

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
    onJoin(fullName.trim());
  };

  return (
    <div className={`w-screen h-screen flex items-center justify-center ${DARK.bg} ${DARK.text} p-4`}>
      <div className={`w-full max-w-md ${DARK.surface} border ${DARK.border} rounded-2xl p-8 shadow-2xl relative overflow-hidden`}>
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${AMBER}1A`, color: AMBER }}>
            <LogIn size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Join Live Classroom</h2>
          <p className={`text-xs ${DARK.sub} mt-1`}>Advanced Organic Chemistry — Lecture Session</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold ${DARK.sub} mb-1.5`}>Full Name</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${DARK.border} ${DARK.surfaceRaised} focus-within:border-[#E8A33D] transition-colors`}>
              <User size={16} className={DARK.faint} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className={`w-full bg-transparent outline-none text-sm ${DARK.text} placeholder:${DARK.faint}`}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 mt-2 shadow-lg"
            style={{ background: AMBER, color: '#141822' }}
          >
            Join Classroom
          </button>
        </form>
      </div>
    </div>
  );
}
