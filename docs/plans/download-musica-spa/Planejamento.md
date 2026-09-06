# download-musica-spa — Planejamento

> **For agentic workers:** REQUIRED SUB-SKILL: `subagent-driven-development` (sdd: true). Steps use checkbox syntax. **Sem commits** (harness: git só com auth humana).

**Goal:** SPA Next.js com 3 abas (YouTube, Playlist YouTube, Spotify) que entrega MP3/ZIP via yt-dlp + bridge Spotify→YouTube, visual dark club, evidência server-side das 3 URLs de aceite.

**Architecture:** App Router SPA; Route Handlers orquestram application services; infra spawna `yt-dlp`/`ffmpeg` em `temp/` gitignored; Spotify resolve metadados públicos (fallback Client Credentials); ZIP via archiver/adm-zip.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Vitest, yt-dlp, ffmpeg, graft scripts.

## Global Constraints

- Código e comentários em inglês; docs de demanda em PT-BR
- Abas **sem** a palavra “Baixar”
- Visual: dark club (noite, neon contido — sem purple-slop / glow excessivo)
- Allowlist hosts: `youtube.com`, `youtu.be`, `open.spotify.com`
- Paths de download confinados a `temp/`
- Playlist YouTube de teste: **inteira**; `maxDuration` alto nas rotas
- Sem secrets no git; `.env.local` opcional só para Spotify fallback
- Sem passos de `git commit` nesta sessão salvo auth humana
- Evidência AC-02..04 via scripts **antes** do smoke front

## Status do plano

PRONTO

## Branch prevista

`main` (greenfield local; sem push)

## Mapa de arquivos

| Path | Responsabilidade |
|------|------------------|
| `app/page.tsx` | SPA shell + tabs |
| `app/api/youtube/track/route.ts` | POST URL → MP3 |
| `app/api/youtube/playlist/route.ts` | POST URL → ZIP |
| `app/api/spotify/playlist/route.ts` | POST URL → ZIP |
| `src/domain/urls.ts` | parse/validate YouTube/Spotify URLs |
| `src/domain/errors.ts` | AppError tipado |
| `src/application/download-youtube-track.ts` | orquestra faixa |
| `src/application/download-youtube-playlist.ts` | orquestra playlist+zip |
| `src/application/download-spotify-playlist.ts` | resolve+YT+zip |
| `src/infra/yt-dlp.ts` | spawn yt-dlp |
| `src/infra/temp-dir.ts` | criar/limpar job dirs em temp/ |
| `src/infra/zip.ts` | zip directory |
| `src/infra/spotify-metadata.ts` | metadados públicos + fallback API |
| `scripts/evidence-*.mts` | evidência AC |
| `temp/` | runtime downloads (gitignored) |

## Tarefas

### T1 — Scaffold Next + tooling

**Files:** create project root (`package.json`, `app/`, `components.json`, `.gitignore` com `temp/`, `vitest`, scripts graft/evidence)

1. `create-next-app` (TS, Tailwind, App Router, ESLint) no cwd
2. Init shadcn + tabs/button/input/label/toast components
3. Garantir `temp/` + `.gitignore`; scripts `graft:*`, `test`, `evidence:*`
4. Evidência: `npm run lint` inicia; `Test-Path temp` true

### T2 — Domain URLs (TDD)

**Files:** `src/domain/urls.ts`, `src/domain/errors.ts`, `src/domain/urls.test.ts`

1. Red: testes para watch URL, playlist YT, playlist Spotify, rejeição de host estranho
2. Green: parsers + allowlist
3. Evidência: `npm test -- urls` PASS

### T3 — Infra yt-dlp + temp (TDD unit mock + smoke leve)

**Files:** `src/infra/temp-dir.ts`, `src/infra/yt-dlp.ts`, testes unitários com mock spawn

1. Red: `downloadBestMp3(url, outDir)` args esperados (`-x --audio-format mp3 --audio-quality 0`)
2. Green: implementação spawn + erros tipados (sem áudio)
3. Evidência: unit PASS

### T4 — Application YouTube track + playlist + zip

**Files:** application services, `src/infra/zip.ts`, route handlers YT

1. Red: testes de orquestração (mocks)
2. Green: services + `POST /api/youtube/track` + `POST /api/youtube/playlist` (`maxDuration=3600`)
3. Evidência: unit PASS

### T5 — Spotify bridge

**Files:** `src/infra/spotify-metadata.ts`, `src/application/download-spotify-playlist.ts`, route

1. Red: query builder `artist - title`; erro se metadata falhar sem credenciais
2. Green: public resolve → yt search (`ytsearch1:`) → zip; fallback Client Credentials
3. Evidência: unit PASS

### T6 — UI dark club SPA

**Files:** `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, components download forms

1. 3 tabs shadcn; dark club CSS variables; forms POST → blob download
2. Loading/disabled; toast destructive em erro; toast sucesso
3. Evidência: `npm run build` OK

### T7 — Evidence scripts (AC-02..04)

**Files:** `scripts/evidence-youtube-track.mts`, `evidence-youtube-playlist.mts`, `evidence-spotify-playlist.mts`

1. Rodar downloads reais nas 3 URLs de aceite → assert file size > 0 / zip entries
2. Registrar saídas em `Testes.md`
3. Smoke front só depois

### T8 — Graft + gates reverify + fecho

1. `graft init` + `npm run graft:refresh`
2. `node .agents/skills/unlazy/scripts/gate-check.mjs docs/plans/download-musica-spa/GATES.md`
3. Preencher `Testes.md` / `Concluido.md`

## Comandos de verificação

```bash
npm run lint
npm run test
npm run build
npm run evidence:youtube-track
npm run evidence:youtube-playlist
npm run evidence:spotify-playlist
npm run graft:refresh
```

## Mapa aceite → tarefa → evidência

| AC/DoD | Tarefa | Evidência |
|--------|--------|-----------|
| AC-01 temp gitignored | T1 | `.gitignore` + pasta |
| AC-02 YT track | T3/T4/T7 | evidence script |
| AC-03 YT playlist ZIP | T4/T7 | evidence script |
| AC-04 Spotify ZIP | T5/T7 | evidence script |
| AC-05 UI 3 abas | T6 | build + smoke |
| AC-06 server before front | T7 | Testes.md order |
| AC-07 smoke front | T7/T8 | manual/curl UI |
| DoD-unitarios | T2–T5 | vitest |
| DoD-lint-typecheck | T1/T6 | lint + build |
| DoD-graft | T8 | refresh + símbolo |
