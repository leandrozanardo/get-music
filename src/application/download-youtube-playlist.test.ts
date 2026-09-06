import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/src/domain/urls', () => ({
  parseYouTubePlaylistUrl: vi.fn(),
}));

vi.mock('@/src/infra/temp-dir', () => ({
  createJobDir: vi.fn(),
}));

vi.mock('@/src/infra/yt-dlp', () => ({
  downloadPlaylistMp3s: vi.fn(),
}));

vi.mock('@/src/infra/zip', () => ({
  zipDirectory: vi.fn(),
}));

import { parseYouTubePlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { downloadPlaylistMp3s } from '@/src/infra/yt-dlp';
import { zipDirectory } from '@/src/infra/zip';
import { downloadYoutubePlaylist } from '@/src/application/download-youtube-playlist';

describe('downloadYoutubePlaylist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads playlist tracks and zips them', async () => {
    vi.mocked(parseYouTubePlaylistUrl).mockReturnValue({
      playlistId: 'PLabc',
      canonicalUrl: 'https://www.youtube.com/playlist?list=PLabc',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/yt-playlist-job');
    vi.mocked(downloadPlaylistMp3s).mockResolvedValue({
      files: [
        path.join('/temp/yt-playlist-job', 'media', '001-a.mp3'),
        path.join('/temp/yt-playlist-job', 'media', '002-b.mp3'),
      ],
    });
    vi.mocked(zipDirectory).mockResolvedValue(undefined);

    const result = await downloadYoutubePlaylist('https://www.youtube.com/playlist?list=PLabc');
    const mediaDir = path.join('/temp/yt-playlist-job', 'media');

    expect(downloadPlaylistMp3s).toHaveBeenCalledWith(
      'https://www.youtube.com/playlist?list=PLabc',
      mediaDir,
    );
    expect(zipDirectory).toHaveBeenCalledWith(
      mediaDir,
      path.join('/temp/yt-playlist-job', 'playlist.zip'),
    );
    expect(result).toEqual({
      zipPath: path.join('/temp/yt-playlist-job', 'playlist.zip'),
      fileName: 'youtube-playlist.zip',
    });
  });
});
