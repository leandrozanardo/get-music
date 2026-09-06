import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '@/src/domain/errors';
import { parseSpotifyPlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import {
  buildYoutubeSearchQuery,
  resolveSpotifyPlaylistTracks,
} from '@/src/infra/spotify-metadata';
import { downloadBestMp3FromQuery } from '@/src/infra/yt-dlp';
import { zipDirectory } from '@/src/infra/zip';

export async function downloadSpotifyPlaylist(
  url: string,
): Promise<{ zipPath: string; fileName: string }> {
  parseSpotifyPlaylistUrl(url);
  const jobDir = await createJobDir('spotify-playlist');
  const mediaDir = path.join(jobDir, 'media');
  await fs.mkdir(mediaDir, { recursive: true });
  const tracks = await resolveSpotifyPlaylistTracks(url);

  const downloadedFiles: string[] = [];

  for (let index = 0; index < tracks.length; index += 1) {
    const track = tracks[index];
    const query = buildYoutubeSearchQuery(track);
    const fileBase = `${String(index + 1).padStart(3, '0')}-track`;

    try {
      const { filePath } = await downloadBestMp3FromQuery(query, mediaDir, fileBase);
      downloadedFiles.push(filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Skipping track "${track.title}" by "${track.artists}": ${message}`);
    }
  }

  if (downloadedFiles.length === 0) {
    throw new AppError('No tracks could be downloaded from this Spotify playlist', 'EMPTY_PLAYLIST', 404);
  }

  const zipPath = path.join(jobDir, 'playlist.zip');
  await zipDirectory(mediaDir, zipPath);

  return {
    zipPath,
    fileName: 'spotify-playlist.zip',
  };
}
