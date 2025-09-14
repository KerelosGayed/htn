import React from 'react';
import { ArrowLeft, Wifi, Bluetooth, Volume2, GaugeCircle } from 'lucide-react';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen w-screen p-[4vh] flex flex-col gap-[3vh]">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-xl bg-leaf-100 px-[2vh] py-[1.2vh] hover:bg-leaf-200 border border-leaf-300 focus:outline-none focus:ring-4 focus:ring-leaf-400/40">
          <div className="flex items-center gap-2 text-[2.4vh]"><ArrowLeft /> Back</div>
        </button>
  <h2 className="text-[3.4vh] font-semibold opacity-90 drop-shadow">Settings</h2>
        <div />
      </header>

  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-[2vh] text-[2.2vh]">
        <Panel title="Wi-Fi" icon={<Wifi />}>
          <div className="text-white/70 text-[1.8vh]">Not connected</div>
        </Panel>
        <Panel title="Bluetooth" icon={<Bluetooth />}>
          <div className="text-white/70 text-[1.8vh]">Controller paired</div>
        </Panel>
        <Panel title="Volume" icon={<Volume2 />}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1vh] rounded bg-white/10">
              <div className="h-full w-[55%] rounded bg-leaf-500 shadow-glow" />
            </div>
            <div className="text-[1.8vh] opacity-80">55%</div>
          </div>
        </Panel>
        <Panel title="System" icon={<GaugeCircle />}>
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

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-leaf-300 bg-leaf-100 p-[2.4vh] shadow">
      <div className="mb-[1.6vh] flex items-center gap-2 text-[2.6vh] font-semibold">
        <span className="opacity-90">{icon}</span>
        <h3 className="opacity-90">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}
