# download-musica-spa — Brainstorming

## Metadados (fail-closed)

```yaml
porte: gateavel
sdd: true
status_demanda: CLOSED
continua_de: null
```

## Prompt (literal)

Quero criar um projeto simple em next que consiste no seguinte.

Uma SPA que tem 3 abas:
Baixar musica do youtube, baixar playlist youtube, baixar playlist spotfy (não coloque o baixar, é só pro seu entendimento)

A página deve ser bonita e moderna, com breakpoints perfeitos, sem ai slop

Baixar musica do youtube: é fornecido um link e ele baixa na qualidade máxima o mp3 (se não tiver tem que avisar o usuário)
baixar playlist youtube: mesma premissa (qualidade máxima) do anterior mas pra playlist inteira, compacta como zip e inicia o download
playlist spotfy: baixa todas as musicas do spotfy em mp3 e fornece o zip para download.

observação: eu não lembro se da pra baixar musica do spotfy, já fiz esse sistema mas acho que eu fiz com que ele procurasse as respectivas musicas no youtube (mesma versão) e baixasse.

Critérios de aceite:
Criar uma pasta temp (gitignored)
Baixar: https://www.youtube.com/watch?v=O7jQJuruHoc como teste de musica yt
Baixar: https://www.youtube.com/playlist?list=PLaLWNpJCbH_qDIrJ7aI1PsbPKIxDoHQ-b como teste de playlist yt
Baixar: https://open.spotify.com/playlist/1CFy5g653j16Zq1I02UoKI?si=e3218d081ce8406a como teste do spotfy

Isso tudo você vai fazer por dentro do sistema para testar.
Depois precisaremos fazer o teste via front-end mas isso já precisa estar validade pelo teste anterior é só pra confirmar.

USe shacdn.

Se inspire em algum site de música moderno muito bonito.

## Contexto verificado no código

- Caminhos reais (Graft): repo **vazio** (greenfield); Graft CLI instalado, refresh pós-scaffold na Fase 4
- `docs/plans_old/` consultado: inexistente
- CLIs detectadas / instaladas:
  - OK: `node` v24.13.0, `npm` 11.6.2, `pnpm`, `ffmpeg` 8.1, `yt-dlp` 2026.07.04, `graft` 0.16.0, `gh`
  - Instaladas neste boot: `yt-dlp`, `@nanonets/graft`, skill `unlazy` (cartychris) em `.agents/skills/unlazy`
- Graft frescosim/não: **não** (sem `package.json` / src ainda — refresh obrigatório após scaffold)
- unlazy presente: **sim** (`.agents/skills/unlazy`)

## Premissa técnica travada (Spotify)

Spotify **não** entrega áudio DRM-free via API pública. A estratégia correta (e a que o usuário já lembra) é:

1. Ler metadados da playlist Spotify (tracks: título + artistas)
2. Buscar no YouTube a melhor correspondência (mesma versão / query `artist - title`)
3. Extrair áudio com `yt-dlp` → MP3 qualidade máxima (`bestaudio` + ffmpeg)
4. Empacotar ZIP e servir download

Sem credenciais Spotify Client ID/Secret no lote: preferir resolução via página pública / oEmbed / scrape de metadados **ou** Spotify Web API se o humano fornecer `.env` local. **Decisão MCQ abaixo.**

## Abordagens

### A — Next.js App Router (SPA) + Route Handlers + `yt-dlp`/`ffmpeg` locais + `temp/` gitignored
- O que é: UI shadcn (3 tabs); APIs server-side que validam URL, baixam para `temp/`, retornam arquivo/ZIP; Spotify via bridge YouTube.
- Prós: stack pedido; um processo; fácil testar com as 3 URLs de aceite; shadcn nativo; deploy local simples.
- Contras: depende de binários no PATH; jobs longos bloqueiam request HTTP (mitigar timeout/streaming/progress); playlist grande pode demorar.
- Quando faz sentido: ferramenta pessoal/local, escopo deste aceite.
- Trade-off: simplicidade operacional vs robustez de fila.

### B — Next.js UI + worker/queue (BullMQ/Redis) + jobs assíncronos
- O que é: UI dispara job; polling/SSE de progresso; worker executa yt-dlp.
- Prós: playlists longas sem timeout HTTP; UX de progresso rica.
- Contras: Redis/infra extra; fora do “simple”; aceites atuais não exigem progresso avançado.
- Quando faz sentido: produção multi-usuário ou playlists enormes com SLA.
- Trade-off: resiliência vs complexidade.

### C — Next.js UI + sidecar Python (FastAPI) só para download
- O que é: Node serve UI; Python encapsula yt-dlp/Spotify search.
- Prós: ecossistema Python maduro para mídia.
- Contras: dois runtimes; mais superfície de falha; não pedido.
- Quando faz sentido: time já padronizado em Python para mídia.
- Trade-off: especialização vs mono-repo Node.

### Recomendação

**A3 = A** (Next.js + Route Handlers + yt-dlp local + bridge Spotify→YouTube).

Motivo: atende aceite 1:1, shadcn, pasta `temp/`, testes internos com as 3 URLs, sem infra extra. Progresso mínimo (status + spinner) no front; se playlist YouTube de teste for grande demais para timeout, ajustar `maxDuration` / download em streaming de ZIP no mesmo desenho A (sem Redis).

## Desenho proposto (para aprovação)

### Arquitetura

```text
Browser (SPA tabs)
  → POST /api/youtube/track   { url }     → yt-dlp → temp/*.mp3 → file response
  → POST /api/youtube/playlist { url }    → yt-dlp batch → zip → file response
  → POST /api/spotify/playlist { url }    → resolve tracks → YT search each → zip → file response
temp/ (gitignored)  +  cleanup after response (best-effort)
```

