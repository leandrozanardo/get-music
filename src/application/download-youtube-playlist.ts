import fs from 'node:fs/promises';
import path from 'node:path';
import { sanitizeFilename } from '@/src/domain/filename';
import { parseYouTubePlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { downloadPlaylistMp3s, probePlaylistTitle } from '@/src/infra/yt-dlp';
import { zipDirectory } from '@/src/infra/zip';

export async function downloadYoutubePlaylist(
  url: string,
): Promise<{ zipPath: string; fileName: string }> {
  const { canonicalUrl } = parseYouTubePlaylistUrl(url);
  const jobDir = await createJobDir('yt-playlist');
  const mediaDir = path.join(jobDir, 'media');
  await fs.mkdir(mediaDir, { recursive: true });

  const playlistTitle = await probePlaylistTitle(canonicalUrl);
  const zipBase = sanitizeFilename(playlistTitle) || 'playlist';
  const fileName = `${zipBase}.zip`;

  await downloadPlaylistMp3s(canonicalUrl, mediaDir);

  const zipPath = path.join(jobDir, fileName);
  await zipDirectory(mediaDir, zipPath);

  return {
    zipPath,
    fileName,
  };
}
