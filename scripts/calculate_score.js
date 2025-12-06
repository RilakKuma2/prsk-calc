const fs = require('fs');
const path = require('path');
const { LiveExactCalculator, LiveType } = require('sekai-calculator');

// --- 1. SUS Parser (Simplified) ---
// This is a minimal parser for the append.txt format.
// It maps SUS channel/values to generic note types.

function parseSus(content) {
    const lines = content.split('\n');
    const notes = [];
    let bpm = 120; // Default BPM
    const ticksPerBeat = 480; // Standard SUS ticks usually
    // Prsk usually uses 192 ticks per measure? Or 480?
    // Let's assume standard Seaurchin/Ched format: 192 ticks per measure is common for rhythm games, but SUS is usually 192 or 384. 
    // Standard SUS is often 192 ticks per measure (resolution).
    const TICKS_PER_MEASURE = 192;

    // We need to track measure lines to calculate absolute time
    // But simplistic approach: convert Measure + Offset to Time based on Fixed BPM
    // Real parser needs to handle BPM changes.

    const timeSignatures = {}; // measure -> ticks per measure (if changed)

    lines.forEach(line => {
        line = line.trim();
        if (!line.startsWith('#')) return;

        // Extract Header
        const parts = line.split(':');
        if (parts.length < 2) return;
        const header = parts[0].substring(1);
        const data = parts[1].trim();

        if (header.match(/^\d{3}[1-9a-zA-Z]{2}$/)) {
            // Channel Data: #XXXYY:DATA
            const measure = parseInt(header.substring(0, 3));
            const channel = header.substring(3);

            // Channel Mapping (Heuristic for Sekai)
            // 1x = Short Notes (Tap)
            // 5x = Slide Notes
            // We just treat them all as "notes" with types for now.
            // We will filter for channels that look like taps/slides.
            // Channels: 10-1F (Tap), 50-5F (Slide)
            // Hex channels?

            const channelType = parseInt(channel[0], 16);
            if (channelType === 1 || channelType === 5) { // 1=Tap, 5=Slide
                // Parse Data
                // Data is hex string. Number of chars determines resolution.
                // e.g. "001300" -> 3 pairs of 2 chars? No, header is 3 digits + 2 chars.
                // data is generic string.
                // Standard SUS data is 2 chars per tick-step.

                const stepCount = data.length / 2;
                const ticksPerStep = TICKS_PER_MEASURE / stepCount;

                for (let i = 0; i < stepCount; i++) {
                    const valHex = data.substring(i * 2, i * 2 + 2);
                    const val = parseInt(valHex, 16);

                    if (val !== 0) {
                        // Found a note!
                        // Calculate time (Simplistic: Fixed BPM)
                        const totalTicks = (measure * TICKS_PER_MEASURE) + (i * ticksPerStep);
                        const time = (totalTicks / TICKS_PER_MEASURE) * 4 * (60 / bpm); // 4 beats per measure default

                        notes.push({
                            time: time,
                            type: val, // We pass the generic SUS value (1, 2, 3...) as the "Note Type ID"
                            // Note: Real sekai IDs are different, but we mock the DB below.
                        });
                    }
                }
            }
        } else if (header === 'BPM01') {
            // Simplified: #BPM01: 120
            bpm = parseFloat(data);
        }
    });

    return {
        notes: notes.sort((a, b) => a.time - b.time),
        skills: [], // We calculate these separately or ignore for base score
        fevers: []
    };
}

// --- 2. Mock Data Provider ---
// LiveExactCalculator needs master data 'ingameNodes'.
// We inject dummy coefficients matching the IDs we parsed (1, 2, 3...).

// Standard Coefficients (Guess):
// Tap (1): 100%? Let's say 1.0. or 100?
// Use 100 as base.
const MOCK_COEFFICIENTS = {
    1: 100, // Tap / Start
    2: 100, // Critical?
    3: 50,  // Slide Tick?
    4: 100, // Flick?
    19: 100, // Hex 13? (19 decimal)
    35: 100, // Hex 23? (35 decimal)
    83: 100, // Hex 53? (83 decimal)
    // Add generic fallbacks
};

const mockDataProvider = {
    getMasterData: async (key) => {
        if (key === 'ingameNodes') {
            // Return an array covering all possible IDs our parser produced
            // We'll generate it dynamically or just return a big list
            const nodes = [];
            for (let i = 0; i < 1000; i++) {
                nodes.push({
                    id: i,
                    scoreCoefficient: MOCK_COEFFICIENTS[i] || 100 // Default 100
                });
            }
            return nodes;
        }
        if (key === 'ingameCombos') {
            return [
                { fromCount: 1, toCount: 10000, scoreCoefficient: 1.0 }
            ];
        }
        return [];
    },
    // Other methods needed by interface
    getUserDataAll: async () => ({}),
    getUserData: async () => ({}),
    getMusicMeta: async () => []
};

// --- 3. Main Calculation ---

async function run() {
    const susPath = path.join(__dirname, './append.txt');
    if (!fs.existsSync(susPath)) {
        console.error("append.txt not found!");
        return;
    }

    console.log("Reading append.txt...");
    const content = fs.readFileSync(susPath, 'utf8');

    console.log("Parsing SUS...");
    const musicScore = parseSus(content);
    console.log(`Parsed ${musicScore.notes.length} notes.`);

    if (musicScore.notes.length > 0) {
        console.log("First 5 notes:", musicScore.notes.slice(0, 5));
    }

    const uniqueTypes = [...new Set(musicScore.notes.map(n => n.type))];
    console.log("Unique Note Types:", uniqueTypes);

    console.log("Calculating Score...");
    const calculator = new LiveExactCalculator(mockDataProvider);

    // Calculate!
    // power: Deck Power (e.g. 150000)
    // skills: Skill IDs? Or Coefficients? LiveExactCalculator.ts says "skills: number[]" (skill values or IDs?)
    // Actually looking at code grep: "skills: number[]" and "getSkillDetails(skills...)".
    // It likely expects an array of active skill multipliers per note, OR simply skill durations.
    // Let's pass empty skills for "Base Score" equivalent (or constant 1.0).
    // Actually, argument is `skills`.
    // We'll assume empty array = no skills active.

    const power = 300000; // Example power
    try {
        const result = await calculator.calculate(
            power,
            [], // skills
            LiveType.SOLO,
            musicScore
        );

        console.log("\n--- Calculation Result ---");
        console.log("Total Score:", result.total);
        console.log("Note Count:", result.notes.length);
    } catch (e) {
        console.error("Calculation Error:", e);
    }
}

run().catch(console.error);
