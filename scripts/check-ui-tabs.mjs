import fs from 'node:fs';

const panel = fs.readFileSync('components/download-panel.tsx', 'utf8');

if (!/YouTube/.test(panel) || !/Spotify/.test(panel) || !/Playlist YouTube/.test(panel)) {
  console.error('missing tab labels');
  process.exit(1);
}

const tabLabels = [...panel.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
if (tabLabels.some((label) => /Baixar/i.test(label))) {
  console.error('tab labels must not include Baixar', tabLabels);
  process.exit(2);
}

console.log('ui-tabs-ok');
