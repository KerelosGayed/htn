import React, { useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation';
import { useFocus, useFocusable } from '../../hooks/useFocus';

export function StartStreamingScreen({ onBack }: { onBack: () => void }) {
  const { moveFocus, activateFocused, clearFocus } = useFocus();
  
  const providers = [
    { id: 'steamlink', name: 'Steam Link', accent: 'purple' },
    { id: 'moonlight', name: 'Moonlight', accent: 'blue' },
    { id: 'parsec', name: 'Parsec', accent: 'gold' },
  ] as const;

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
        <h2 className="text-[3vh] opacity-80">Choose a provider</h2>
        <div />
      </header>

      <div className="flex-1 flex items-center justify-center">
  <div className="w-[60vw] max-w-[110vh] grid grid-cols-1 md:grid-cols-3 gap-[2vh] text-[2.4vh]">
          {providers.map(p => (
            <ProviderButton 
              key={p.id} 
              id={`provider-${p.id}`} 
              name={p.name} 
              onActivate={() => {
                // Handle provider launch here
                console.log(`Launching ${p.name}`);
              }} 
            />
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

function ProviderButton({ id, name, onActivate }: { id: string; name: string; onActivate: () => void }) {
  const { elementRef, isFocused } = useFocusable(id, onActivate);
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80' : 'focus:ring-4 focus:ring-leaf-400/50';
  
  return (
    <button 
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      onClick={onActivate}
      className={`aspect-[5/3] w-full rounded-2xl bg-leaf-200 hover:bg-leaf-300 border border-leaf-300 shadow focus:outline-none ${focusClass} transition-all duration-200`}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="h-full w-full flex flex-col items-center justify-center gap-[2vh]">
  {React.isValidElement(Play) ? React.cloneElement(Play as React.ReactElement<any, any>, ({ ...(Play as any).props, className: `${(Play as any).props?.className ?? ''} w-[7.5vh] h-[7.5vh] text-leaf-800`} as any)) : <Play className="text-[7.5vh] text-leaf-800" />}
        <div className="text-[2.4vh] text-leaf-900">{name}</div>
      </div>
    </button>
  );
}
