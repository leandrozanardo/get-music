import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/src/domain/errors';

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/src/domain/urls', () => ({
  parseSpotifyPlaylistUrl: vi.fn(),
}));

vi.mock('@/src/infra/temp-dir', () => ({
  createJobDir: vi.fn(),
}));

vi.mock('@/src/infra/spotify-metadata', () => ({
  buildYoutubeSearchQuery: vi.fn(),
  resolveSpotifyPlaylist: vi.fn(),
}));

vi.mock('@/src/infra/yt-dlp', () => ({
  downloadBestMp3FromQuery: vi.fn(),
}));

vi.mock('@/src/infra/zip', () => ({
  zipDirectory: vi.fn(),
}));

import { parseSpotifyPlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { buildYoutubeSearchQuery, resolveSpotifyPlaylist } from '@/src/infra/spotify-metadata';
import { downloadBestMp3FromQuery } from '@/src/infra/yt-dlp';
import { zipDirectory } from '@/src/infra/zip';
import { downloadSpotifyPlaylist } from '@/src/application/download-spotify-playlist';

describe('downloadSpotifyPlaylist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('names zip after playlist and tracks as Artist - Title', async () => {
    vi.mocked(parseSpotifyPlaylistUrl).mockReturnValue({
      playlistId: 'playlist123',
      canonicalUrl: 'https://open.spotify.com/playlist/playlist123',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/spotify-job');
    vi.mocked(resolveSpotifyPlaylist).mockResolvedValue({
      name: 'House',
      tracks: [
        { title: 'Song A', artists: 'Artist A' },
        { title: 'Song B', artists: 'Artist B' },
      ],
    });
    vi.mocked(buildYoutubeSearchQuery)
      .mockReturnValueOnce('Artist A - Song A')
      .mockReturnValueOnce('Artist B - Song B');
    vi.mocked(downloadBestMp3FromQuery)
      .mockResolvedValueOnce({
        filePath: path.join('/temp/spotify-job', 'media', 'Artist A - Song A.mp3'),
      })
      .mockRejectedValueOnce(new Error('download failed'));
    vi.mocked(zipDirectory).mockResolvedValue(undefined);

    const result = await downloadSpotifyPlaylist('https://open.spotify.com/playlist/playlist123');
    const mediaDir = path.join('/temp/spotify-job', 'media');

    expect(downloadBestMp3FromQuery).toHaveBeenCalledWith(
      'Artist A - Song A',
      mediaDir,
      'Artist A - Song A',
    );
    expect(zipDirectory).toHaveBeenCalledWith(
      mediaDir,
      path.join('/temp/spotify-job', 'House.zip'),
    );
    expect(result.fileName).toBe('House.zip');
  });

  it('throws EMPTY_PLAYLIST when every track download fails', async () => {
    vi.mocked(parseSpotifyPlaylistUrl).mockReturnValue({
      playlistId: 'playlist123',
      canonicalUrl: 'https://open.spotify.com/playlist/playlist123',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/spotify-job');
    vi.mocked(resolveSpotifyPlaylist).mockResolvedValue({
      name: 'House',
      tracks: [{ title: 'Song A', artists: 'Artist A' }],
    });
    vi.mocked(buildYoutubeSearchQuery).mockReturnValue('Artist A - Song A');
    vi.mocked(downloadBestMp3FromQuery).mockRejectedValue(new Error('download failed'));

    await expect(
      downloadSpotifyPlaylist('https://open.spotify.com/playlist/playlist123'),
    ).rejects.toMatchObject({ code: 'EMPTY_PLAYLIST' });
  });

  it('propagates SPOTIFY_METADATA errors', async () => {
    vi.mocked(parseSpotifyPlaylistUrl).mockReturnValue({
      playlistId: 'playlist123',
      canonicalUrl: 'https://open.spotify.com/playlist/playlist123',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/spotify-job');
    vi.mocked(resolveSpotifyPlaylist).mockRejectedValue(
      new AppError('metadata failed', 'SPOTIFY_METADATA', 502),
    );

    await expect(
      downloadSpotifyPlaylist('https://open.spotify.com/playlist/playlist123'),
    ).rejects.toMatchObject({ code: 'SPOTIFY_METADATA' });
  });
});
