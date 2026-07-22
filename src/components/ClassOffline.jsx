import React from 'react';
import { Radio, RefreshCw } from 'lucide-react';

const DARK = {
  bg: "bg-[#0B0E14]",
  surface: "bg-[#141822]",
  border: "border-[#262C3A]",
  text: "text-[#EEF0F4]",
  sub: "text-[#8B93A7]",
  faint: "text-[#5B637A]",
};
const RED = "#E5484D";
const AMBER = "#E8A33D";

export default function ClassOffline({ onRefresh }) {
  return (
    <div className={`w-screen h-screen flex items-center justify-center ${DARK.bg} ${DARK.text} p-4`}>
      <div className={`w-full max-w-md ${DARK.surface} border ${DARK.border} rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden`}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${RED}1A` }}>
          <Radio size={32} color={RED} className="rec-dot" />
        </div>

        <h2 className="text-xl font-bold tracking-tight mb-2">Class is currently offline</h2>
        <p className={`text-sm ${DARK.sub} mb-6 leading-relaxed`}>
          The host has not started the session yet or the lecture has concluded. Please wait for the teacher to start the class.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRefresh}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-[#262C3A] hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={16} /> Check Class Status
          </button>
        </div>
      </div>
    </div>
  );
}
