import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation';
import { useFocus, useFocusable } from '../../hooks/useFocus';

const games = new Array(18).fill(0).map((_, i) => ({
  id: i + 1,
  title: `Hermes Game ${i + 1}`,
  cover: `https://picsum.photos/seed/hermes-${i + 1}/300/400` // placeholder covers
}));

export function LibraryScreen({ onBack }: { onBack: () => void }) {
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
  <h2 className="text-[3.4vh] font-semibold opacity-90 drop-shadow">Library</h2>
        <div />
      </header>

      <div className="flex-1">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[2vh] text-[2vh]">
          {games.map(g => (
            <GameTile key={g.id} id={`game-${g.id}`} game={g} />
          ))}
        </div>
      </div>
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
  <div className="flex items-center gap-2 text-[2.4vh]">{React.isValidElement(ArrowLeft) ? React.cloneElement(ArrowLeft as React.ReactElement<any, any>, ({ ...(ArrowLeft as any).props, className: `${(ArrowLeft as any).props?.className ?? ''} w-[3vh] h-[3vh]`} as any)) : <ArrowLeft />} Back</div>
    </button>
  );
}

function GameTile({ id, game }: { id: string; game: { id: number; title: string; cover: string; } }) {
  const { elementRef, isFocused } = useFocusable(id, () => {
    console.log(`Launching ${game.title}`);
  });
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80 border-leaf-400' : 'border-leaf-300 focus:ring-4 focus:ring-leaf-400/50';
  
  return (
    <button 
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      className={`group rounded-2xl overflow-hidden bg-leaf-100 border ${focusClass} shadow focus:outline-none transition-all duration-200`}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
        <img src={game.cover} alt={game.title} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 p-[1.2vh] bg-gradient-to-t from-black/60 to-transparent">
          <div className="text-white text-[2vh] font-medium drop-shadow">{game.title}</div>
        </div>
      </div>
    </button>
  );
}
