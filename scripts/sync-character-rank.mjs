// Sync only the shared rank/challenge calculation files, never site UI or account data.
// Usage: node scripts/sync-character-rank.mjs [path/to/sekai-statics]
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(process.argv[2] || resolve(root, '../sekai-statics'));
const files = [
  ...['characterRankTheory', 'progression', 'songAvailability', 'challengeTheory', 'challengeHistory',
    'challengeBaseline', 'nuiAvailability', 'characterMapping'].map(name => `utils/${name}.js`),
  ...['characterMissionV2s', 'characterMissionV2ParameterGroups', 'levels', 'progressionRewards',
    'challengeBaseline20260930'].map(name => `data/${name}.json`),
];
for (const file of files) {
  const target = resolve(root, 'src', file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, 'src', file), target);
}
console.log(`Updated ${files.length} shared character-rank files.`);
