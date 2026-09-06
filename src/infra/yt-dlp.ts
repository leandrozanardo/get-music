import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '@/src/domain/errors';

type YtDlpResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

async function collectMp3Files(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMp3Files(fullPath)));
      continue;
    }

    if (entry.name.toLowerCase().endsWith('.mp3')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function runYtDlp(args: string[]): Promise<YtDlpResult> {
  return new Promise((resolve, reject) => {
    // Prefer direct spawn so argv is not shell-concatenated on Windows.
    const child = spawn('yt-dlp', args, {
      windowsHide: true,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

function mapYtDlpFailure(stderr: string, stdout: string): AppError {
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (
    combined.includes('no audio') ||
    combined.includes('no video') ||
    combined.includes('requested format is not available') ||
    combined.includes('no formats found') ||
    combined.includes('only images are available')
  ) {
    return new AppError(
      'No audio available for this resource (YouTube did not provide an audio stream).',
      'NO_AUDIO',
      404,
    );
  }

  const detail = stderr.trim() || stdout.trim();
  return new AppError(
    detail ? `Download failed: ${detail.slice(0, 500)}` : 'Download failed',
    'DOWNLOAD_FAILED',
    500,
  );
}

async function resolveDownloadedMp3(outDir: string, fileBase?: string): Promise<string> {
  const mp3Files = await collectMp3Files(outDir);

  if (mp3Files.length === 0) {
    throw new AppError('Download completed but no MP3 file was found', 'DOWNLOAD_FAILED', 500);
  }

  if (fileBase) {
    const matching = mp3Files.filter((filePath) => path.basename(filePath).startsWith(fileBase));
    if (matching.length > 0) {
      return matching[0];
    }
  }

  return mp3Files[0];
}

export async function downloadBestMp3(
  url: string,
  outDir: string,
  fileBase = 'track',
): Promise<{ filePath: string }> {
  const outputTemplate = path.join(outDir, `${fileBase}.%(ext)s`);
  const args = [
    '-f',
    'bestaudio/best',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
    '--no-playlist',
    '-o',
    outputTemplate,
    url,
  ];

  const result = await runYtDlp(args);
  if (result.exitCode !== 0) {
    throw mapYtDlpFailure(result.stderr, result.stdout);
  }

  const filePath = await resolveDownloadedMp3(outDir, fileBase);
  return { filePath };
}

export async function downloadBestMp3FromQuery(
  query: string,
  outDir: string,
  fileBase = 'track',
): Promise<{ filePath: string }> {
  return downloadBestMp3(`ytsearch1:${query}`, outDir, fileBase);
}

export async function downloadPlaylistMp3s(
  playlistUrl: string,
  outDir: string,
): Promise<{ files: string[] }> {
  const outputTemplate = path.join(outDir, '%(playlist_index)03d-%(title)s.%(ext)s');
  const args = [
    '-f',
    'bestaudio/best',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
    '-o',
    outputTemplate,
    playlistUrl,
  ];

  const result = await runYtDlp(args);
  if (result.exitCode !== 0) {
    throw mapYtDlpFailure(result.stderr, result.stdout);
  }

  const files = await collectMp3Files(outDir);
  if (files.length === 0) {
    throw new AppError('Playlist download completed but no MP3 files were found', 'DOWNLOAD_FAILED', 500);
  }

  return { files };
}
