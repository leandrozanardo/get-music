# filenames-titulo-mp3 — Concluído

## Aceite 1:1

| ID | Resultado | Evidência |
|----|-----------|-----------|
| AC-01 YT faixa `Artista - Título` | ✅ | evidence fileName sem `track.mp3` |
| AC-02 YT playlist sem índice | ✅ | template `%(title)s` + naming-ok |
| AC-03 Spotify `Artista - Título` | ✅ | `buildArtistTitleBase` no application + testes |
| AC-04 Content-Disposition | ✅ | basename do filePath |
| AC-05 unitários | ✅ | 38 passed |

## DoD 1:1

| ID | Resultado | Evidência |
|----|-----------|-----------|
| Gates | ✅ | ALL MET 4/4 |
| Build/lint | ✅ | exit 0 |
| Graft | ✅ | `resolveDownloadFileBase` |

## Git

Perguntado ao humano: sim — autorizado: pendente
