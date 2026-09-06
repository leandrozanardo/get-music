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
  resolveSpotifyPlaylistTracks: vi.fn(),
}));

vi.mock('@/src/infra/yt-dlp', () => ({
  downloadBestMp3FromQuery: vi.fn(),
}));

vi.mock('@/src/infra/zip', () => ({
  zipDirectory: vi.fn(),
}));

import { parseSpotifyPlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { buildYoutubeSearchQuery, resolveSpotifyPlaylistTracks } from '@/src/infra/spotify-metadata';
import { downloadBestMp3FromQuery } from '@/src/infra/yt-dlp';
import { zipDirectory } from '@/src/infra/zip';
import { downloadSpotifyPlaylist } from '@/src/application/download-spotify-playlist';

describe('downloadSpotifyPlaylist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves tracks, downloads via yt search, and zips successful files', async () => {
    vi.mocked(parseSpotifyPlaylistUrl).mockReturnValue({
      playlistId: 'playlist123',
      canonicalUrl: 'https://open.spotify.com/playlist/playlist123',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/spotify-job');
    vi.mocked(resolveSpotifyPlaylistTracks).mockResolvedValue([
      { title: 'Song A', artists: 'Artist A' },
      { title: 'Song B', artists: 'Artist B' },
    ]);
    vi.mocked(buildYoutubeSearchQuery)
      .mockReturnValueOnce('Artist A - Song A')
      .mockReturnValueOnce('Artist B - Song B');
    vi.mocked(downloadBestMp3FromQuery)
      .mockResolvedValueOnce({
        filePath: path.join('/temp/spotify-job', 'media', '001-track.mp3'),
      })
      .mockRejectedValueOnce(new Error('download failed'));
    vi.mocked(zipDirectory).mockResolvedValue(undefined);

    const result = await downloadSpotifyPlaylist('https://open.spotify.com/playlist/playlist123');
    const mediaDir = path.join('/temp/spotify-job', 'media');

    expect(resolveSpotifyPlaylistTracks).toHaveBeenCalledWith(
      'https://open.spotify.com/playlist/playlist123',
    );
    expect(downloadBestMp3FromQuery).toHaveBeenCalledTimes(2);
    expect(zipDirectory).toHaveBeenCalledWith(
      mediaDir,
      path.join('/temp/spotify-job', 'playlist.zip'),
    );
    expect(result.fileName).toBe('spotify-playlist.zip');
  });

  it('throws EMPTY_PLAYLIST when every track download fails', async () => {
    vi.mocked(parseSpotifyPlaylistUrl).mockReturnValue({
      playlistId: 'playlist123',
      canonicalUrl: 'https://open.spotify.com/playlist/playlist123',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/spotify-job');
    vi.mocked(resolveSpotifyPlaylistTracks).mockResolvedValue([
      { title: 'Song A', artists: 'Artist A' },
    ]);
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
    vi.mocked(resolveSpotifyPlaylistTracks).mockRejectedValue(
      new AppError('metadata failed', 'SPOTIFY_METADATA', 502),
    );

    await expect(
      downloadSpotifyPlaylist('https://open.spotify.com/playlist/playlist123'),
    ).rejects.toMatchObject({ code: 'SPOTIFY_METADATA' });
  });
});
