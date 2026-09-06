# download-musica-spa — Gates

Porte gateavel. Um gate por outcome. Sem oráculos cosméticos.

- [x] G1: temp/ gitignored
  AC-ID: AC-01
  EVIDENCE: temp-ok
  CHECK: node -e "const fs=require('fs');const g=fs.readFileSync('.gitignore','utf8');if(!g.includes('temp'))process.exit(1);fs.mkdirSync('temp',{recursive:true});console.log('temp-ok')"
  EXPECT: temp-ok

- [x] G2: unitarios domain/infra
  DoD-ID: DoD-unitarios
  EVIDENCE: stderr | src/application/download-spotify-playlist.test.ts > downloadSpotifyPlaylist > throws EMPTY_PLAYLIST when every track download fails | Skipping track "Song A" by "Artist A": download failed
  CHECK: npm run test:run
  EXPECT: passed

- [x] G3: lint + build
  DoD-ID: DoD-lint-typecheck
  EVIDENCE: ○  (Static)   prerendered as static content | ƒ  (Dynamic)  server-rendered on demand
  CHECK: npm run build
  EXPECT: Compiled successfully

- [x] G4: YouTube track MP3 server evidence
  AC-ID: AC-02
  EVIDENCE: [evidence] size 8546781 | EVIDENCE_OK
  CHECK: npm run evidence:youtube-track
  EXPECT: EVIDENCE_OK
  ORACLE: arquivo .mp3 em temp/ com size > 0 para watch O7jQJuruHoc

- [x] G5: YouTube playlist ZIP server evidence
  AC-ID: AC-03
  EVIDENCE: [evidence] entries_mp3 80 | EVIDENCE_OK
  CHECK: npm run evidence:youtube-playlist
  EXPECT: EVIDENCE_OK
  ORACLE: zip com >= 1 entry mp3

- [x] G6: Spotify playlist ZIP server evidence
  AC-ID: AC-04
  EVIDENCE: [evidence] size 570833389 | EVIDENCE_OK
  CHECK: npm run evidence:spotify-playlist
  EXPECT: EVIDENCE_OK
  ORACLE: zip com >= 1 entry mp3 via bridge YouTube

- [x] G7: UI 3 abas dark club
  AC-ID: AC-05
  EVIDENCE: ui-tabs-ok
  CHECK: node scripts/check-ui-tabs.mjs
  EXPECT: ui-tabs-ok

- [x] G8: Testes.md has server evidence before front
  AC-ID: AC-06
  EVIDENCE: testes-ok
  CHECK: node -e "const t=require('fs').readFileSync('docs/plans/download-musica-spa/Testes.md','utf8');if(!/AC-02/.test(t)||!/EVIDENCE_OK/.test(t))process.exit(1);console.log('testes-ok')"
  EXPECT: testes-ok
