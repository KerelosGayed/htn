import React from 'react';
import { ArrowLeft, Play } from 'lucide-react';

export function StartStreamingScreen({ onBack }: { onBack: () => void }) {
  const providers = [
    { name: 'Steam Link', accent: 'purple' },
    { name: 'Moonlight', accent: 'blue' },
    { name: 'Parsec', accent: 'gold' },
  ] as const;

  return (
    <div className="h-screen w-screen p-[4vh] flex flex-col gap-[3vh]">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-xl bg-leaf-100 px-[2vh] py-[1.2vh] hover:bg-leaf-200 border border-leaf-300 focus:outline-none focus:ring-4 focus:ring-leaf-400/40">
          <div className="flex items-center gap-2 text-[2.4vh]"><ArrowLeft /> Back</div>
        </button>
        <h2 className="text-[3vh] opacity-80">Choose a provider</h2>
        <div />
      </header>

      <div className="flex-1 flex items-center justify-center">
  <div className="w-[60vw] max-w-[110vh] grid grid-cols-1 md:grid-cols-3 gap-[2vh] text-[2.4vh]">
          {providers.map(p => (
            <button key={p.name} className="aspect-[5/3] w-full rounded-2xl bg-leaf-200 hover:bg-leaf-300 border border-leaf-300 shadow focus:outline-none focus:ring-4 focus:ring-leaf-400/50 transition-colors">
              <div className="h-full w-full flex flex-col items-center justify-center gap-[2vh]">
                <Play className="text-[5vh] text-leaf-800" />
                <div className="text-[2.4vh] text-leaf-900">{p.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
