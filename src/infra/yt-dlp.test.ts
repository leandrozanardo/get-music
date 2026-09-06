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
} from '@/src/infra/yt-dlp';

const mockedSpawn = vi.mocked(spawn);

function mockSpawnSuccess(): void {
  mockedSpawn.mockImplementation(() => {
    const proc = new EventEmitter() as NodeJS.EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    queueMicrotask(() => proc.emit('close', 0));
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

  it('downloadBestMp3 spawns yt-dlp with expected audio args', async () => {
    mockSpawnSuccess();
    await fs.writeFile(path.join(outDir, 'track.mp3'), 'audio');

    await downloadBestMp3('https://www.youtube.com/watch?v=abc', outDir, 'track');

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
        '--no-playlist',
        '-o',
        path.join(outDir, 'track.%(ext)s'),
        'https://www.youtube.com/watch?v=abc',
      ]),
      expect.objectContaining({ shell: false }),
    );
  });

  it('downloadBestMp3 returns mp3 file path on success', async () => {
    mockSpawnSuccess();
    const expectedPath = path.join(outDir, 'track.mp3');
    await fs.writeFile(expectedPath, 'audio');

    const result = await downloadBestMp3('https://www.youtube.com/watch?v=abc', outDir, 'track');

    expect(result.filePath).toBe(expectedPath);
  });

  it('downloadBestMp3 throws NO_AUDIO when yt-dlp reports no audio', async () => {
    mockSpawnFailure('ERROR: No audio formats found');

    await expect(
      downloadBestMp3('https://www.youtube.com/watch?v=abc', outDir),
    ).rejects.toMatchObject({ code: 'NO_AUDIO' });
  });

  it('downloadBestMp3FromQuery uses ytsearch1 prefix', async () => {
    mockSpawnSuccess();
    await fs.writeFile(path.join(outDir, 'search.mp3'), 'audio');

    await downloadBestMp3FromQuery('Artist - Title', outDir, 'search');

    expect(mockedSpawn).toHaveBeenCalledWith(
      'yt-dlp',
      expect.arrayContaining(['ytsearch1:Artist - Title']),
      expect.any(Object),
    );
  });

  it('downloadPlaylistMp3s omits --no-playlist flag', async () => {
    mockSpawnSuccess();
    await fs.writeFile(path.join(outDir, '001-track.mp3'), 'audio');

    await downloadPlaylistMp3s('https://www.youtube.com/playlist?list=PLabc', outDir);

    const args = mockedSpawn.mock.calls[0]?.[1] as string[];
    expect(args).not.toContain('--no-playlist');
    expect(args).toContain('--audio-format');
    expect(args).toContain('mp3');
  });
});
