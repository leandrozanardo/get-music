import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const originalEnv = { ...process.env };

describe('spotify-metadata', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('buildYoutubeSearchQuery formats artist and title', async () => {
    const { buildYoutubeSearchQuery } = await import('@/src/infra/spotify-metadata');

    expect(
      buildYoutubeSearchQuery({ title: 'Song Title', artists: 'Artist Name' }),
    ).toBe('Artist Name - Song Title');
  });

  it('resolveSpotifyPlaylistTracks parses tracks from playlist HTML', async () => {
    const html = `
      <html>
        <script type="application/ld+json">
          {
            "@type": "MusicPlaylist",
            "track": [
              { "name": "Track One", "byArtist": { "name": "Artist A" } },
              { "name": "Track Two", "byArtist": { "name": "Artist B" } }
            ]
          }
        </script>
      </html>
    `;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => html,
      }),
    );

    const { resolveSpotifyPlaylistTracks } = await import('@/src/infra/spotify-metadata');
    const tracks = await resolveSpotifyPlaylistTracks(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    );

    expect(tracks).toEqual([
      { title: 'Track One', artists: 'Artist A' },
      { title: 'Track Two', artists: 'Artist B' },
    ]);
  });

  it('resolveSpotifyPlaylistTracks parses embed trackList JSON', async () => {
    const html = `{"trackList":[{"uri":"spotify:track:abc","title":"Embed Song","subtitle":"Embed Artist"}]}`;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => html,
      }),
    );

    const { resolveSpotifyPlaylistTracks } = await import('@/src/infra/spotify-metadata');
    const tracks = await resolveSpotifyPlaylistTracks(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    );

    expect(tracks).toEqual([{ title: 'Embed Song', artists: 'Embed Artist' }]);
  });

  it('resolveSpotifyPlaylistTracks throws SPOTIFY_METADATA when all strategies fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      }),
    );

    const { resolveSpotifyPlaylistTracks } = await import('@/src/infra/spotify-metadata');

    await expect(
      resolveSpotifyPlaylistTracks('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'),
    ).rejects.toMatchObject({
      code: 'SPOTIFY_METADATA',
    });
  });

  it('resolveSpotifyPlaylistTracks uses Spotify API when credentials are configured', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id';
    process.env.SPOTIFY_CLIENT_SECRET = 'client-secret';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', token_type: 'Bearer', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              track: {
                name: 'API Track',
                artists: [{ name: 'API Artist' }],
              },
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const { resolveSpotifyPlaylistTracks } = await import('@/src/infra/spotify-metadata');
    const tracks = await resolveSpotifyPlaylistTracks(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    );

    expect(tracks).toEqual([{ title: 'API Track', artists: 'API Artist' }]);
  });
});
