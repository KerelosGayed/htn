import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Settings, Power, PlayCircle, Library } from 'lucide-react';

export function HomeScreen({ onStart, onSettings, onLibrary }: { onStart: () => void; onSettings: () => void; onLibrary: () => void; }) {
  return (
    <div className="h-screen w-screen p-[4vh] flex flex-col gap-[3vh]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="text-leaf-600" size={40} />
          <h1 className="font-display text-[4.4vh] font-semibold tracking-wide drop-shadow">Hermes</h1>
        </div>
        <div className="text-[2vh] opacity-70">Handheld Streaming Console</div>
      </header>

      <div className="flex-1 grid grid-rows-[1fr_auto] gap-[3vh]">
        <div className="flex items-center justify-center">
          <motion.div
            className="w-[60vw] max-w-[110vh] rounded-3xl bg-leaf-100 border border-leaf-300 shadow-md p-[3vh]"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          >
            <div className="grid grid-cols-3 gap-[2vh] text-[2.4vh]">
              <Tile title="Steam Link" icon={<PlayCircle />} accent="leaf" />
              <Tile title="Moonlight" icon={<PlayCircle />} accent="leaf" />
              <Tile title="Parsec" icon={<PlayCircle />} accent="leaf" />
            </div>
          </motion.div>
        </div>

        <nav className="grid grid-cols-3 gap-[2vh]">
          <ActionButton label="Start Streaming" icon={<PlayCircle />} onClick={onStart} accent="leaf" />
          <ActionButton label="Settings" icon={<Settings />} onClick={onSettings} />
          <ActionButton label="Library" icon={<Library />} onClick={onLibrary} />
        </nav>
      </div>

      <footer className="flex items-center justify-between opacity-80 text-[1.6vh]">
        <div className="text-[2vh]">Use D-Pad/Stick to move, A to select, B to go back</div>
        <div className="flex items-center gap-4">
          <span className="text-leaf-600">●</span> Online
        </div>
      </footer>
    </div>
  );
}

function Tile({ title, icon, accent = 'leaf' }: { title: string; icon: React.ReactNode; accent?: 'leaf' }) {
  const ring = 'focus:ring-leaf-400/60';
  return (
  <button className={`group relative aspect-[5/3] w-full rounded-2xl bg-leaf-200 hover:bg-leaf-300 border border-leaf-300 shadow focus:outline-none focus:ring-4 ${ring} transition-colors`}
      tabIndex={0}
      aria-label={title}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/50 to-transparent" />
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-[2vh]">
        <div className="text-[5vh] text-leaf-800">{icon}</div>
        <div className="text-[2.4vh] tracking-wide text-leaf-900">{title}</div>
      </div>
    </button>
  );
}

function ActionButton({ label, icon, onClick, accent }: { label: string; icon: React.ReactNode; onClick: () => void; accent?: 'leaf' }) {
  const accentClass = accent === 'leaf' ? 'bg-leaf-500 hover:bg-leaf-400 text-white shadow-glow' : 'bg-leaf-100 hover:bg-leaf-200 text-black border border-leaf-300';
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-3 rounded-2xl py-[2.6vh] ${accentClass} transition-colors focus:outline-none focus:ring-4 focus:ring-leaf-400/50`}>
      <span className="text-[2.6vh]">{icon}</span>
      <span className="text-[2.6vh] font-medium tracking-wide">{label}</span>
    </button>
  );
}
