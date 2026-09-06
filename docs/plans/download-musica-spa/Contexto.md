# download-musica-spa — Contexto

## Estado

- Fase atual: **fecho — gates 8/8 MET; aguardando auth git + smoke UI humano**
- Próximo passo: usuário confirma UI no browser; autoriza ou não commit
- Bloqueios: nenhum técnico

## Bootstrap (sessão)

```yaml
clis_ok:
  - node@24.13.0
  - npm@11.6.2
  - ffmpeg@8.1
  - yt-dlp@2026.08.19
  - graft@0.16.0
  - gh
graft_fresco: true
unlazy: true
lote_aprovado: true
gates: ALL_MET_8_8
```

## Decisões travadas

- Lote aprovado (“Aprovado, consegue seguir até o final?”)
- Q1 Arquitetura: **A**
- Q2 Metadados Spotify: **A**
- Q3 SDD: **B** (`sdd: true`)
- Q4 Visual: **B** Dark club
- Q5 Playlist YT teste: **A** inteira

## Notas de sessão

- Repo greenfield; bridge Spotify→YouTube.
- Git só no final com auth humana.

## Correções

-
