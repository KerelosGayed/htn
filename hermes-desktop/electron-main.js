import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

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
      preload: path.join(__dirname, 'preload.cjs'),
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
    
    console.log(`🔧 Executing command: ${cmd} ${args.join(' ')}`);
    console.log(`📁 Working directory: ${execOptions.cwd}`);
    console.log(`⚙️ Options:`, execOptions);
    
    const child = spawn(cmd, args, execOptions);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(`📤 [${cmd}] stdout:`, chunk.trim());
    });
    
    child.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.log(`📤 [${cmd}] stderr:`, chunk.trim());
    });
    
    child.on('error', (error) => {
      console.error(`❌ [${cmd}] Command execution error:`, error);
      console.error(`❌ [${cmd}] Error code:`, error.code);
      console.error(`❌ [${cmd}] Error errno:`, error.errno);
      console.error(`❌ [${cmd}] Error syscall:`, error.syscall);
      console.error(`❌ [${cmd}] Error path:`, error.path);
      reject(error);
    });
    
    child.on('close', (code, signal) => {
      console.log(`🏁 [${cmd}] Command completed with exit code: ${code}, signal: ${signal}`);
      console.log(`📊 [${cmd}] Final stdout length: ${stdout.length} chars`);
      console.log(`📊 [${cmd}] Final stderr length: ${stderr.length} chars`);
      
      if (code === 0) {
        console.log(`✅ [${cmd}] Command succeeded`);
        resolve({ code, stdout, stderr });
      } else {
        const error = new Error(stderr || `Process exited with code ${code}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        error.signal = signal;
        
        console.error(`❌ [${cmd}] Command failed with exit code ${code}`);
        if (stderr) console.error(`❌ [${cmd}] stderr: ${stderr}`);
        if (stdout) console.error(`📤 [${cmd}] stdout: ${stdout}`);
        
        reject(error);
      }
    });
  });
}

// Use bash/python on Linux/RPi; return friendly message on Windows
const bashPath = '/bin/bash';
const pythonPaths = ['python3', 'python', '/usr/bin/python3', '/usr/bin/python'];

// Helper function to find working Python path
async function findPythonPath() {
  for (const pythonPath of pythonPaths) {
    try {
      const res = await runCommand(pythonPath, ['--version']);
      if (res.ok) {
        console.log(`✅ Found working Python: ${pythonPath}`);
        return pythonPath;
      }
    } catch (error) {
      console.log(`❌ Python ${pythonPath} not found:`, error.message);
    }
  }
  console.error('❌ No working Python found');
  return 'python3'; // fallback
}

ipcMain.handle('hermes:steamlink:launch', async () => {
  console.log('=== Steam Link Launch Request Received ===');
  
  if (isWindows) {
    const errorMsg = 'Steam Link launch supported on Raspberry Pi only. Please deploy to your Pi first.';
    console.error('❌ PLATFORM ERROR:', errorMsg);
    return { ok: false, error: errorMsg };
  }
  
  const script = path.join(repoRoot, 'open_steam_link.sh');
  
  console.log('=== Steam Link Launch Debug ===');
  console.log('📁 Current working directory:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  console.log('📁 repoRoot:', repoRoot);
  console.log('📄 Script path:', script);
  console.log('🐧 Platform:', process.platform);
  console.log('🔧 Bash path:', bashPath);
  
  try {
    // Check if the script file exists
    const scriptExists = fs.existsSync(script);
    console.log('✅ Script exists:', scriptExists);
    
    if (!scriptExists) {
      const errorMsg = `Steam Link script not found at: ${script}`;
      console.error('❌ FILE NOT FOUND:', errorMsg);
      console.log('📂 Checking parent directory contents...');
      
      try {
        const parentDir = path.dirname(script);
        const files = fs.readdirSync(parentDir);
        console.log('📋 Files in', parentDir, ':', files);
        
        // Look for any .sh files
        const shFiles = files.filter(f => f.endsWith('.sh'));
        if (shFiles.length > 0) {
          console.log('🔍 Found .sh files:', shFiles);
        } else {
          console.log('⚠️ No .sh files found in parent directory');
        }
      } catch (dirError) {
        console.error('❌ Error reading parent directory:', dirError.message);
      }
      
      return { ok: false, error: errorMsg };
    }
    
    // Check script permissions
    try {
      const stats = fs.statSync(script);
      const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);
      console.log('🔐 Script is executable:', isExecutable);
      console.log('📊 Script permissions (octal):', (stats.mode & parseInt('777', 8)).toString(8));
    } catch (statError) {
      console.error('⚠️ Could not check script permissions:', statError.message);
    }
    
    console.log('🚀 Attempting to launch Steam Link with script:', script);
    
    // First ensure the script is executable
    try {
      console.log('🔧 Making script executable...');
      await runCommand('chmod', ['+x', script]);
      console.log('✅ Made script executable');
    } catch (chmodError) {
      console.warn('⚠️ Could not make script executable (may already be executable):', chmodError.message);
    }
    
    // Check if bash exists
    try {
      await runCommand('which', ['bash']);
      console.log('✅ Bash is available');
    } catch (bashError) {
      console.error('❌ Bash not found:', bashError.message);
      return { ok: false, error: `Bash shell not available: ${bashError.message}` };
    }
    
    // Now execute the script
    console.log('⚡ Executing script...');
    const res = await runCommand(bashPath, [script]);
    console.log('✅ Steam Link launch completed successfully');
    console.log('📤 stdout:', res.stdout);
    console.log('📤 stderr:', res.stderr);
    
    return { ok: true, message: 'Steam Link launched successfully', stdout: res.stdout, stderr: res.stderr };
  } catch (error) {
    console.error('❌ STEAM LINK LAUNCH FAILED ❌');
    console.error('💥 Error type:', error.constructor.name);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error code:', error.code);
    console.error('💥 Full error object:', error);
    
    if (error.stderr) {
      console.error('📤 stderr output:', error.stderr);
    }
    if (error.stdout) {
      console.error('📤 stdout output:', error.stdout);
    }
    
    // Provide specific error guidance
    console.error(error.message);
    let specificError = `Failed to launch Steam Link: ${error.message}`;
    
    if (error.code === 'ENOENT') {
      specificError += '\n🔍 Possible causes:\n' +
        '  - Script file does not exist\n' +
        '  - Bash shell is not installed\n' +
        '  - Path resolution issue';
    } else if (error.code === 'EACCES') {
      specificError += '\n🔍 Possible causes:\n' +
        '  - Script is not executable (permissions issue)\n' +
        '  - Directory permissions problem';
    } else if (error.code === 'EPERM') {
      specificError += '\n🔍 Possible causes:\n' +
        '  - Permission denied\n' +
        '  - Need to run with different privileges';
    } else if (error.message.includes('steamlink')) {
      specificError += '\n🔍 Possible causes:\n' +
        '  - Steam Link is not installed on the system\n' +
        '  - Steam Link binary is not in PATH';
    }
    
    console.error('🎯 Specific diagnosis:', specificError);
    
    return { ok: false, error: specificError, stderr: error.stderr };
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
  console.log('🔍 System status requested');
  console.log('📊 isWindows:', isWindows);
  console.log('📁 repoRoot:', repoRoot);
  
  if (isWindows) {
    console.log('💻 Returning Windows mock data');
    return { 
      ok: true, 
      stdout: JSON.stringify({ 
        cpu_temp: '45.2°C', 
        battery: 78, 
        wifi_signal: '-52 dBm' 
      }) 
    };
  }
  
  const batteryScript = path.join(repoRoot, 'battery_status.py');
  console.log('🐍 Battery script path:', batteryScript);
  
  // Find working Python path
  const workingPythonPath = await findPythonPath();
  console.log('🔧 Using Python path:', workingPythonPath);
  
  // Check if script exists
  try {
    const fs = await import('fs');
    if (!fs.existsSync(batteryScript)) {
      console.error('❌ Battery script not found:', batteryScript);
      return { ok: false, error: `Script not found: ${batteryScript}` };
    }
    console.log('✅ Battery script exists');
  } catch (fsError) {
    console.error('❌ Error checking script existence:', fsError);
    return { ok: false, error: `Cannot check script: ${fsError.message}` };
  }
  
  try {
    console.log('🚀 Running command:', workingPythonPath, [batteryScript, '--json']);
    const res = await runCommand(workingPythonPath, [batteryScript, '--json']);
    console.log('📊 Command result:', res);
    
    if (res.ok) {
      console.log('✅ System status success - stdout:', res.stdout);
      console.log('⚠️  System status stderr:', res.stderr);
      return { ok: true, stdout: res.stdout, stderr: res.stderr };
    } else {
      console.error('❌ System status command failed:', res);
      return { ok: false, error: res.error || res.stderr || 'Command failed' };
    }
  } catch (error) {
    console.error('❌ System status error:', error);
    return { ok: false, error: error.message };
  }
});
