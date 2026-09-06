import fs from 'node:fs/promises';
import { downloadYoutubeTrack } from '../src/application/download-youtube-track';

const URL = 'https://www.youtube.com/watch?v=O7jQJuruHoc';

async function main(): Promise<void> {
  console.log('[evidence] youtube-track start', URL);
  const { filePath, fileName } = await downloadYoutubeTrack(URL);
  const stats = await fs.stat(filePath);

  if (!fileName.toLowerCase().endsWith('.mp3')) {
    throw new Error(`Expected mp3 file, got ${fileName}`);
  }

  if (stats.size <= 0) {
    throw new Error(`Empty file: ${filePath}`);
  }

  console.log('[evidence] file', filePath);
  console.log('[evidence] size', stats.size);
  console.log('EVIDENCE_OK');
}

main().catch((error: unknown) => {
  console.error('[evidence] FAILED', error);
  process.exit(1);
});
