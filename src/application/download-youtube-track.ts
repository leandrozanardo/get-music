import path from 'node:path';
import { parseYouTubeTrackUrl } from '@/src/domain/urls';
import { createJobDir } from '@/src/infra/temp-dir';
import { downloadBestMp3 } from '@/src/infra/yt-dlp';

export async function downloadYoutubeTrack(
  url: string,
): Promise<{ filePath: string; fileName: string }> {
  const { canonicalUrl } = parseYouTubeTrackUrl(url);
  const jobDir = await createJobDir('yt-track');
  const { filePath } = await downloadBestMp3(canonicalUrl, jobDir, 'track');

  return {
    filePath,
    fileName: path.basename(filePath),
  };
}
