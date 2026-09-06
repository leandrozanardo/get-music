import path from 'node:path';
import { resolveDownloadFileBase } from '@/src/domain/filename';
import { parseYouTubeTrackUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { downloadBestMp3, probeMediaArtistTitle } from '@/src/infra/yt-dlp';

export async function downloadYoutubeTrack(
  url: string,
): Promise<{ filePath: string; fileName: string }> {
  const { canonicalUrl } = parseYouTubeTrackUrl(url);
  const jobDir = await createJobDir('yt-track');
  const { artist, title } = await probeMediaArtistTitle(canonicalUrl);
  const fileBase = resolveDownloadFileBase(artist, title);
  const { filePath } = await downloadBestMp3(canonicalUrl, jobDir, fileBase);

  return {
    filePath,
    fileName: path.basename(filePath),
  };
}
