import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '@/src/domain/errors';
import { buildArtistTitleBase } from '@/src/domain/filename';

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
    const child = spawn('yt-dlp', args, {
      windowsHide: true,
      shell: false,
      // Force UTF-8 so accented titles (é, ã, etc.) are not mangled on Windows.
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8'));
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8'));
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
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

async function resolveDownloadedMp3(outDir: string, fileBase: string): Promise<string> {
  const mp3Files = await collectMp3Files(outDir);

  if (mp3Files.length === 0) {
    throw new AppError('Download completed but no MP3 file was found', 'DOWNLOAD_FAILED', 500);
  }

  const exact = path.join(outDir, `${fileBase}.mp3`);
  if (mp3Files.includes(exact)) {
    return exact;
  }

  const matching = mp3Files.filter((filePath) =>
    path.basename(filePath).toLowerCase().startsWith(fileBase.toLowerCase()),
  );
  if (matching.length > 0) {
    return matching[0];
  }

  return mp3Files[0];
}

function isMissingMeta(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === 'na' ||
    normalized === 'n/a' ||
    normalized === 'null' ||
    normalized === 'none' ||
    normalized === 'unknown'
  );
}

type YtDlpJsonMeta = {
  artist?: string | null;
  creator?: string | null;
  uploader?: string | null;
  channel?: string | null;
  track?: string | null;
  title?: string | null;
  fulltitle?: string | null;
};

function pickMetaField(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && !isMissingMeta(value)) {
      return value.trim();
    }
  }
  return undefined;
}

export async function probeMediaArtistTitle(
  url: string,
): Promise<{ artist: string; title: string }> {
  // JSON dump is UTF-8 and avoids Windows console code-page corruption on -O text.
  const args = ['--skip-download', '--no-playlist', '-j', url];

  const result = await runYtDlp(args);
  if (result.exitCode !== 0) {
    throw mapYtDlpFailure(result.stderr, result.stdout);
  }

  let meta: YtDlpJsonMeta;
  try {
    meta = JSON.parse(result.stdout) as YtDlpJsonMeta;
  } catch {
    throw new AppError('Failed to parse media metadata JSON from yt-dlp', 'DOWNLOAD_FAILED', 500);
  }

  const artist =
    pickMetaField(meta.artist, meta.creator, meta.uploader, meta.channel) ?? 'Unknown Artist';
  const title = pickMetaField(meta.track, meta.title, meta.fulltitle) ?? 'Unknown Title';

  return { artist, title };
}

export async function downloadBestMp3(
  url: string,
  outDir: string,
  fileBase: string,
): Promise<{ filePath: string }> {
  if (!fileBase.trim()) {
    throw new AppError('fileBase is required for downloads', 'INTERNAL', 500);
  }

  const outputTemplate = path.join(outDir, `${fileBase}.%(ext)s`);
  const args = [
    '-f',
    'bestaudio/best',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
    '--windows-filenames',
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
  fileBase: string,
): Promise<{ filePath: string }> {
  return downloadBestMp3(`ytsearch1:${query}`, outDir, fileBase);
}

export async function downloadPlaylistMp3s(
  playlistUrl: string,
  outDir: string,
): Promise<{ files: string[] }> {
  // Track title only — never playlist_index. Same name overwrites (lote decision).
  const outputTemplate = path.join(outDir, '%(title)s.%(ext)s');
  const args = [
    '-f',
    'bestaudio/best',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
    '--windows-filenames',
    '-o',
    outputTemplate,
    // Prevent any archive/config default that reintroduces numbering.
    '--output-na-placeholder',
    '',
    playlistUrl,
  ];

  const result = await runYtDlp(args);
  if (result.exitCode !== 0) {
    throw mapYtDlpFailure(result.stderr, result.stdout);
  }

  await stripLegacyPlaylistIndexPrefixes(outDir);

  const files = await collectMp3Files(outDir);
  if (files.length === 0) {
    throw new AppError('Playlist download completed but no MP3 files were found', 'DOWNLOAD_FAILED', 500);
  }

  return { files };
}

/** Removes leftover `001-` prefixes from older downloads / misconfigured templates. */
async function stripLegacyPlaylistIndexPrefixes(outDir: string): Promise<void> {
  const entries = await fs.readdir(outDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.mp3')) {
      continue;
    }

    const match = entry.name.match(/^(\d{3})-(.+\.mp3)$/i);
    if (!match) {
      continue;
    }

    const targetName = match[2];
    const fromPath = path.join(outDir, entry.name);
    const toPath = path.join(outDir, targetName);
    try {
      await fs.rename(fromPath, toPath);
    } catch {
      // If target exists, drop the numbered duplicate (overwrite policy).
      await fs.unlink(fromPath).catch(() => undefined);
    }
  }
}

export async function probePlaylistTitle(playlistUrl: string): Promise<string> {
  const args = [
    '--skip-download',
    '--flat-playlist',
    '--playlist-items',
    '1',
    '-j',
    playlistUrl,
  ];

  const result = await runYtDlp(args);
  if (result.exitCode !== 0) {
    throw mapYtDlpFailure(result.stderr, result.stdout);
  }

  try {
    const meta = JSON.parse(result.stdout) as {
      playlist_title?: string | null;
      playlist?: string | null;
    };
    const title = pickMetaField(meta.playlist_title, meta.playlist);
    return title ?? 'playlist';
  } catch {
    return 'playlist';
  }
}

export function fileBaseFromProbe(artist: string, title: string): string {
  return buildArtistTitleBase(artist, title);
}
