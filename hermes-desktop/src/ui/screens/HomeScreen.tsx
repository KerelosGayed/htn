import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Settings, Power, PlayCircle, Library } from 'lucide-react';
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation';
import { useFocus, useFocusable } from '../../hooks/useFocus';

export function HomeScreen({ onStart, onSettings, onLibrary }: { onStart: () => void; onSettings: () => void; onLibrary: () => void; }) {
  const { moveFocus, activateFocused, clearFocus } = useFocus();

  // Set up gamepad navigation
  useGamepadNavigation({
    onDpadUp: () => moveFocus('up'),
    onDpadDown: () => moveFocus('down'),
    onDpadLeft: () => moveFocus('left'),
    onDpadRight: () => moveFocus('right'),
    onA: () => activateFocused(),
  });

  // Clear focus when leaving this screen
  useEffect(() => {
    return () => clearFocus();
  }, [clearFocus]);

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
              <Tile id="tile-steamlink" title="Steam Link" icon={<PlayCircle />} accent="leaf" onActivate={onStart} />
              <Tile id="tile-moonlight" title="Moonlight" icon={<PlayCircle />} accent="leaf" onActivate={onStart} />
              <Tile id="tile-parsec" title="Parsec" icon={<PlayCircle />} accent="leaf" onActivate={onStart} />
            </div>
          </motion.div>
        </div>

        <nav className="grid grid-cols-3 gap-[2vh]">
          <ActionButton id="action-start" label="Start Streaming" icon={<PlayCircle />} onClick={onStart} accent="leaf" />
          <ActionButton id="action-settings" label="Settings" icon={<Settings />} onClick={onSettings} />
          <ActionButton id="action-library" label="Library" icon={<Library />} onClick={onLibrary} />
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

function Tile({ id, title, icon, accent = 'leaf', onActivate }: { 
  id: string; 
  title: string; 
  icon: React.ReactNode; 
  accent?: 'leaf';
  onActivate?: () => void;
}) {
  const { elementRef, isFocused } = useFocusable(id, onActivate);
  const ring = isFocused ? 'ring-4 ring-leaf-400/80' : 'focus:ring-4 focus:ring-leaf-400/60';
  
  return (
    <button 
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      className={`group relative aspect-[5/3] w-full rounded-2xl bg-leaf-200 hover:bg-leaf-300 border border-leaf-300 shadow focus:outline-none ${ring} transition-all duration-200`}
      tabIndex={isFocused ? 0 : -1}
      aria-label={title}
      onClick={onActivate}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/50 to-transparent" />
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-[2vh]">
        <div className="text-[5vh] text-leaf-800">{icon}</div>
        <div className="text-[2.4vh] tracking-wide text-leaf-900">{title}</div>
      </div>
    </button>
  );
}

function ActionButton({ id, label, icon, onClick, accent }: { 
  id: string;
  label: string; 
  icon: React.ReactNode; 
  onClick: () => void; 
  accent?: 'leaf';
}) {
  const { elementRef, isFocused } = useFocusable(id, onClick);
  const accentClass = accent === 'leaf' ? 'bg-leaf-500 hover:bg-leaf-400 text-white shadow-glow' : 'bg-leaf-100 hover:bg-leaf-200 text-black border border-leaf-300';
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80' : 'focus:ring-4 focus:ring-leaf-400/50';
  
  return (
    <button 
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      onClick={onClick} 
      className={`flex items-center justify-center gap-3 rounded-2xl py-[2.6vh] ${accentClass} transition-all duration-200 focus:outline-none ${focusClass}`}
      tabIndex={isFocused ? 0 : -1}
    >
      <span className="text-[2.6vh]">{icon}</span>
      <span className="text-[2.6vh] font-medium tracking-wide">{label}</span>
    </button>
  );
}
