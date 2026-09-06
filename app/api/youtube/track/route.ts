import { stat } from 'node:fs/promises';
import { NextRequest } from 'next/server';
import { downloadYoutubeTrack } from '@/src/application/download-youtube-track';
import { errorResponse, fileDownloadResponse, requireUrl } from '@/app/api/_lib/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: unknown };
    const urlOrError = requireUrl(body);
    if (typeof urlOrError !== 'string') {
      return urlOrError;
    }

    const { filePath, fileName } = await downloadYoutubeTrack(urlOrError);
    const fileStat = await stat(filePath);
    return fileDownloadResponse(filePath, fileName, 'audio/mpeg', fileStat.size);
  } catch (error) {
    return errorResponse(error);
  }
}
