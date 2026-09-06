import { AppError } from '@/src/domain/errors';
import { parseSpotifyPlaylistUrl } from '@/src/domain/urls';

export type SpotifyTrack = {
  title: string;
  artists: string;
};

type JsonLdTrack = {
  name?: string;
  byArtist?: { name?: string };
};

type JsonLdPlaylist = {
  track?: JsonLdTrack[];
};

type SpotifyApiArtist = {
  name?: string;
};

type SpotifyApiTrackItem = {
  track?: {
    name?: string;
    artists?: SpotifyApiArtist[];
  } | null;
};

type SpotifyApiTracksResponse = {
  items?: SpotifyApiTrackItem[];
  next?: string | null;
};

type SpotifyTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

export function buildYoutubeSearchQuery(track: SpotifyTrack): string {
  return `${track.artists} - ${track.title}`;
}

function uniqueTracks(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Set<string>();
  const unique: SpotifyTrack[] = [];

  for (const track of tracks) {
    const key = `${track.artists.toLowerCase()}::${track.title.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(track);
  }

  return unique;
}

function parseJsonLdTracks(html: string): SpotifyTrack[] {
  const scriptMatches = html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scriptMatches) {
    const rawJson = match[1]?.trim();
    if (!rawJson) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawJson) as JsonLdPlaylist | JsonLdPlaylist[];
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        const tracks = candidate.track ?? [];
        const mapped = tracks
          .map((track) => ({
            title: track.name?.trim() ?? '',
            artists: track.byArtist?.name?.trim() ?? '',
          }))
          .filter((track) => track.title.length > 0 && track.artists.length > 0);

        if (mapped.length > 0) {
          return mapped;
        }
      }
    } catch {
      // Ignore malformed JSON blocks and continue scanning.
    }
  }

  return [];
}

function parseNextDataTracks(html: string): SpotifyTrack[] {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match?.[1]) {
    return [];
  }

  try {
    const nextData = JSON.parse(match[1]) as {
      props?: {
        pageProps?: {
          state?: {
            data?: {
              entity?: {
                trackList?: {
                  items?: Array<{
                    title?: string;
                    subtitle?: string;
                  }>;
                };
              };
            };
          };
        };
      };
    };

    const items = nextData.props?.pageProps?.state?.data?.entity?.trackList?.items ?? [];
    return items
      .map((item) => ({
        title: item.title?.trim() ?? '',
        artists: item.subtitle?.trim() ?? '',
      }))
      .filter((track) => track.title.length > 0 && track.artists.length > 0);
  } catch {
    return [];
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseAriaLabelTracks(html: string): SpotifyTrack[] {
  const matches = html.matchAll(/aria-label="([^"]+)"[^>]*data-testid="track-row"/gi);
  const tracks: SpotifyTrack[] = [];

  for (const match of matches) {
    const label = decodeHtmlEntities(match[1] ?? '').trim();
    if (!label) {
      continue;
    }

    // aria-label is often "Title - Artist" but sometimes title-only.
    const separator = label.lastIndexOf(' - ');
    if (separator > 0) {
      tracks.push({
        title: label.slice(0, separator).trim(),
        artists: label.slice(separator + 3).trim(),
      });
    } else {
      tracks.push({ title: label, artists: 'Unknown Artist' });
    }
  }

  return tracks.filter((track) => track.title.length > 0);
}

type EmbedTrack = {
  title?: string;
  subtitle?: string;
  uri?: string;
};

function parseEmbedTrackList(html: string): SpotifyTrack[] {
  const marker = '"trackList":[';
  const start = html.indexOf(marker);
  if (start < 0) {
    return [];
  }

  const arrayStart = start + '"trackList":'.length;
  let depth = 0;
  let end = -1;

  for (let i = arrayStart; i < html.length; i += 1) {
    const char = html[i];
    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end < 0) {
    return [];
  }

  try {
    const trackList = JSON.parse(html.slice(arrayStart, end)) as EmbedTrack[];
    return trackList
      .map((track) => ({
        title: track.title?.trim() ?? '',
        artists: track.subtitle?.replace(/\u00a0/g, ' ').trim() ?? '',
      }))
      .filter((track) => track.title.length > 0)
      .map((track) => ({
        title: track.title,
        artists: track.artists.length > 0 ? track.artists : 'Unknown Artist',
      }));
  } catch {
    return [];
  }
}

function parseTracksFromHtml(html: string): SpotifyTrack[] {
  const embedTracks = parseEmbedTrackList(html);
  if (embedTracks.length > 0) {
    return embedTracks;
  }

  const ariaTracks = parseAriaLabelTracks(html);
  if (ariaTracks.length > 0) {
    return ariaTracks;
  }

  const jsonLdTracks = parseJsonLdTracks(html);
  if (jsonLdTracks.length > 0) {
    return jsonLdTracks;
  }

  return parseNextDataTracks(html);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'get-music/0.1 (+https://localhost)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

function parsePlaylistNameFromHtml(html: string): string | null {
  const ldMatches = html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of ldMatches) {
    const rawJson = match[1]?.trim();
    if (!rawJson) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawJson) as { name?: string } | Array<{ name?: string }>;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        const name = candidate.name?.trim();
        if (name && name.length > 0) {
          return name;
        }
      }
    } catch {
      // continue
    }
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    const cleaned = titleMatch[1]
      .replace(/\s*\|?\s*Spotify\s*$/i, '')
      .replace(/\s*-\s*playlist\s+by\s+.+$/i, '')
      .trim();
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return null;
}

async function resolveFromPublicPages(
  playlistId: string,
): Promise<{ name: string | null; tracks: SpotifyTrack[] }> {
  const urls = [
    `https://open.spotify.com/embed/playlist/${playlistId}`,
    `https://open.spotify.com/playlist/${playlistId}`,
  ];

  for (const url of urls) {
    const html = await fetchText(url);
    if (!html) {
      continue;
    }

    const tracks = parseTracksFromHtml(html);
    const name = parsePlaylistNameFromHtml(html);
    if (tracks.length > 0) {
      return { name, tracks: uniqueTracks(tracks) };
    }
  }

  return { name: null, tracks: [] };
}

