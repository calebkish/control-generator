import { spawn } from 'node:child_process';
import { platform } from 'node:process';
import path from 'node:path';

if (platform === 'win32') {
  const serverExePath = path.join(process.cwd(), 'whisper', 'windows', 'server.exe');

  const modelPath = path.join(process.cwd(), 'whisper', 'ggml-tiny.en.bin');

  const newPath = process.env['PATH'] + `;${path.join(process.cwd(), 'whisper', 'windows')}`;

  const server = spawn(
    serverExePath,
    ['--convert', '--print-realtime', '--model', modelPath],
    {
      env: { 'PATH': newPath },
    }
  );

  server.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  server.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  server.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
} else if (platform === 'darwin') {
  console.log('mac');
} else if (platform === 'linux') {
  console.log('linux');
}
