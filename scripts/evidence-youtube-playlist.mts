import fs from 'node:fs/promises';
import { downloadYoutubePlaylist } from '../src/application/download-youtube-playlist';

const URL = 'https://www.youtube.com/playlist?list=PLaLWNpJCbH_qDIrJ7aI1PsbPKIxDoHQ-b';

async function main(): Promise<void> {
  console.log('[evidence] youtube-playlist start', URL);
  const { zipPath, fileName } = await downloadYoutubePlaylist(URL);
  const stats = await fs.stat(zipPath);

  if (!fileName.toLowerCase().endsWith('.zip') || stats.size <= 0) {
    throw new Error(`Invalid zip result: ${fileName}`);
  }

  if (/^\d{3}-/.test(fileName) || fileName === 'youtube-playlist.zip') {
    throw new Error(`Zip must be named after the playlist, got ${fileName}`);
  }

  console.log('[evidence] zip', zipPath);
  console.log('[evidence] fileName', fileName);
  console.log('[evidence] size', stats.size);
  console.log('EVIDENCE_OK');
}

main().catch((error: unknown) => {
  console.error('[evidence] FAILED', error);
  process.exit(1);
});
