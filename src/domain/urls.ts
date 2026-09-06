import { AppError } from '@/src/domain/errors';

type ParsedUrl = {
  videoId: string;
  canonicalUrl: string;
};

type ParsedPlaylist = {
  playlistId: string;
  canonicalUrl: string;
};

function parseInputUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new AppError('URL is required', 'INVALID_URL');
  }

  try {
    return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    throw new AppError('Invalid URL format', 'INVALID_URL');
  }
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, '').toLowerCase();
}

function isYouTubeHost(host: string): boolean {
  return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
}

function assertYouTubeHost(url: URL): void {
  const host = normalizeHost(url.hostname);
  if (!isYouTubeHost(host)) {
    throw new AppError('URL must be a YouTube link', 'INVALID_URL');
  }
}

function assertSpotifyHost(url: URL): void {
  const host = normalizeHost(url.hostname);
  if (host !== 'open.spotify.com') {
    throw new AppError('URL must be a Spotify playlist link', 'INVALID_URL');
  }
}

export function parseYouTubeTrackUrl(input: string): ParsedUrl {
  const url = parseInputUrl(input);
  assertYouTubeHost(url);

  const host = normalizeHost(url.hostname);

  if (host === 'youtu.be') {
    const videoId = url.pathname.replace(/^\//, '').split('/')[0];
    if (!videoId) {
      throw new AppError('Missing YouTube video ID', 'INVALID_URL');
    }

    return {
      videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  const videoId = url.searchParams.get('v');
  if (!videoId) {
    throw new AppError('Missing YouTube video ID', 'INVALID_URL');
  }

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export function parseYouTubePlaylistUrl(input: string): ParsedPlaylist {
  const url = parseInputUrl(input);
  assertYouTubeHost(url);

  const playlistId = url.searchParams.get('list');
  if (!playlistId) {
    throw new AppError('Missing YouTube playlist ID', 'INVALID_URL');
  }

  return {
    playlistId,
    canonicalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
  };
}

export function parseSpotifyPlaylistUrl(input: string): ParsedPlaylist {
  const url = parseInputUrl(input);
  assertSpotifyHost(url);

  const match = url.pathname.match(/^\/playlist\/([a-zA-Z0-9]+)/);
  if (!match?.[1]) {
    throw new AppError('Missing Spotify playlist ID', 'INVALID_URL');
  }

  const playlistId = match[1];

  return {
    playlistId,
    canonicalUrl: `https://open.spotify.com/playlist/${playlistId}`,
  };
}
