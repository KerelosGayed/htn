import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wifi, Bluetooth, Volume2, GaugeCircle, WifiOff, Loader2, VolumeX, Battery, Cpu, Signal } from 'lucide-react';
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation';
import { useFocus, useFocusable } from '../../hooks/useFocus';
import { useVolumeControls } from '../../hooks/useVolumeControls';

interface SystemStatus {
  wifi: {
    connected: boolean;
    ssid?: string;
    signal?: string;
    status: 'idle' | 'scanning' | 'connecting' | 'error';
  };
  bluetooth: {
    enabled: boolean;
    connected: boolean;
    devices: string[];
  };
  volume: {
    level: number;
    muted: boolean;
  };
  system: {
    cpuTemp?: string;
    battery?: number;
    wifiSignal?: string;
  };
}

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { moveFocus, activateFocused, clearFocus } = useFocus();
  const { handleVolumeUp, handleVolumeDown } = useVolumeControls();
  const [status, setStatus] = useState<SystemStatus>({
    wifi: { connected: false, status: 'idle' },
    bluetooth: { enabled: false, connected: false, devices: [] },
    volume: { level: 55, muted: false },
    system: {}
  });

  // Load initial system status
  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      // Load Wi-Fi status
      const wifiResult = await (window as any).hermes?.wifi?.status();
      if (wifiResult?.ok) {
        // Parse wifi status from stdout
        const wifiConnected = wifiResult.stdout?.includes('connected') || wifiResult.stdout?.includes('activated');
        setStatus(prev => ({
          ...prev,
          wifi: { ...prev.wifi, connected: wifiConnected, status: 'idle' }
        }));
      }

      // Load volume
      const volumeResult = await (window as any).hermes?.volume?.get();
      if (volumeResult?.ok) {
        // Parse volume from stdout (format: "55%" and "[on]" or "[off]")
        const volumeMatch = volumeResult.stdout?.match(/(\d+)%/);
        const muteMatch = volumeResult.stdout?.match(/\[(on|off)\]/);
        if (volumeMatch) {
          const level = parseInt(volumeMatch[1]);
          const muted = muteMatch?.[1] === 'off';
          setStatus(prev => ({
            ...prev,
            volume: { level, muted }
          }));
        }
      }

      // Load Bluetooth status
      const btResult = await (window as any).hermes?.bt?.paired();
      if (btResult?.ok) {
        const devices = btResult.stdout?.split('\n').filter((line: string) => line.trim().length > 0) || [];
        setStatus(prev => ({
          ...prev,
          bluetooth: { ...prev.bluetooth, devices }
        }));
      }

      // Load system status (battery, CPU temp, wifi signal)
      const systemResult = await (window as any).hermes?.system?.status();
      if (systemResult?.ok) {
        try {
          const systemData = JSON.parse(systemResult.stdout || '{}');
          setStatus(prev => ({
            ...prev,
            system: {
              cpuTemp: systemData.cpu_temp,
              battery: systemData.battery,
              wifiSignal: systemData.wifi_signal
            }
          }));
        } catch (error) {
          console.error('Error parsing system status:', error);
        }
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  const handleWifiToggle = async () => {
    setStatus(prev => ({
      ...prev,
      wifi: { ...prev.wifi, status: 'scanning' }
    }));

    try {
      if (status.wifi.connected) {
        // Disconnect
        const result = await (window as any).hermes?.wifi?.disconnect();
        setStatus(prev => ({
          ...prev,
          wifi: { 
            ...prev.wifi, 
            connected: !result?.ok ? prev.wifi.connected : false, 
            status: 'idle',
            ssid: result?.ok ? undefined : prev.wifi.ssid
          }
        }));
      } else {
        // For now, just show available networks (full connection UI would be complex)
        const result = await (window as any).hermes?.wifi?.list();
        console.log('Available networks:', result?.stdout);
        setStatus(prev => ({
          ...prev,
          wifi: { ...prev.wifi, status: 'idle' }
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        wifi: { ...prev.wifi, status: 'error' }
      }));
    }
  };

  const handleVolumeControl = async (action: 'up' | 'down' | 'mute') => {
    try {
      let result;
      switch (action) {
        case 'up':
          result = await (window as any).hermes?.volume?.inc(5);
          break;
        case 'down':
          result = await (window as any).hermes?.volume?.dec(5);
          break;
        case 'mute':
          result = status.volume.muted 
            ? await (window as any).hermes?.volume?.unmute()
            : await (window as any).hermes?.volume?.mute();
          break;
      }
      
      if (result?.ok) {
        // Reload volume status
        loadSystemStatus();
      }
    } catch (error) {
      console.error('Volume control error:', error);
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
    onLeftBumper: async () => {
      await handleVolumeUp();
      loadSystemStatus(); // Reload to show updated volume
    },
    onLeftTrigger: async () => {
      await handleVolumeDown();
      loadSystemStatus(); // Reload to show updated volume
    },
  });

  // Clear focus when leaving this screen
  useEffect(() => {
    return () => clearFocus();
  }, [clearFocus]);
  return (
    <div className="h-screen w-screen p-[4vh] flex flex-col gap-[3vh]">
      <header className="flex items-center justify-between">
        <BackButton id="back-button" onBack={onBack} />
        <h2 className="text-[3.4vh] font-semibold opacity-90 drop-shadow">Settings</h2>
        <div />
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-[2vh] text-[2.2vh]">
        <Panel id="panel-wifi" title="Wi-Fi" icon={status.wifi.connected ? <Wifi /> : <WifiOff />} onActivate={handleWifiToggle}>
          <div className="space-y-[1vh]">
            <div className="flex items-center gap-2">
              {status.wifi.status === 'scanning' && <Loader2 className="w-[2vh] h-[2vh] animate-spin" />}
              <div className="text-leaf-700 text-[1.8vh]">
                {status.wifi.connected ? 'Connected' : 'Not connected'}
                {status.wifi.ssid && ` to ${status.wifi.ssid}`}
              </div>
            </div>
            <div className="text-[1.6vh] text-leaf-600">
              {status.wifi.status === 'scanning' && 'Scanning...'}
              {status.wifi.status === 'idle' && (status.wifi.connected ? 'Click to disconnect' : 'Click to scan networks')}
              {status.wifi.status === 'error' && 'Connection error'}
            </div>
          </div>
        </Panel>
        
        <Panel id="panel-bluetooth" title="Bluetooth" icon={<Bluetooth />} onActivate={() => console.log('Bluetooth settings')}>
          <div className="text-leaf-700 text-[1.8vh]">
            {status.bluetooth.devices.length > 0 
              ? `${status.bluetooth.devices.length} device(s) paired`
              : 'No devices paired'
            }
          </div>
        </Panel>
        
        <Panel id="panel-volume" title="Volume" icon={status.volume.muted ? <VolumeX /> : <Volume2 />}>
          <div className="space-y-[1.5vh]">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1vh] rounded bg-leaf-200">
                <div 
                  className={`h-full rounded transition-all duration-200 ${status.volume.muted ? 'bg-red-400' : 'bg-leaf-500'}`}
                  style={{ width: `${status.volume.level}%` }}
                />
              </div>
              <div className="text-[1.8vh] opacity-80 min-w-[4vh]">
                {status.volume.muted ? 'MUTE' : `${status.volume.level}%`}
              </div>
            </div>
            <div className="text-[1.4vh] opacity-60 text-center">
              Use Left Bumper/Trigger to adjust volume
            </div>
          </div>
        </Panel>
        
        <Panel id="panel-system" title="System" icon={<GaugeCircle />} onActivate={() => loadSystemStatus()}>
          <ul className="text-[1.8vh] space-y-[1vh] opacity-80">
            <li className="flex items-center gap-2">
              <Cpu className="w-[2vh] h-[2vh]" />
              CPU Temp: {status.system.cpuTemp || 'Unknown'}
            </li>
            <li className="flex items-center gap-2">
              <Battery className="w-[2vh] h-[2vh]" />
              Battery: {status.system.battery ? `${status.system.battery}%` : 'Unknown'}
            </li>
            <li className="flex items-center gap-2">
              <Signal className="w-[2vh] h-[2vh]" />
              Wi-Fi Signal: {status.system.wifiSignal || 'Unknown'}
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ id, title, icon, children, onActivate }: { 
  id: string; 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  onActivate?: () => void;
}) {
  const { elementRef, isFocused } = useFocusable(id, onActivate || (() => console.log(`Opening ${title} settings`)));
  const focusClass = isFocused ? 'ring-4 ring-leaf-400/80 border-leaf-400' : 'border-leaf-300';
  
  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`rounded-2xl border ${focusClass} bg-leaf-100 p-[2.4vh] shadow focus:outline-none transition-all duration-200 cursor-pointer`}
      tabIndex={isFocused ? 0 : -1}
      onClick={onActivate}
    >
      <div className="mb-[1.6vh] flex items-center gap-2 text-[2.6vh] font-semibold">
        <span className="opacity-90">{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any, any>, ({ ...(icon as any).props, className: `${(icon as any).props?.className ?? ''} w-[3.6vh] h-[3.6vh]`} as any)) : icon}</span>
        <h3 className="opacity-90">{title}</h3>
      </div>
      <div>{children}</div>
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
