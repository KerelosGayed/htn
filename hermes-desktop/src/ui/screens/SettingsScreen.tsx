import React, { useEffect } from 'react';
import { ArrowLeft, Wifi, Bluetooth, Volume2, GaugeCircle } from 'lucide-react';
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation';
import { useFocus, useFocusable } from '../../hooks/useFocus';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { moveFocus, activateFocused, clearFocus } = useFocus();

  // Set up gamepad navigation
  useGamepadNavigation({
    onDpadUp: () => moveFocus('up'),
    onDpadDown: () => moveFocus('down'),
    onDpadLeft: () => moveFocus('left'),
    onDpadRight: () => moveFocus('right'),
    onA: () => activateFocused(),
    onB: () => onBack(),
  });

  // Clear focus when leaving this screen
  useEffect(() => {
    return () => clearFocus();
  }, [clearFocus]);
  return (
    <div className="h-screen w-screen p-[4vh] flex flex-col gap-[3vh]">
      <header className="flex items-center justify-between">
        <BackButton id="back-button" onBack={onBack} />
  <h2 className="text-[3.4vh] font-semibold opacity-90 drop-shadow">Settings</h2>
        <div />
      </header>

  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-[2vh] text-[2.2vh]">
        <Panel id="panel-wifi" title="Wi-Fi" icon={<Wifi />}>
          <div className="text-white/70 text-[1.8vh]">Not connected</div>
        </Panel>
        <Panel id="panel-bluetooth" title="Bluetooth" icon={<Bluetooth />}>
          <div className="text-white/70 text-[1.8vh]">Controller paired</div>
        </Panel>
        <Panel id="panel-volume" title="Volume" icon={<Volume2 />}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1vh] rounded bg-white/10">
              <div className="h-full w-[55%] rounded bg-leaf-500 shadow-glow" />
            </div>
            <div className="text-[1.8vh] opacity-80">55%</div>
          </div>
        </Panel>
        <Panel id="panel-system" title="System" icon={<GaugeCircle />}>
          <ul className="text-[1.8vh] space-y-[1vh] opacity-80">
            <li>CPU Temp: 47°C</li>
            <li>Battery: 83%</li>
            <li>Wi-Fi Signal: -58 dBm</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const { elementRef, isFocused } = useFocusable(id, () => {
    // Handle panel activation (could open detailed settings)
    console.log(`Opening ${title} settings`);
  });
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80 border-leaf-400' : 'border-leaf-300';
  
  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`rounded-2xl border ${focusClass} bg-leaf-100 p-[2.4vh] shadow focus:outline-none transition-all duration-200 cursor-pointer`}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="mb-[1.6vh] flex items-center gap-2 text-[2.6vh] font-semibold">
        <span className="opacity-90">{icon}</span>
        <h3 className="opacity-90">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function BackButton({ id, onBack }: { id: string; onBack: () => void }) {
  const { elementRef, isFocused } = useFocusable(id, onBack);
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80' : 'focus:ring-4 focus:ring-leaf-400/40';
  
  return (
    <button 
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      onClick={onBack} 
      className={`rounded-xl bg-leaf-100 px-[2vh] py-[1.2vh] hover:bg-leaf-200 border border-leaf-300 focus:outline-none ${focusClass} transition-all duration-200`}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="flex items-center gap-2 text-[2.4vh]"><ArrowLeft /> Back</div>
    </button>
  );
}