async function fetchSpotifyAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new AppError('Failed to authenticate with Spotify API', 'SPOTIFY_METADATA', 502);
  }

  const payload = (await response.json()) as SpotifyTokenResponse;
  if (!payload.access_token) {
    throw new AppError('Spotify API token response was invalid', 'SPOTIFY_METADATA', 502);
  }

  return payload.access_token;
}

async function resolveFromSpotifyApi(
  playlistId: string,
): Promise<{ name: string | null; tracks: SpotifyTrack[] }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { name: null, tracks: [] };
  }

  const accessToken = await fetchSpotifyAccessToken(clientId, clientSecret);

  let playlistName: string | null = null;
  const metaResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (metaResponse.ok) {
    const meta = (await metaResponse.json()) as { name?: string };
    playlistName = meta.name?.trim() || null;
  }

  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError('Failed to fetch playlist tracks from Spotify API', 'SPOTIFY_METADATA', 502);
    }

    const payload = (await response.json()) as SpotifyApiTracksResponse;
    for (const item of payload.items ?? []) {
      const track = item.track;
      if (!track?.name) {
        continue;
      }

      const artistNames = (track.artists ?? [])
        .map((artist) => artist.name?.trim())
        .filter((name): name is string => Boolean(name));

      if (artistNames.length === 0) {
        continue;
      }

      tracks.push({
        title: track.name.trim(),
        artists: artistNames.join(', '),
      });
    }

    nextUrl = payload.next ?? null;
  }

  return { name: playlistName, tracks: uniqueTracks(tracks) };
}

export async function resolveSpotifyPlaylist(
  playlistUrl: string,
): Promise<{ name: string; tracks: SpotifyTrack[] }> {
  const { playlistId } = parseSpotifyPlaylistUrl(playlistUrl);

  const publicResult = await resolveFromPublicPages(playlistId);
  if (publicResult.tracks.length > 0) {
    return {
      name: publicResult.name?.trim() || 'spotify-playlist',
      tracks: publicResult.tracks,
    };
  }

  const apiResult = await resolveFromSpotifyApi(playlistId);
  if (apiResult.tracks.length > 0) {
    return {
      name: apiResult.name?.trim() || 'spotify-playlist',
      tracks: apiResult.tracks,
    };
  }

  throw new AppError(
    'Unable to resolve Spotify playlist tracks. Configure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local or use a public playlist.',
    'SPOTIFY_METADATA',
    502,
  );
}

export async function resolveSpotifyPlaylistTracks(playlistUrl: string): Promise<SpotifyTrack[]> {
  const { tracks } = await resolveSpotifyPlaylist(playlistUrl);
  return tracks;
}
