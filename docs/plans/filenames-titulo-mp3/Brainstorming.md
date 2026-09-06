# filenames-titulo-mp3 — Brainstorming

## Metadados (fail-closed)

```yaml
porte: gateavel
sdd: true
status_demanda: CLOSED
continua_de: ["download-musica-spa"]
```

## Prompt (literal)

O download deveria vir com o titulo da música, não como track.
Isso vale pra todos os downloads de música independente de qual metodo usado
/harness

## Contexto verificado no código

- Caminhos reais (Graft): `downloadBestMp3` · `src/infra/yt-dlp.ts:106` (template default `track.%(ext)s`)
- Spotify: `fileBase = NNN-track` em `src/application/download-spotify-playlist.ts`
- Playlist YT: já usa `%(playlist_index)03d-%(title)s` (parcialmente alinhado)
- Faixa YT única: hardcode `fileBase='track'`
- `docs/plans_old/`: N/A; plano anterior `download-musica-spa` CLOSED
- CLIs: node, yt-dlp, graft OK; unlazy presente
- Graft frescosim: refresh nesta sessão

## Abordagens

### A — Template yt-dlp `%(title)s` + sanitize FS (recomendado)
- O que é: saída `-o` com título real do recurso (ou query Spotify resolvida); sanitizar caracteres inválidos Windows; `Content-Disposition` usa o basename.
- Prós: uma regra em todos os métodos; título vem da fonte; pouco código.
- Contras: títulos longos/duplicados; caracteres unicode.
- Quando: escopo atual.
- Trade-off: simplicidade vs metadados ricos (artista).

### B — Sempre `Artist - Title.mp3`
- O que é: montar nome a partir de metadata (YT `--print` / Spotify artists+title).
- Prós: mais descritivo; melhor busca local.
- Contras: YouTube `uploader` ≠ artista; mais parsing.
- Quando: biblioteca pessoal organizada.
- Trade-off: UX disco vs fidelidade ao “só título”.

### C — ID + título (`videoId-title.mp3`)
- O que é: prefixo estável + título.
- Prós: unicidade; sem colisão.
- Contras: feio; usuário pediu título, não ID.
- Quando: batches grandes com colisões.

### Decisões do lote (humano)

| Q | Escolha |
|---|---------|
| Q1 Formato | **B** `Artista - Título.mp3` |
| Q1b Playlists | **sem índice** — ZIP só com `Artista - Título.mp3` por faixa |
| Q1c Colisões | **sem** `(2)`/`(3)` — sobrescreve se o nome coincidir |
| Q2 SDD | **B** `sdd: true` |

### Recomendação de implementação (pós-aprovação)

- Sanitize FS Windows
- YouTube faixa / playlist / Spotify: `Artista - Título.mp3` (sem índice, sem sufixo de colisão)
- Nunca `track.mp3` / `NNN-track.mp3` / `001-...` / ` (2)`
- `Content-Disposition` com o mesmo basename (faixa única); ZIP permanece `*-playlist.zip`


## Aceite (testável)

- AC-01: download YouTube faixa → `.mp3` = `Artista - Título.mp3` (não `track.mp3`)
- AC-02: playlist YouTube → ZIP com entradas `Artista - Título.mp3` (sem prefixo numérico)
- AC-03: playlist Spotify → ZIP com entradas `Artista - Título.mp3` (sem `NNN-track`)
- AC-04: `Content-Disposition` / download browser usa o mesmo basename na faixa única
- AC-05: unitários sanitize + naming; evidence leve (1 faixa YT) confirma nome

## DoD

- DoD-unitarios: sanitize + yt-dlp template / spotify fileBase
- DoD-lint-typecheck: lint + build verdes
- DoD-graft: refresh + símbolo citado
- Barras C: paths só em temp/; sem secrets

## Fora de escopo

- Tags ID3 embutidas
- Renomear ZIPs de playlist (`youtube-playlist.zip` pode permanecer)
- UI copy

## Ambiente de evidência

- Local; `npm run evidence:youtube-track` + assert nome ≠ track

## Comando de teste previsto

```bash
npm run test:run
npm run evidence:youtube-track
# assert: basename do mp3 não é track.mp3
```

## Q&A / lote (MCQ)

### Q1 — Formato do nome
**Recomendação: A**

- **A)** Só título sanitizado (`Giving Me.mp3`); em playlists `001-Giving Me.mp3`
- **B)** `Artista - Título.mp3` sempre que houver artista
- **C)** `videoId-titulo.mp3` / id Spotify + título

### Q2 — SDD
**Recomendação: A** (`sdd: false` — mudança local)

- **A)** `sdd: false`
- **B)** `sdd: true`

## PILOT / aprovação

```yaml
lote_aprovado: true
lote_aprovado_em: "2026-09-06T01:19:00-03:00"
lote_aprovado_por: human
ask_git_at_end: true
```

**HARD-GATE:** lote aprovado — liberado para plano + código.
