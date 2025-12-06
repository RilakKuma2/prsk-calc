const fs = require('fs');
const path = require('path');

const metaPath = path.join(__dirname, 'src/data/music_metas.json');
const rawData = fs.readFileSync(metaPath, 'utf8');
const musicMetas = JSON.parse(rawData);

const masterMeta = musicMetas.find(m => m.difficulty === 'master');

if (masterMeta) {
    console.log('Master Meta:', JSON.stringify(masterMeta, null, 2));
} else {
    console.log('No Master meta found');
}
