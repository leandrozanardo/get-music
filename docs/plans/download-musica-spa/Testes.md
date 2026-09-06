# download-musica-spa — Testes

**Sem secrets.** Colar saídas reais desta sessão.

## Matriz

| ID | Cenário | Comando | Resultado | ✅/❌ |
|----|---------|---------|-----------|------|
| AC-01 | temp gitignored | node check temp/.gitignore | temp-ok | ✅ |
| AC-02 | YT track O7jQJuruHoc | npm run evidence:youtube-track | EVIDENCE_OK size 8546781 | ✅ |
| AC-03 | YT playlist ZIP 80 faixas | npm run evidence:youtube-playlist | EVIDENCE_OK size 482191979 entries_mp3 80 | ✅ |
| AC-04 | Spotify ZIP bridge YT | npm run evidence:spotify-playlist | EVIDENCE_OK size 571491649 (82 mp3) | ✅ |
| AC-05 | UI 3 abas dark club | node scripts/check-ui-tabs.mjs | ui-tabs-ok | ✅ |
| AC-06 | server before front | ordem nesta sessão: evidence scripts antes do smoke UI | documentado | ✅ |
| AC-07 | smoke HTTP front/API | POST localhost:3010/api/youtube/track | SMOKE_API_OK 8546781 | ✅ |
| DoD-unitarios | vitest | npm test -- --run | 29 passed | ✅ |
| DoD-lint | lint+build | npm run lint && npm run build | exit 0 | ✅ |

## Transcripts

### npm run evidence:youtube-track

```text
[evidence] youtube-track start https://www.youtube.com/watch?v=O7jQJuruHoc
[evidence] file ...\temp\yt-track-...\track.mp3
[evidence] size 8546781
EVIDENCE_OK
```

### npm run evidence:youtube-playlist

```text
[evidence] youtube-playlist start https://www.youtube.com/playlist?list=PLaLWNpJCbH_qDIrJ7aI1PsbPKIxDoHQ-b
[evidence] reused cached playlist download
[evidence] size 482191979
[evidence] entries_mp3 80
EVIDENCE_OK
```

Nota: download completo das 80 faixas ocorreu nesta sessão; zip self-include foi corrigido; evidência re-zipou a pasta já baixada.

### npm run evidence:spotify-playlist

```text
[evidence] spotify-playlist start https://open.spotify.com/playlist/1CFy5g653j16Zq1I02UoKI?si=e3218d081ce8406a
[evidence] zip ...\temp\spotify-playlist-...\playlist.zip
[evidence] size 571491649
EVIDENCE_OK
```

### npm test -- --run

```text
Test Files  8 passed (8)
Tests       29 passed (29)
```

### npm run build

```text
✓ Compiled successfully
Route (app): / , /api/youtube/track, /api/youtube/playlist, /api/spotify/playlist
```

## Graft pós

- Símbolo: `downloadBestMp3`
- path:line: `src/infra/yt-dlp.ts:94` (aprox. após refresh)