Camadas sugeridas (Clean Architecture leve):
- `domain/` — validação de URL, tipos de job, erros tipados
- `application/` — orquestração download / zip / spotify-resolve
- `infra/` — yt-dlp spawn, ffmpeg, fs temp, spotify metadata client
- `app/` — UI + Route Handlers

### UI / visual

- shadcn/ui + Tabs (3): YouTube · Playlist YouTube · Spotify
- Labels das abas **sem** a palavra “Baixar” (ex.: “YouTube”, “Playlist YouTube”, “Spotify”)
- Direção visual **aprovada no lote Q4=B**: **dark club** — noite, neon contido (sem glow excessivo / purple-slop), tipografia expressiva, atmosfera de pista/studio, breakpoints impecáveis
- Uma composição no primeiro viewport: marca, título, uma frase, tabs + formulário, CTA

### Decisões do lote (humano)

| Q | Escolha |
|---|---------|
| Q1 Arquitetura | **A** Next + Route Handlers + yt-dlp |
| Q2 Spotify metadata | **A** pública + fallback Client Credentials |
| Q3 SDD | **B** `sdd: true` |
| Q4 Visual | **B** Dark club |
| Q5 Playlist YT teste | **A** inteira + timeout |

### Aceite (testável)

- AC-01: pasta `temp/` existe e está no `.gitignore`
- AC-02: sistema baixa `https://www.youtube.com/watch?v=O7jQJuruHoc` em MP3 (melhor áudio disponível); se impossível extrair áudio, mensagem clara ao usuário/API
- AC-03: sistema baixa playlist `https://www.youtube.com/playlist?list=PLaLWNpJCbH_qDIrJ7aI1PsbPKIxDoHQ-b` em MP3s, gera ZIP e disponibiliza download
- AC-04: sistema resolve playlist Spotify `https://open.spotify.com/playlist/1CFy5g653j16Zq1I02UoKI?si=e3218d081ce8406a`, encontra faixas no YouTube, baixa MP3s, ZIP para download
- AC-05: SPA com 3 abas funcionais (shadcn), responsiva, visual moderno sem AI-slop
- AC-06: evidência **server-side/script** das AC-02..04 nesta sessão **antes** do smoke via front
- AC-07: smoke front confirma os mesmos fluxos após AC-06 verde

### DoD (inclui barras C)

- DoD-01: AC-01..07 com evidência em `Testes.md` (sem secrets)
- DoD-unitarios: validação de URL + mapper Spotify→query YT + erro “sem áudio”
- DoD-lint-typecheck: `npm run lint` + `tsc`/typecheck verde
- DoD-security: sem secrets no git; inputs validados; paths confinados a `temp/`; sem SSRF arbitrário (allowlist youtube/spotify hosts)
- DoD-logs: log início/fim/falha por job (sem PII)
- DoD-graft: refresh pós + 1 símbolo citado
- DoD-gates: `GATES.md` met (porte gateavel)

### Fora de escopo

- Conta multi-usuário / auth
- Deploy cloud / CDN
- Progresso granular por faixa via WebSocket (opcional depois)
- Download DRM nativo do Spotify
- Apps mobile
- Fila Redis

### Ambiente de evidência

- Local Windows (`d:\Projetos\get-music`), Node + yt-dlp + ffmpeg no PATH
- **Proibido PROD**

### Comando de teste previsto

```bash
# após scaffold
npm run lint
npm run test
# scripts de evidência (a criar)
npm run evidence:youtube-track
npm run evidence:youtube-playlist
npm run evidence:spotify-playlist
```

## Q&A / lote (MCQ — responder A/B/C…)

### Q1 — Arquitetura
**Recomendação: A**

- **A)** Next + Route Handlers + yt-dlp local (recomendado)
- **B)** Next + fila Redis/worker
- **C)** Next + sidecar Python

### Q2 — Metadados Spotify
**Recomendação: A** (sem credenciais; fallback documentado)

- **A)** Resolver playlist pública sem Client Secret (metadata pública / parse); se falhar, erro acionável pedindo `SPOTIFY_CLIENT_ID`/`SECRET`
- **B)** Exigir Spotify Web API (Client Credentials) desde o dia 1 via `.env.local`
- **C)** Colar JSON de tracks manualmente (só fixture de teste)

### Q3 — SDD (subagent-driven)
**Recomendação: A** (`sdd: false`)

- **A)** `sdd: false` — execução na sessão principal
- **B)** `sdd: true` — tarefas via subagentes

### Q4 — Visual
**Recomendação: A**

- **A)** Listening room editorial (tipografia forte, accent único, atmosfera sutil, shadcn tabs)
- **B)** Dark club (noite, neon contido — aceita dark)
- **C)** Record-shop light (papel texturizado + tipografia display — sem cream/terracotta clichê)

### Q5 — Escopo de playlist YouTube no teste
A playlist de aceite pode ser longa. **Recomendação: A**

- **A)** Baixar a playlist **inteira** (aceite literal); aumentar timeout server
- **B)** Limitar a N faixas no teste (ex. 5) e documentar limite configurável
- **C)** Modo “amostra” no UI + modo full só via script de evidência

## PILOT / aprovação

```yaml
lote_aprovado: true
lote_aprovado_em: "2026-09-06T00:30:00-03:00"
lote_aprovado_por: human
ask_git_at_end: true
```

**HARD-GATE:** lote aprovado — liberado para plano + código.
