import { describe, expect, it } from 'vitest';
import { buildArtistTitleBase, resolveDownloadFileBase, sanitizeFilename } from '@/src/domain/filename';

describe('sanitizeFilename', () => {
  it('strips Windows-illegal characters and collapses whitespace', () => {
    expect(sanitizeFilename('  Foo<>:"/\\|?*Bar  ')).toBe('FooBar');
    expect(sanitizeFilename('A   B')).toBe('A B');
  });

  it('returns untitled for empty input', () => {
    expect(sanitizeFilename('')).toBe('untitled');
    expect(sanitizeFilename('   ')).toBe('untitled');
  });
});

describe('buildArtistTitleBase', () => {
  it('formats Artist - Title', () => {
    expect(buildArtistTitleBase('Jazzy', 'Giving Me')).toBe('Jazzy - Giving Me');
  });

  it('uses Unknown Artist / Unknown Title when missing', () => {
    expect(buildArtistTitleBase(null, 'Only Title')).toBe('Unknown Artist - Only Title');
    expect(buildArtistTitleBase('Only Artist', undefined)).toBe('Only Artist - Unknown Title');
  });

  it('sanitizes both sides', () => {
    expect(buildArtistTitleBase('A/B', 'C:D')).toBe('AB - CD');
  });
});

describe('resolveDownloadFileBase', () => {
  it('uses title as-is when it already contains Artist - Song', () => {
    expect(
      resolveDownloadFileBase('Uploader', 'Zezé Di Camargo & Luciano - Sem Medo De Ser Feliz'),
    ).toBe('Zezé Di Camargo & Luciano - Sem Medo De Ser Feliz');
  });

  it('composes Artist - Title when title has no separator', () => {
    expect(resolveDownloadFileBase('Dom Dolla', 'Take It')).toBe('Dom Dolla - Take It');
  });
});
