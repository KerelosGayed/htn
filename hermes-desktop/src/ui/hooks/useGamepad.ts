import { useEffect, useRef } from 'react';

export type GamepadEventType = 'up' | 'down' | 'left' | 'right' | 'select' | 'back';
export type GamepadHandler = (e: { type: GamepadEventType }) => void;

// Lightweight polling hook for gamepad input. No external deps.
export function useGamepad(onEvent: GamepadHandler) {
  const rafRef = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0, a: 0, b: 0 });

  useEffect(() => {
    const poll = () => {
      const pads = navigator.getGamepads?.() || [];
      const gp = pads.find(Boolean) as Gamepad | undefined;
      if (gp) {
        const [lx, ly] = gp.axes;
        const a = gp.buttons[0]?.pressed ? 1 : 0; // A
        const b = gp.buttons[1]?.pressed ? 1 : 0; // B
        const dpadUp = gp.buttons[12]?.pressed;
        const dpadDown = gp.buttons[13]?.pressed;
        const dpadLeft = gp.buttons[14]?.pressed;
        const dpadRight = gp.buttons[15]?.pressed;

        const thr = 0.5;
        const x = lx > thr ? 1 : lx < -thr ? -1 : 0;
        const y = ly > thr ? 1 : ly < -thr ? -1 : 0;

        const emit = (type: GamepadEventType) => onEvent({ type });

        if (x === 1 && last.current.x !== 1) emit('right');
        if (x === -1 && last.current.x !== -1) emit('left');
        if (y === 1 && last.current.y !== 1) emit('down');
        if (y === -1 && last.current.y !== -1) emit('up');

        if (dpadRight && last.current.x !== 2) { emit('right'); last.current.x = 2; }
        if (dpadLeft && last.current.x !== -2) { emit('left'); last.current.x = -2; }
        if (dpadUp && last.current.y !== -2) { emit('up'); last.current.y = -2; }
        if (dpadDown && last.current.y !== 2) { emit('down'); last.current.y = 2; }
        if (!dpadRight && last.current.x === 2) last.current.x = 0;
        if (!dpadLeft && last.current.x === -2) last.current.x = 0;
        if (!dpadUp && last.current.y === -2) last.current.y = 0;
        if (!dpadDown && last.current.y === 2) last.current.y = 0;

        if (a && !last.current.a) emit('select');
        if (b && !last.current.b) emit('back');

        last.current = { x: x || last.current.x, y: y || last.current.y, a, b };
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [onEvent]);
}
