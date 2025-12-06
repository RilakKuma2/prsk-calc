const fs = require('fs');
const path = require('path');

function parseSus(content) {
    const lines = content.split('\n');
    const notes = [];
    let bpm = 120;
    const TICKS_PER_MEASURE = 192;
    const TICKS_PER_BEAT = 480;
    const ticksPerMeasure = TICKS_PER_BEAT * 4;

    lines.forEach(line => {
        line = line.trim();
        if (!line.startsWith('#')) return;
        const parts = line.split(':');
        if (parts.length < 2) return;
        const header = parts[0].substring(1);
        const data = parts[1].trim();

        if (header.match(/^BPM\d{2}$/)) {
            console.log(`Found BPM Def: ${header} : ${data}`);
        } else if (header.match(/^\d{3}02$/)) {
            console.log(`Found Time Sig: ${header} : ${data}`);
        } else if (header.match(/^\d{3}08$/)) {
            console.log(`Found BPM Change: ${header} : ${data}`);
        } else if (header.match(/^\d{3}[1-9a-zA-Z]{2}$/)) {
            const measure = parseInt(header.substring(0, 3));
            const channel = header.substring(3);
            const channelType = parseInt(channel[0], 16);

            if (channelType === 1 || channelType === 5 || channelType === 2 || channelType === 6) {
                const stepCount = data.length / 2;
                const ticksPerStep = ticksPerMeasure / stepCount;

                for (let i = 0; i < stepCount; i++) {
                    const valHex = data.substring(i * 2, i * 2 + 2);
                    const val = parseInt(valHex, 16);
                    if (val !== 0) {
                        notes.push({ type: val });
                    }
                }
            }
        }
    });
    return notes;
}

const susPath = path.join(__dirname, '../master.txt');
const content = fs.readFileSync(susPath, 'utf8');
const notes = parseSus(content);

const counts = {};
notes.forEach(n => {
    counts[n.type] = (counts[n.type] || 0) + 1;
});

console.log("Total Raw Notes:", notes.length);
console.log("Value Counts:", JSON.stringify(counts, null, 2));
