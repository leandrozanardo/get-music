# filenames-titulo-mp3 — Contexto

## Estado

- Fase atual: **4 — Execução (SDD)**
- Próximo passo: T1–T4 naming Artist - Title
- Bloqueios: nenhum
- lote_aprovado_em: "2026-09-06T01:19:00-03:00"
- lote_aprovado_por: human

## Bootstrap

```yaml
clis_ok: [node, yt-dlp, graft, ffmpeg]
graft_fresco: true
unlazy: true
continua_de: ["download-musica-spa"]
```

## Decisões travadas

- Q1 Formato do nome: **B** — `Artista - Título.mp3`
- Q1b Playlists (correção humana): **sem** prefixo `001-`; ZIP com todas as faixas só como `Artista - Título.mp3`
- Q1c Colisões (correção humana): **sem** sufixos ` (2)` / ` (3)`; ZIP é só o apanhado — nome igual sobrescreve
- Q2 SDD: **B** — `sdd: true`

## Notas de sessão

- Causa: `fileBase` default `'track'` em yt-dlp single/search; Spotify usa `NNN-track`.
- Playlist YT já usa `%(title)s` no template.
- Push anterior `get-music`: repo https://github.com/leandrozanardo/get-music (master)

## Correções

-
