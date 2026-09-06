import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const ROOT = path.join(process.cwd(), 'temp');

export function ensureTempRoot(): void {
  if (!fs.existsSync(ROOT)) {
    fs.mkdirSync(ROOT, { recursive: true });
  }
}

export async function createJobDir(prefix: string): Promise<string> {
  ensureTempRoot();
  const jobDir = path.join(ROOT, `${prefix}-${randomUUID()}`);
  await fs.promises.mkdir(jobDir, { recursive: true });
  return jobDir;
}
