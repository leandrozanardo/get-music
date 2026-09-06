# filenames-titulo-mp3 — Testes

**Sem secrets.**

## Matriz

| ID | Cenário | Comando | Resultado | ✅/❌ |
|----|---------|---------|-----------|------|
| AC-01 | YT faixa Artist - Title | evidence:youtube-track | `Zezé Di Camargo & Luciano - Sem Medo De Ser Feliz.mp3` EVIDENCE_OK | ✅ |
| AC-02/03 | naming code (no track/index) | naming-ok static check | naming-ok | ✅ |
| AC-05 | unitários | npm run test:run | 38 passed | ✅ |
| DoD-build | build | npm run build | Compiled successfully | ✅ |
| Gates | unlazy | gate-check GATES.md | ALL MET 4/4 | ✅ |

## Transcripts

### npm run evidence:youtube-track (após limpar temp)

```text
[evidence] fileName Zezé Di Camargo & Luciano - Sem Medo De Ser Feliz.mp3
[evidence] size 8546781
EVIDENCE_OK
```

### npm run test:run

```text
Test Files  9 passed (9)
Tests       38 passed (38)
```

## Graft pós

- Símbolo: `resolveDownloadFileBase`
- path:line: `src/domain/filename.ts` (export)
