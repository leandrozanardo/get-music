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

  if (fileName.toLowerCase() === 'track.mp3') {
    throw new Error('Filename must be Artist - Title, not track.mp3');
  }

  if (!fileName.includes(' - ')) {
    throw new Error(`Expected Artist - Title pattern, got ${fileName}`);
  }

  if (fileName.includes('\uFFFD') || /Zez\uFFFD/i.test(fileName)) {
    throw new Error(`Filename has encoding corruption: ${fileName}`);
  }

  if (stats.size <= 0) {
    throw new Error(`Empty file: ${filePath}`);
  }

  console.log('[evidence] file', filePath);
  console.log('[evidence] fileName', fileName);
  console.log('[evidence] size', stats.size);
  console.log('EVIDENCE_OK');
}

main().catch((error: unknown) => {
  console.error('[evidence] FAILED', error);
  process.exit(1);
});
