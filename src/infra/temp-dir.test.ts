import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createJobDir, ensureTempRoot, ROOT } from '@/src/infra/temp-dir';

describe('temp-dir', () => {
  const createdDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      createdDirs.splice(0).map(async (dir) => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      }),
    );
  });

  it('creates temp root under cwd/temp', () => {
    ensureTempRoot();
    expect(fs.existsSync(ROOT)).toBe(true);
  });

  it('creates unique job directories with prefix', async () => {
    const first = await createJobDir('test-job');
    const second = await createJobDir('test-job');
    createdDirs.push(first, second);

    expect(first).not.toBe(second);
    expect(first.startsWith(ROOT)).toBe(true);
    expect(path.basename(first).startsWith('test-job-')).toBe(true);
    expect(fs.existsSync(first)).toBe(true);
    expect(fs.existsSync(second)).toBe(true);
  });
});
