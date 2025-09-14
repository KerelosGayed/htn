import React from 'react';
import { ArrowLeft } from 'lucide-react';

const games = new Array(18).fill(0).map((_, i) => ({
  id: i + 1,
  title: `Hermes Game ${i + 1}`,
  cover: `https://picsum.photos/seed/hermes-${i + 1}/300/400` // placeholder covers
}));

export function LibraryScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen w-screen p-[4vh] flex flex-col gap-[3vh]">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-xl bg-leaf-100 px-[2vh] py-[1.2vh] hover:bg-leaf-200 border border-leaf-300 focus:outline-none focus:ring-4 focus:ring-leaf-400/40">
          <div className="flex items-center gap-2 text-[2.4vh]"><ArrowLeft /> Back</div>
        </button>
  <h2 className="text-[3.4vh] font-semibold opacity-90 drop-shadow">Library</h2>
        <div />
      </header>

      <div className="flex-1">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[2vh] text-[2vh]">
          {games.map(g => (
            <button key={g.id} className="group rounded-2xl overflow-hidden bg-leaf-100 border border-leaf-300 shadow focus:outline-none focus:ring-4 focus:ring-leaf-400/50">
              <div className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
                <img src={g.cover} alt={g.title} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-[1.2vh] bg-gradient-to-t from-black/60 to-transparent">
                  <div className="text-white text-[2vh] font-medium drop-shadow">{g.title}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
