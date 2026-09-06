import { describe, expect, it } from 'vitest';
import { AppError } from '@/src/domain/errors';
import {
  parseSpotifyPlaylistUrl,
  parseYouTubePlaylistUrl,
  parseYouTubeTrackUrl,
} from '@/src/domain/urls';

describe('parseYouTubeTrackUrl', () => {
  it('parses youtube.com/watch?v= URLs', () => {
    const result = parseYouTubeTrackUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('parses youtu.be/ URLs', () => {
    const result = parseYouTubeTrackUrl('https://youtu.be/dQw4w9WgXcQ');

    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('rejects non-YouTube hosts', () => {
    expect(() => parseYouTubeTrackUrl('https://open.spotify.com/track/abc')).toThrow(AppError);
    expect(() => parseYouTubeTrackUrl('https://open.spotify.com/track/abc')).toThrow(
      expect.objectContaining({ code: 'INVALID_URL' }),
    );
  });

  it('rejects watch URLs without video id', () => {
    expect(() => parseYouTubeTrackUrl('https://www.youtube.com/watch')).toThrow(AppError);
  });
});

describe('parseYouTubePlaylistUrl', () => {
  it('parses playlist list= parameter', () => {
    const result = parseYouTubePlaylistUrl(
      'https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMH8k9H8k9H8k9H8k9',
    );

    expect(result.playlistId).toBe('PLrAXtmRdnEQy6nuLMH8k9H8k9H8k9H8k9');
    expect(result.canonicalUrl).toContain('list=PLrAXtmRdnEQy6nuLMH8k9H8k9H8k9H8k9');
  });

  it('parses watch URL with list parameter', () => {
    const result = parseYouTubePlaylistUrl(
      'https://www.youtube.com/watch?v=abc&list=PLtest123',
    );

    expect(result.playlistId).toBe('PLtest123');
  });

  it('rejects non-YouTube hosts', () => {
    expect(() => parseYouTubePlaylistUrl('https://example.com/playlist?list=abc')).toThrow(
      AppError,
    );
  });
});

describe('parseSpotifyPlaylistUrl', () => {
  it('parses open.spotify.com/playlist/ URLs', () => {
    const result = parseSpotifyPlaylistUrl(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    );

    expect(result).toEqual({
      playlistId: '37i9dQZF1DXcBWIGoYBM5M',
      canonicalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    });
  });

  it('rejects non-Spotify hosts', () => {
    expect(() =>
      parseSpotifyPlaylistUrl('https://www.youtube.com/playlist?list=abc'),
    ).toThrow(AppError);
  });

  it('rejects Spotify URLs without playlist id', () => {
    expect(() => parseSpotifyPlaylistUrl('https://open.spotify.com/user/me')).toThrow(AppError);
  });
});
