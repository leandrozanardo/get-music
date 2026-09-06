import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { zipDirectory } from '@/src/infra/zip';

describe('zipDirectory', () => {
  it('creates a zip archive containing directory files', async () => {
    const sourceDir = path.join(process.cwd(), 'temp', `zip-test-${Date.now()}`);
    const outZipPath = `${sourceDir}.zip`;

    fs.mkdirSync(sourceDir, { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'one.mp3'), 'first');
    fs.writeFileSync(path.join(sourceDir, 'two.mp3'), 'second');

    try {
      await zipDirectory(sourceDir, outZipPath);

      const stats = fs.statSync(outZipPath);
      expect(stats.size).toBeGreaterThan(0);
    } finally {
      fs.rmSync(sourceDir, { recursive: true, force: true });
      fs.rmSync(outZipPath, { force: true });
    }
  });
});
