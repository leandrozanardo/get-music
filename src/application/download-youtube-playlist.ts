import fs from 'node:fs/promises';
import path from 'node:path';
import { parseYouTubePlaylistUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { downloadPlaylistMp3s } from '@/src/infra/yt-dlp';
import { zipDirectory } from '@/src/infra/zip';

export async function downloadYoutubePlaylist(
  url: string,
): Promise<{ zipPath: string; fileName: string }> {
  const { canonicalUrl } = parseYouTubePlaylistUrl(url);
  const jobDir = await createJobDir('yt-playlist');
  const mediaDir = path.join(jobDir, 'media');
  await fs.mkdir(mediaDir, { recursive: true });
  await downloadPlaylistMp3s(canonicalUrl, mediaDir);

  const zipPath = path.join(jobDir, 'playlist.zip');
  await zipDirectory(mediaDir, zipPath);

  return {
    zipPath,
    fileName: 'youtube-playlist.zip',
  };
}
