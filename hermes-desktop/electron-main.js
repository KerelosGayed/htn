import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === 'win32') {
  app.setAppUserModelId('Hermes');
}

let mainWindow;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#f0fff4', // Light theme background
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Disable sandbox to allow IPC
    },
  });

  // Check if we're in development by looking for Vite dev server
  const isDev = !app.isPackaged;
  const devUrl = 'http://localhost:5173';
  
  if (isDev) {
    console.log('Loading dev URL:', devUrl);
    try {
      await mainWindow.loadURL(devUrl);
    } catch (error) {
      console.error('Failed to load dev URL:', error);
      // Fallback to loading the built files if dev server fails
      await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
  } else {
    console.log('Loading production files');
    await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
};

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC Handlers (Raspberry Pi-first) ----------
const repoRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: repoRoot, shell: false, ...options });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', d => (stdout += d.toString()));
    child.stderr?.on('data', d => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(new Error(stderr || `Exited ${code}`));
    });
  });
}

// Use bash/python on Linux/RPi; return friendly message on Windows
const bashPath = '/bin/bash';
const pythonPath = 'python3';

ipcMain.handle('hermes:steamlink:launch', async () => {
  if (isWindows) return { ok: false, error: 'Steam Link launch supported on Raspberry Pi only.' };
  const script = path.join(repoRoot, 'open_steam_link.sh');
  const res = await runCommand(bashPath, [script]);
  return { ok: true, ...res };
});

// Volume
ipcMain.handle('hermes:volume:get', async () => {
  if (isWindows) return { ok: true, stdout: '50% on' };
  const py = path.join(repoRoot, 'volume_control.py');
  const res = await runCommand(pythonPath, [py, '--get']);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:volume:set', async (_e, pct) => {
  if (isWindows) return { ok: true };
  const py = path.join(repoRoot, 'volume_control.py');
  const res = await runCommand(pythonPath, [py, '--set', String(pct)]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:volume:inc', async (_e, step = 5) => {
  if (isWindows) return { ok: true };
  const py = path.join(repoRoot, 'volume_control.py');
  const res = await runCommand(pythonPath, [py, '--inc', String(step)]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:volume:dec', async (_e, step = 5) => {
  if (isWindows) return { ok: true };
  const py = path.join(repoRoot, 'volume_control.py');
  const res = await runCommand(pythonPath, [py, '--dec', String(step)]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:volume:mute', async () => {
  if (isWindows) return { ok: true };
  const py = path.join(repoRoot, 'volume_control.py');
  const res = await runCommand(pythonPath, [py, '--mute']);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:volume:unmute', async () => {
  if (isWindows) return { ok: true };
  const py = path.join(repoRoot, 'volume_control.py');
  const res = await runCommand(pythonPath, [py, '--unmute']);
  return { ok: true, ...res };
});

// Wi‑Fi via wifi_manage.sh
ipcMain.handle('hermes:wifi:list', async () => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi manage supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  const res = await runCommand(bashPath, [sh, 'list']);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:wifi:status', async () => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi status supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  const res = await runCommand(bashPath, [sh, 'status']);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:wifi:connect', async (_e, { ssid, pass }) => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi connect supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  const args = pass ? ['connect', ssid, pass] : ['connect', ssid];
  const res = await runCommand(bashPath, [sh, ...args]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:wifi:disconnect', async () => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi disconnect supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  const res = await runCommand(bashPath, [sh, 'disconnect']);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:wifi:radio', async (_e, on) => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi toggle supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  const res = await runCommand(bashPath, [sh, on ? 'on' : 'off']);
  return { ok: true, ...res };
});

// Bluetooth via bluetoothctl (basic)
function btCtl(cmds) {
  return runCommand('bluetoothctl', ['--'], { env: process.env, stdio: 'pipe' });
}
ipcMain.handle('hermes:bt:power', async (_e, on) => {
  if (isWindows) return { ok: false, error: 'Bluetooth control supported on Raspberry Pi only.' };
  const res = await runCommand('bash', ['-lc', `bluetoothctl power ${on ? 'on' : 'off'}`]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:bt:paired', async () => {
  if (isWindows) return { ok: false, error: 'Bluetooth control supported on Raspberry Pi only.' };
  const res = await runCommand('bash', ['-lc', `bluetoothctl paired-devices`]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:bt:connect', async (_e, mac) => {
  if (isWindows) return { ok: false, error: 'Bluetooth control supported on Raspberry Pi only.' };
  const res = await runCommand('bash', ['-lc', `bluetoothctl connect ${mac}`]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:bt:disconnect', async (_e, mac) => {
  if (isWindows) return { ok: false, error: 'Bluetooth control supported on Raspberry Pi only.' };
  const res = await runCommand('bash', ['-lc', `bluetoothctl disconnect ${mac}`]);
  return { ok: true, ...res };
});
ipcMain.handle('hermes:bt:scan', async (_e, seconds = 6) => {
  if (isWindows) return { ok: false, error: 'Bluetooth control supported on Raspberry Pi only.' };
  const cmd = `bluetoothctl scan on & sleep ${seconds}; bluetoothctl scan off; bluetoothctl devices`;
  const res = await runCommand('bash', ['-lc', cmd]);
  return { ok: true, ...res };
});

// System status (battery, CPU temp, etc.)
ipcMain.handle('hermes:system:status', async () => {
  if (isWindows) return { 
    ok: true, 
    stdout: JSON.stringify({ 
      cpu_temp: '45.2°C', 
      battery: 78, 
      wifi_signal: '-52 dBm' 
    }) 
  };
  
  const batteryScript = path.join(repoRoot, 'battery_status.py');
  const res = await runCommand(pythonPath, [batteryScript, '--json']);
  return { ok: res.code === 0, ...res };
});
