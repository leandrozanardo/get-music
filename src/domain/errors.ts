export class AppError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_URL'
      | 'NO_AUDIO'
      | 'DOWNLOAD_FAILED'
      | 'SPOTIFY_METADATA'
      | 'EMPTY_PLAYLIST'
      | 'INTERNAL',
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
