# filenames-titulo-mp3 — Planejamento

> SDD: true. Sem commits sem auth humana.

**Goal:** Todos os MP3 baixados usam `Artista - Título.mp3` (sem `track`, sem índice, sem `(2)`).

**Status:** PRONTO

## Tarefas

### T1 — Domain filename (TDD)
- Create: `src/domain/filename.ts`, `src/domain/filename.test.ts`
- `sanitizeFilename`, `buildArtistTitleBase(artist, title)` → `Artist - Title`
- Empty artist → `Unknown Artist`

### T2 — yt-dlp naming
- Modify: `src/infra/yt-dlp.ts` (+ tests)
- Single/query: `fileBase` obrigatório ou probe metadata + `--windows-filenames`
- Playlist: `-o '%(artist,uploader,channel)s - %(title)s.%(ext)s'` sem índice; overwrite on collision

### T3 — Application Spotify/YouTube
- Spotify: `buildArtistTitleBase(artists, title)` as fileBase
- YouTube track: probe/print then download with artist-title base
- Update unit tests

### T4 — Evidence + gates
- `npm run test:run`
- `npm run evidence:youtube-track` + assert basename matches `/ - /` and ≠ `track.mp3`
- gate-check

## Mapa aceite → evidência

| AC | Tarefa | Evidência |
|----|--------|-----------|
| AC-01 YT faixa | T2–T4 | evidence + nome |
| AC-02 YT playlist | T2 | unit template + code |
| AC-03 Spotify | T3 | unit fileBase |
| AC-04 Content-Disposition | T3 | basename do filePath |
| AC-05 testes | T1–T3 | vitest |
