import { ZipArchive } from 'archiver';
import fs from 'node:fs';
import path from 'node:path';

export function zipDirectory(sourceDir: string, outZipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outZipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    // Only pack audio files so the output zip itself is never re-included.
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const lower = entry.name.toLowerCase();
      if (!lower.endsWith('.mp3') && !lower.endsWith('.m4a') && !lower.endsWith('.opus')) {
        continue;
      }

      archive.file(path.join(sourceDir, entry.name), { name: entry.name });
    }

    void archive.finalize();
  });
}
