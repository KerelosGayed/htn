import { useEffect, useCallback, useRef } from 'react';

export interface GamepadState {
  connected: boolean;
  leftStick: { x: number; y: number };
  dpad: { up: boolean; down: boolean; left: boolean; right: boolean };
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    lt: boolean;
    rt: boolean;
    back: boolean;
    start: boolean;
    leftStick: boolean;
    rightStick: boolean;
  };
}

export interface GamepadCallbacks {
  onDpadUp?: () => void;
  onDpadDown?: () => void;
  onDpadLeft?: () => void;
  onDpadRight?: () => void;
  onA?: () => void;
  onB?: () => void;
  onX?: () => void;
  onY?: () => void;
  onStart?: () => void;
  onBack?: () => void;
  onLeftBumper?: () => void;
  onLeftTrigger?: () => void;
  onLeftStickMove?: (x: number, y: number) => void;
}

const STICK_DEADZONE = 0.3;
const BUTTON_REPEAT_DELAY = 150; // ms between repeats when holding

export function useGamepadNavigation(callbacks: GamepadCallbacks = {}) {
  const gamepadStateRef = useRef<GamepadState>({
    connected: false,
    leftStick: { x: 0, y: 0 },
    dpad: { up: false, down: false, left: false, right: false },
    buttons: {
      a: false, b: false, x: false, y: false,
      lb: false, rb: false, lt: false, rt: false,
      back: false, start: false, leftStick: false, rightStick: false
    }
  });

  const previousStateRef = useRef<GamepadState>({ ...gamepadStateRef.current });
  const lastInputTimeRef = useRef<{ [key: string]: number }>({});

  // Xbox 360 controller button mapping
  const getButtonValue = (gamepad: Gamepad, index: number): boolean => {
    return gamepad.buttons[index]?.pressed || false;
  };

  const getAxisValue = (gamepad: Gamepad, index: number): number => {
    const value = gamepad.axes[index] || 0;
    return Math.abs(value) > STICK_DEADZONE ? value : 0;
  };

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use first connected gamepad

    if (!gamepad) {
      gamepadStateRef.current.connected = false;
      return;
    }

    const previousState = { ...gamepadStateRef.current };
    const currentTime = Date.now();

    // Update gamepad state
    gamepadStateRef.current = {
      connected: true,
      leftStick: {
        x: getAxisValue(gamepad, 0),
        y: getAxisValue(gamepad, 1)
      },
      dpad: {
        up: getButtonValue(gamepad, 12),
        down: getButtonValue(gamepad, 13),
        left: getButtonValue(gamepad, 14),
        right: getButtonValue(gamepad, 15)
      },
      buttons: {
        a: getButtonValue(gamepad, 0),
        b: getButtonValue(gamepad, 1),
        x: getButtonValue(gamepad, 2),
        y: getButtonValue(gamepad, 3),
        lb: getButtonValue(gamepad, 4),
        rb: getButtonValue(gamepad, 5),
        lt: gamepad.buttons[6]?.value > 0.5,
        rt: gamepad.buttons[7]?.value > 0.5,
        back: getButtonValue(gamepad, 8),
        start: getButtonValue(gamepad, 9),
        leftStick: getButtonValue(gamepad, 10),
        rightStick: getButtonValue(gamepad, 11)
      }
    };

    const state = gamepadStateRef.current;
    const shouldRepeat = (key: string) => {
      const lastTime = lastInputTimeRef.current[key] || 0;
      return currentTime - lastTime > BUTTON_REPEAT_DELAY;
    };

    // Handle D-pad navigation (with repeat for held buttons)
    if ((state.dpad.up || state.leftStick.y < -STICK_DEADZONE) && shouldRepeat('up')) {
      callbacks.onDpadUp?.();
      lastInputTimeRef.current.up = currentTime;
    }
    if ((state.dpad.down || state.leftStick.y > STICK_DEADZONE) && shouldRepeat('down')) {
      callbacks.onDpadDown?.();
      lastInputTimeRef.current.down = currentTime;
    }
    if ((state.dpad.left || state.leftStick.x < -STICK_DEADZONE) && shouldRepeat('left')) {
      callbacks.onDpadLeft?.();
      lastInputTimeRef.current.left = currentTime;
    }
    if ((state.dpad.right || state.leftStick.x > STICK_DEADZONE) && shouldRepeat('right')) {
      callbacks.onDpadRight?.();
      lastInputTimeRef.current.right = currentTime;
    }

    // Handle button presses (only on press, not hold)
    if (state.buttons.a && !previousState.buttons.a) {
      callbacks.onA?.();
    }
    if (state.buttons.b && !previousState.buttons.b) {
      callbacks.onB?.();
    }
    if (state.buttons.x && !previousState.buttons.x) {
      callbacks.onX?.();
    }
    if (state.buttons.y && !previousState.buttons.y) {
      callbacks.onY?.();
    }
    if (state.buttons.start && !previousState.buttons.start) {
      callbacks.onStart?.();
    }
    if (state.buttons.back && !previousState.buttons.back) {
      callbacks.onBack?.();
    }
    
    // Handle volume controls with bumpers/triggers
    if (state.buttons.lb && !previousState.buttons.lb) {
      callbacks.onLeftBumper?.(); // Volume up
    }
    if (state.buttons.lt && !previousState.buttons.lt) {
      callbacks.onLeftTrigger?.(); // Volume down
    }

    // Handle left stick movement
    if (callbacks.onLeftStickMove) {
      const stickMoved = Math.abs(state.leftStick.x - previousState.leftStick.x) > 0.1 ||
                        Math.abs(state.leftStick.y - previousState.leftStick.y) > 0.1;
      if (stickMoved) {
        callbacks.onLeftStickMove(state.leftStick.x, state.leftStick.y);
      }
    }

    previousStateRef.current = previousState;
  }, [callbacks]);

  useEffect(() => {
    const interval = setInterval(pollGamepad, 16); // ~60fps polling
    return () => clearInterval(interval);
  }, [pollGamepad]);

  return {
    gamepadState: gamepadStateRef.current,
    isConnected: gamepadStateRef.current.connected
  };
}