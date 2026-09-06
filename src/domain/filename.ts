/**
 * Windows-safe filename helpers for downloaded audio.
 */

const INVALID_FS_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizeFilename(input: string): string {
  const cleaned = input
    .replace(INVALID_FS_CHARS, '')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim();

  return cleaned.length > 0 ? cleaned : 'untitled';
}

export function buildArtistTitleBase(
  artist: string | undefined | null,
  title: string | undefined | null,
): string {
  const safeArtist = sanitizeFilename((artist ?? '').trim() || 'Unknown Artist');
  const safeTitle = sanitizeFilename((title ?? '').trim() || 'Unknown Title');
  return `${safeArtist} - ${safeTitle}`;
}

/**
 * Prefer a YouTube title that already embeds "Artist - Song".
 * Otherwise compose Artist - Title from metadata fields.
 */
export function resolveDownloadFileBase(
  artist: string | undefined | null,
  title: string | undefined | null,
): string {
  const rawTitle = (title ?? '').trim();
  if (rawTitle.includes(' - ')) {
    return sanitizeFilename(rawTitle);
  }

  return buildArtistTitleBase(artist, title);
}
