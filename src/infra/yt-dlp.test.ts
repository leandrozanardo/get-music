import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import {
  downloadBestMp3,
  downloadBestMp3FromQuery,
  downloadPlaylistMp3s,
  probeMediaArtistTitle,
  probePlaylistTitle,
} from '@/src/infra/yt-dlp';

const mockedSpawn = vi.mocked(spawn);

function mockSpawnSuccess(stdout = ''): void {
  mockedSpawn.mockImplementation(() => {
    const proc = new EventEmitter() as NodeJS.EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    queueMicrotask(() => {
      if (stdout) {
        proc.stdout.emit('data', Buffer.from(stdout));
      }
      proc.emit('close', 0);
    });
    return proc as ReturnType<typeof spawn>;
  });
}

function mockSpawnFailure(stderr: string): void {
  mockedSpawn.mockImplementation(() => {
    const proc = new EventEmitter() as NodeJS.EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    queueMicrotask(() => {
      proc.stderr.emit('data', Buffer.from(stderr));
      proc.emit('close', 1);
    });
    return proc as ReturnType<typeof spawn>;
  });
}

describe('yt-dlp', () => {
  let outDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-dlp-test-'));
  });

  afterEach(async () => {
    await fs.rm(outDir, { recursive: true, force: true });
  });

  it('downloadBestMp3 spawns yt-dlp with Artist - Title fileBase', async () => {
    mockSpawnSuccess();
    const fileBase = 'Jazzy - Giving Me';
    await fs.writeFile(path.join(outDir, `${fileBase}.mp3`), 'audio');

    await downloadBestMp3('https://www.youtube.com/watch?v=abc', outDir, fileBase);

    expect(mockedSpawn).toHaveBeenCalledWith(
      'yt-dlp',
      expect.arrayContaining([
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
        path.join(outDir, `${fileBase}.%(ext)s`),
        'https://www.youtube.com/watch?v=abc',
      ]),
      expect.objectContaining({ shell: false }),
    );
  });

  it('downloadBestMp3 returns mp3 file path on success', async () => {
    mockSpawnSuccess();
    const fileBase = 'Artist - Song';
    const expectedPath = path.join(outDir, `${fileBase}.mp3`);
    await fs.writeFile(expectedPath, 'audio');

    const result = await downloadBestMp3('https://www.youtube.com/watch?v=abc', outDir, fileBase);

    expect(result.filePath).toBe(expectedPath);
  });

  it('downloadBestMp3 throws NO_AUDIO when yt-dlp reports no audio', async () => {
    mockSpawnFailure('ERROR: No audio formats found');

    await expect(
      downloadBestMp3('https://www.youtube.com/watch?v=abc', outDir, 'A - B'),
    ).rejects.toMatchObject({ code: 'NO_AUDIO' });
  });

  it('downloadBestMp3FromQuery uses ytsearch1 prefix', async () => {
    mockSpawnSuccess();
    const fileBase = 'Artist - Title';
    await fs.writeFile(path.join(outDir, `${fileBase}.mp3`), 'audio');

    await downloadBestMp3FromQuery('Artist - Title', outDir, fileBase);

    expect(mockedSpawn).toHaveBeenCalledWith(
      'yt-dlp',
      expect.arrayContaining(['ytsearch1:Artist - Title']),
      expect.any(Object),
    );
  });

  it('downloadPlaylistMp3s uses title template without playlist_index', async () => {
    mockSpawnSuccess();
    await fs.writeFile(path.join(outDir, 'Artist - Song.mp3'), 'audio');

    await downloadPlaylistMp3s('https://www.youtube.com/playlist?list=PLabc', outDir);

    const args = mockedSpawn.mock.calls[0]?.[1] as string[];
    expect(args).not.toContain('--no-playlist');
    expect(args.some((a) => a.includes('playlist_index'))).toBe(false);
    expect(args).toContain('--windows-filenames');
    expect(args.some((a) => a.includes('%(title)s.%(ext)s'))).toBe(true);
  });

  it('probeMediaArtistTitle reads artist/uploader and title from JSON', async () => {
    mockSpawnSuccess(
      JSON.stringify({
        artist: 'Jazzy',
        uploader: 'ChannelX',
        channel: 'ChannelX',
        title: 'Giving Me',
      }),
    );

    const result = await probeMediaArtistTitle('https://www.youtube.com/watch?v=abc');

    expect(result).toEqual({ artist: 'Jazzy', title: 'Giving Me' });
  });

  it('probeMediaArtistTitle skips NA artist and uses uploader from JSON', async () => {
    mockSpawnSuccess(
      JSON.stringify({
        artist: 'NA',
        uploader: 'Zezé Channel',
        channel: 'Zezé Channel',
        title: 'Sem Medo De Ser Feliz',
      }),
    );

    const result = await probeMediaArtistTitle('https://www.youtube.com/watch?v=abc');

    expect(result).toEqual({ artist: 'Zezé Channel', title: 'Sem Medo De Ser Feliz' });
  });

  it('probeMediaArtistTitle preserves UTF-8 accents in title', async () => {
    mockSpawnSuccess(
      JSON.stringify({
        artist: null,
        uploader: 'Uploader',
        title: 'Zezé Di Camargo & Luciano - Sem Medo De Ser Feliz',
      }),
    );

    const result = await probeMediaArtistTitle('https://www.youtube.com/watch?v=abc');

    expect(result.title).toBe('Zezé Di Camargo & Luciano - Sem Medo De Ser Feliz');
    expect(result.title).toContain('é');
  });

  it('probePlaylistTitle reads playlist_title from JSON', async () => {
    mockSpawnSuccess(JSON.stringify({ playlist_title: 'House Music 2025', title: 'ignored' }));

    const title = await probePlaylistTitle('https://www.youtube.com/playlist?list=PLabc');

    expect(title).toBe('House Music 2025');
  });

  it('downloadPlaylistMp3s strips legacy 001- prefixes after download', async () => {
    mockSpawnSuccess();
    await fs.writeFile(path.join(outDir, '001-Jazzy - Giving Me.mp3'), 'audio');

    const { files } = await downloadPlaylistMp3s(
      'https://www.youtube.com/playlist?list=PLabc',
      outDir,
    );

    expect(files.some((f) => path.basename(f) === 'Jazzy - Giving Me.mp3')).toBe(true);
    expect(files.every((f) => !/^\d{3}-/.test(path.basename(f)))).toBe(true);
  });
});
