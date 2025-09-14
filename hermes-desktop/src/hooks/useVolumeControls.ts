import { useCallback } from 'react';

export function useVolumeControls() {
  const handleVolumeUp = useCallback(async () => {
    try {
      if (window.hermes?.volume?.inc) {
        await window.hermes.volume.inc(5);
        console.log('Volume increased');
      }
    } catch (error) {
      console.error('Failed to increase volume:', error);
    }
  }, []);

  const handleVolumeDown = useCallback(async () => {
    try {
      if (window.hermes?.volume?.dec) {
        await window.hermes.volume.dec(5);
        console.log('Volume decreased');
      }
    } catch (error) {
      console.error('Failed to decrease volume:', error);
    }
  }, []);

  return { handleVolumeUp, handleVolumeDown };
}