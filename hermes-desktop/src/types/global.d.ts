export {};

declare global {
  interface Window {
    hermes: {
      ping: () => string;
      steamlinkLaunch: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
      volume: {
        get: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        set: (pct: number) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        inc: (step?: number) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        dec: (step?: number) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        mute: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        unmute: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
      };
      wifi: {
        list: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        status: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        connect: (ssid: string, pass?: string) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        disconnect: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        radio: (on: boolean) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
      };
      bt: {
        power: (on: boolean) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        paired: () => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        connect: (mac: string) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        disconnect: (mac: string) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
        scan: (seconds?: number) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>;
      };
    };
  }
}
