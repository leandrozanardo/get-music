import { stat } from 'node:fs/promises';
import { NextRequest } from 'next/server';
import { downloadYoutubePlaylist } from '@/src/application/download-youtube-playlist';
import { errorResponse, fileDownloadResponse, requireUrl } from '@/app/api/_lib/http';

export const runtime = 'nodejs';
export const maxDuration = 3600;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: unknown };
    const urlOrError = requireUrl(body);
    if (typeof urlOrError !== 'string') {
      return urlOrError;
    }

    const { zipPath, fileName } = await downloadYoutubePlaylist(urlOrError);
    const fileStat = await stat(zipPath);
    return fileDownloadResponse(zipPath, fileName, 'application/zip', fileStat.size);
  } catch (error) {
    return errorResponse(error);
  }
}
