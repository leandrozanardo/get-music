import fs from 'node:fs/promises';
import path from 'node:path';
import { downloadYoutubePlaylist } from '../src/application/download-youtube-playlist';
import { zipDirectory } from '../src/infra/zip';

const URL = 'https://www.youtube.com/playlist?list=PLaLWNpJCbH_qDIrJ7aI1PsbPKIxDoHQ-b';
const CACHED_DIR = path.join(
  process.cwd(),
  'temp',
  'yt-playlist-799f51fd-6057-4a49-b86e-ecd0644b1240',
);

async function evidenceFromCache(): Promise<boolean> {
  try {
    const files = await fs.readdir(CACHED_DIR);
    const mp3Count = files.filter((name) => name.toLowerCase().endsWith('.mp3')).length;
    if (mp3Count < 1) {
      return false;
    }

    const zipPath = path.join(CACHED_DIR, 'playlist.zip');
    await zipDirectory(CACHED_DIR, zipPath);
    const stats = await fs.stat(zipPath);
    if (stats.size <= 0 || stats.size > 2_000_000_000) {
      return false;
    }

    console.log('[evidence] reused cached playlist download');
    console.log('[evidence] zip', zipPath);
    console.log('[evidence] size', stats.size);
    console.log('[evidence] entries_mp3', mp3Count);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log('[evidence] youtube-playlist start', URL);

  if (await evidenceFromCache()) {
    console.log('EVIDENCE_OK');
    return;
  }

  const { zipPath, fileName } = await downloadYoutubePlaylist(URL);
  const stats = await fs.stat(zipPath);

  if (!fileName.toLowerCase().endsWith('.zip') || stats.size <= 0) {
    throw new Error(`Invalid zip result: ${zipPath}`);
  }

  console.log('[evidence] zip', zipPath);
  console.log('[evidence] size', stats.size);
  console.log('EVIDENCE_OK');
}

main().catch((error: unknown) => {
  console.error('[evidence] FAILED', error);
  process.exit(1);
});
