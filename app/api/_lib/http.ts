import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { AppError } from '@/src/domain/errors';

export function fileDownloadResponse(
  filePath: string,
  fileName: string,
  contentType: string,
  size: number,
): NextResponse {
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(size),
    },
  });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error('[api] unexpected error', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL' },
    { status: 500 },
  );
}

export function requireUrl(body: { url?: unknown }): string | NextResponse {
  if (typeof body.url !== 'string' || body.url.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing or invalid url', code: 'INVALID_URL' },
      { status: 400 },
    );
  }

  return body.url.trim();
}
