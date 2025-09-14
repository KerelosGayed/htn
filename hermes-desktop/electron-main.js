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
    fullscreen: true,
    frame: false,
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
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  const devUrl = 'http://localhost:5173';
  
  if (isDev) {
    console.log('Development mode detected, attempting to load dev URL:', devUrl);
    try {
      await mainWindow.loadURL(devUrl);
      console.log('Successfully loaded dev server');
    } catch (error) {
      console.log('Dev server not available, falling back to production files:', error.message);
      await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
  } else {
    console.log('Production mode detected, loading built files');
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
    // For shell scripts, we need to ensure proper execution
    const execOptions = { 
      cwd: repoRoot, 
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options 
    };
    
    console.log(`Executing command: ${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args, execOptions);
    
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', d => (stdout += d.toString()));
    child.stderr?.on('data', d => (stderr += d.toString()));
    child.on('error', (error) => {
      console.error('Command execution error:', error);
      reject(error);
    });
    child.on('close', code => {
      console.log(`Command exited with code: ${code}`);
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(new Error(stderr || `Process exited with code ${code}`));
    });
  });
}

// Use bash/python on Linux/RPi; return friendly message on Windows
const bashPath = '/bin/bash';
const pythonPath = 'python3';

ipcMain.handle('hermes:steamlink:launch', async () => {
  if (isWindows) {
    return { ok: false, error: 'Steam Link launch supported on Raspberry Pi only. Please deploy to your Pi first.' };
  }
  
  const script = path.join(repoRoot, 'open_steam_link.sh');
  
  try {
    console.log('Attempting to launch Steam Link with script:', script);
    
    // First ensure the script is executable (this will fail silently if already executable)
    try {
      await runCommand('chmod', ['+x', script]);
    } catch (chmodError) {
      console.warn('Could not make script executable (may already be executable):', chmodError.message);
    }
    
    // Now execute the script
    const res = await runCommand(bashPath, [script]);
    console.log('Steam Link launch result:', res);
    return { ok: true, message: 'Steam Link launched successfully', stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    console.error('Steam Link launch failed:', error);
    return { ok: false, error: `Failed to launch Steam Link: ${error.message}`, stderr: error.stderr };
  }
});

// Volume
ipcMain.handle('hermes:volume:get', async () => {
  if (isWindows) return { ok: true, stdout: '50% [on]' };
  try {
    const res = await runCommand('amixer', ['get', 'Master']);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('hermes:volume:set', async (_e, pct) => {
  if (isWindows) return { ok: true };
  try {
    const res = await runCommand('amixer', ['set', 'Master', `${pct}%`]);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('hermes:volume:inc', async (_e, step = 5) => {
  if (isWindows) return { ok: true };
  try {
    const res = await runCommand('amixer', ['set', 'Master', `${step}%+`]);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('hermes:volume:dec', async (_e, step = 5) => {
  if (isWindows) return { ok: true };
  try {
    const res = await runCommand('amixer', ['set', 'Master', `${step}%-`]);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('hermes:volume:mute', async () => {
  if (isWindows) return { ok: true };
  try {
    const res = await runCommand('amixer', ['set', 'Master', 'mute']);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('hermes:volume:unmute', async () => {
  if (isWindows) return { ok: true };
  try {
    const res = await runCommand('amixer', ['set', 'Master', 'unmute']);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

// Wi‑Fi via wifi_manage.sh
ipcMain.handle('hermes:wifi:list', async () => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi manage supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  try {
    const res = await runCommand(bashPath, [sh, 'list']);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('hermes:wifi:status', async () => {
  if (isWindows) return { ok: false, error: 'Wi‑Fi status supported on Raspberry Pi only.' };
  const sh = path.join(repoRoot, 'wifi_manage.sh');
  try {
    const res = await runCommand(bashPath, [sh, 'status']);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
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
  try {
    const res = await runCommand(pythonPath, [batteryScript, '--json']);
    return { ok: true, stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
