# filenames-titulo-mp3 — Gates

- [x] G1: unitarios filename + yt-dlp + application
  AC-ID: AC-05
  EVIDENCE: stderr | src/application/download-spotify-playlist.test.ts > downloadSpotifyPlaylist > throws EMPTY_PLAYLIST when every track download fails | Skipping track "Song A" by "Artist A": download failed
  CHECK: npm run test:run
  EXPECT: passed

- [x] G2: build
  DoD-ID: DoD-lint-typecheck
  EVIDENCE: ○  (Static)   prerendered as static content | ƒ  (Dynamic)  server-rendered on demand
  CHECK: npm run build
  EXPECT: Compiled successfully

- [x] G3: YouTube track filename is Artist - Title
  AC-ID: AC-01
  EVIDENCE: [evidence] size 8546781 | EVIDENCE_OK
  CHECK: npm run evidence:youtube-track
  EXPECT: EVIDENCE_OK

- [x] G4: no track.mp3 in yt-dlp/spotify sources
  AC-ID: AC-02
  EVIDENCE: naming-ok
  CHECK: node -e "const fs=require('fs');const paths=['src/infra/yt-dlp.ts','src/application/download-spotify-playlist.ts','src/application/download-youtube-track.ts'];for(const p of paths){const t=fs.readFileSync(p,'utf8');if(/fileBase\s*=\s*'track'|NNN-track|001-track|fileBase = 'track'/.test(t)) {console.error('bad',p);process.exit(1);} if(p.includes('yt-dlp') && /playlist_index/.test(t)) {console.error('index',p);process.exit(2);} } console.log('naming-ok')"
  EXPECT: naming-ok
