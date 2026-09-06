import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/src/domain/errors';

vi.mock('@/src/domain/urls', () => ({
  parseYouTubeTrackUrl: vi.fn(),
}));

vi.mock('@/src/infra/temp-dir', () => ({
  createJobDir: vi.fn(),
}));

vi.mock('@/src/infra/yt-dlp', () => ({
  downloadBestMp3: vi.fn(),
  probeMediaArtistTitle: vi.fn(),
}));

import { parseYouTubeTrackUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { downloadBestMp3, probeMediaArtistTitle } from '@/src/infra/yt-dlp';
import { downloadYoutubeTrack } from '@/src/application/download-youtube-track';

describe('downloadYoutubeTrack', () => {
  it('probes metadata and downloads as Artist - Title', async () => {
    vi.mocked(parseYouTubeTrackUrl).mockReturnValue({
      videoId: 'abc123',
      canonicalUrl: 'https://www.youtube.com/watch?v=abc123',
    });
    vi.mocked(createJobDir).mockResolvedValue('/temp/yt-track-job');
    vi.mocked(probeMediaArtistTitle).mockResolvedValue({
      artist: 'Some Uploader',
      title: 'Jazzy - Giving Me',
    });
    vi.mocked(downloadBestMp3).mockResolvedValue({
      filePath: '/temp/yt-track-job/Jazzy - Giving Me.mp3',
    });

    const result = await downloadYoutubeTrack('https://www.youtube.com/watch?v=abc123');

    expect(probeMediaArtistTitle).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc123');
    expect(downloadBestMp3).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=abc123',
      '/temp/yt-track-job',
      'Jazzy - Giving Me',
    );
    expect(result).toEqual({
      filePath: '/temp/yt-track-job/Jazzy - Giving Me.mp3',
      fileName: 'Jazzy - Giving Me.mp3',
    });
  });

  it('propagates AppError from URL validation', async () => {
    vi.mocked(parseYouTubeTrackUrl).mockImplementation(() => {
      throw new AppError('Invalid URL', 'INVALID_URL');
    });

    await expect(downloadYoutubeTrack('bad-url')).rejects.toMatchObject({ code: 'INVALID_URL' });
  });
});
