import fs from 'node:fs/promises';
import { downloadSpotifyPlaylist } from '../src/application/download-spotify-playlist';

const URL = 'https://open.spotify.com/playlist/1CFy5g653j16Zq1I02UoKI?si=e3218d081ce8406a';

async function main(): Promise<void> {
  console.log('[evidence] spotify-playlist start', URL);
  const { zipPath, fileName } = await downloadSpotifyPlaylist(URL);
  const stats = await fs.stat(zipPath);

  if (!fileName.toLowerCase().endsWith('.zip')) {
    throw new Error(`Expected zip file, got ${fileName}`);
  }

  if (stats.size <= 0) {
    throw new Error(`Empty zip: ${zipPath}`);
  }

  console.log('[evidence] zip', zipPath);
  console.log('[evidence] size', stats.size);
  console.log('EVIDENCE_OK');
}

main().catch((error: unknown) => {
  console.error('[evidence] FAILED', error);
  process.exit(1);
});
