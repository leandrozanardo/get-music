import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '@/src/domain/errors';
import { buildArtistTitleBase, sanitizeFilename } from '@/src/domain/filename';
import { parseSpotifyPlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import {
  buildYoutubeSearchQuery,
  resolveSpotifyPlaylist,
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

  const { name: playlistName, tracks } = await resolveSpotifyPlaylist(url);
  const zipBase = sanitizeFilename(playlistName) || 'spotify-playlist';
  const fileName = `${zipBase}.zip`;

  const downloadedFiles: string[] = [];

  for (const track of tracks) {
    const query = buildYoutubeSearchQuery(track);
    const fileBase = buildArtistTitleBase(track.artists, track.title);

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

  const zipPath = path.join(jobDir, fileName);
  await zipDirectory(mediaDir, zipPath);

  return {
    zipPath,
    fileName,
  };
}
