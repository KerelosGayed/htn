import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation';
import { useFocus, useFocusable } from '../../hooks/useFocus';
import { useVolumeControls } from '../../hooks/useVolumeControls';

type LaunchStatus = 'idle' | 'launching' | 'success' | 'error';

export function StartStreamingScreen({ onBack }: { onBack: () => void }) {
  const { moveFocus, activateFocused, clearFocus } = useFocus();
  const { handleVolumeUp, handleVolumeDown } = useVolumeControls();
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const providers = [
    { id: 'steamlink', name: 'Steam Link', accent: 'purple' },
    { id: 'moonlight', name: 'Moonlight', accent: 'blue' },
    { id: 'parsec', name: 'Parsec', accent: 'gold' },
  ] as const;

  const handleProviderLaunch = async (providerId: string, providerName: string) => {
    setLaunchStatus('launching');
    setStatusMessage(`Launching ${providerName}...`);
    
    try {
      if (providerId === 'steamlink') {
        // Use the IPC handler to launch Steam Link
        const result = await (window as any).hermes?.steamlinkLaunch();
        
        if (result?.ok) {
          setLaunchStatus('success');
          setStatusMessage(`${providerName} launched successfully!`);
          // Auto-hide success message after 2 seconds
          setTimeout(() => {
            setLaunchStatus('idle');
            setStatusMessage('');
          }, 2000);
        } else {
          setLaunchStatus('error');
          setStatusMessage(result?.error || result?.stderr || `Failed to launch ${providerName}`);
          // Auto-hide error message after 4 seconds
          setTimeout(() => {
            setLaunchStatus('idle');
            setStatusMessage('');
          }, 4000);
        }
      } else {
        // For now, just show that other providers aren't implemented yet
        setLaunchStatus('error');
        setStatusMessage(`${providerName} integration coming soon!`);
        setTimeout(() => {
          setLaunchStatus('idle');
          setStatusMessage('');
        }, 3000);
      }
    } catch (error) {
      setLaunchStatus('error');
      setStatusMessage(`Error launching ${providerName}: ${error}`);
      setTimeout(() => {
        setLaunchStatus('idle');
        setStatusMessage('');
      }, 4000);
    }
  };

  // Set up gamepad navigation
  useGamepadNavigation({
    onDpadUp: () => moveFocus('up'),
    onDpadDown: () => moveFocus('down'),
    onDpadLeft: () => moveFocus('left'),
    onDpadRight: () => moveFocus('right'),
    onA: () => activateFocused(),
    onB: () => onBack(),
    onLeftBumper: handleVolumeUp,
    onLeftTrigger: handleVolumeDown,
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

      {/* Status message overlay */}
      {launchStatus !== 'idle' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-leaf-100 rounded-2xl p-[4vh] min-w-[40vw] text-center border border-leaf-300 shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-[2vh]">
              {launchStatus === 'launching' && (
                <Loader2 className="w-[4vh] h-[4vh] text-leaf-600 animate-spin" />
              )}
              {launchStatus === 'success' && (
                <CheckCircle className="w-[4vh] h-[4vh] text-green-600" />
              )}
              {launchStatus === 'error' && (
                <AlertCircle className="w-[4vh] h-[4vh] text-red-600" />
              )}
            </div>
            <p className="text-[2.4vh] text-leaf-900">{statusMessage}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[60vw] max-w-[110vh] grid grid-cols-1 md:grid-cols-3 gap-[2vh] text-[2.4vh]">
          {providers.map(p => (
            <ProviderButton 
              key={p.id} 
              id={`provider-${p.id}`} 
              name={p.name} 
              disabled={launchStatus === 'launching'}
              onActivate={() => handleProviderLaunch(p.id, p.name)} 
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

function ProviderButton({ id, name, disabled = false, onActivate }: { id: string; name: string; disabled?: boolean; onActivate: () => void }) {
  const { elementRef, isFocused } = useFocusable(id, onActivate, disabled);
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80' : 'focus:ring-4 focus:ring-leaf-400/50';
  
  return (
    <button 
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      onClick={onActivate}
      disabled={disabled}
      className={`aspect-[5/3] w-full rounded-2xl bg-leaf-200 hover:bg-leaf-300 border border-leaf-300 shadow focus:outline-none ${focusClass} transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="h-full w-full flex flex-col items-center justify-center gap-[2vh]">
        {React.isValidElement(Play) ? React.cloneElement(Play as React.ReactElement<any, any>, ({ ...(Play as any).props, className: `${(Play as any).props?.className ?? ''} w-[7.5vh] h-[7.5vh] text-leaf-800`} as any)) : <Play className="text-[7.5vh] text-leaf-800" />}
        <div className="text-[2.4vh] text-leaf-900">{name}</div>
      </div>
    </button>
  );
}
