
// Constants
export const ENERGY_MULTIPLIERS = {
    0: 1,
    1: 5,
    2: 10,
    3: 15,
    4: 19,
    5: 23,
    6: 26,
    7: 29,
    8: 31,
    9: 33,
    10: 35
};

// Removed 36.0 from the list (Max 31.5)
export const MY_SEKAI_POWERS = [0, 4.5, 9.0, 13.5, 18.0, 22.5, 27.0, 31.5];

export const MY_SEKAI_REQ_MULTIPLIERS = {
    1000: [100, 82, 67, 54, 43, 34, 25, 18, 12],
    1500: [200, 173, 150, 131, 115, 100, 88, 77, 67],
    2000: [300, 264, 234, 208, 186, 167, 150, 136, 123],
    2500: [400, 355, 317, 285, 258, 234, 213, 195, 178],
    3000: [500, 446, 400, 362, 329, 300, 275, 253, 234],
    3500: [600, 537, 484, 439, 400, 367, 338, 312, 289],
    4000: [700, 628, 567, 516, 472, 434, 400, 371, 345],
    4500: [800, 719, 650, 593, 543, 500, 463, 430, 400],
    5000: [null, null, 734, 670, 615, 567, 525, 489, 456],
    5500: [null, null, null, 747, 686, 634, 588, 548, 512],
    6000: [null, null, null, null, 758, 700, 650, 606, 567],
    6500: [null, null, null, null, null, 767, 713, 665, 623],
    7000: [null, null, null, null, null, null, 775, 724, 678],
    7500: [null, null, null, null, null, null, null, 783, 734],
    8000: [null, null, null, null, null, null, null, null, 789]
};

/**
 * Parses the Envy CSV content.
 */
export const parseEnvyCsv = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const bonusColumns = [];

    for (let i = 3; i < headers.length; i++) {
        const bonusStr = headers[i].replace('%', '').trim();
        if (bonusStr) {
            bonusColumns.push({ index: i, value: parseInt(bonusStr, 10) });
        }
    }

    const lookup = new Map();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');

        const minScore = parseInt(parts[0], 10);
        const maxScore = parseInt(parts[2], 10);

        if (isNaN(minScore) || isNaN(maxScore)) continue;

        for (let j = 0; j < bonusColumns.length; j++) {
            const col = bonusColumns[j];
            const baseEPStr = parts[col.index];
            if (!baseEPStr) continue;

            const baseEP = parseInt(baseEPStr, 10);

            if (!isNaN(baseEP)) {
                if (!lookup.has(baseEP)) {
                    lookup.set(baseEP, []);
                }
                lookup.get(baseEP).push({
                    minScore,
                    maxScore,
                    bonus: col.value
                });
            }
        }
    }
    return lookup;
};

/**
 * Generates separate options for Envy and MySekai.
 */
export const generateOptions = (csvData, maxBonus, zeroScoreOnly) => {
    const envyOptions = [];
    const mySekaiOptions = [];

    // 1. Envy Options
    for (const [baseEP, details] of csvData.entries()) {
        const validDetails = details.filter(d =>
            d.bonus <= maxBonus &&
            d.bonus >= 25 && // Min bonus 40%
            d.maxScore <= 1000000 && // Max score 1.0M
            (!zeroScoreOnly || d.maxScore <= 19999)
        );

        if (validDetails.length === 0) continue;

        // ONLY 0 Energy for Envy Solver
        const energy = 0;
        const mult = ENERGY_MULTIPLIERS[energy];
        const ep = baseEP * mult;

        envyOptions.push({
            ep,
            type: 'envy',
            envyDetails: [{
                energy,
                baseEP,
                details: validDetails
            }]
        });
    }

    // Merge Envy Options by EP
    const mergedEnvyMap = new Map();
    for (const opt of envyOptions) {
        if (!mergedEnvyMap.has(opt.ep)) {
            mergedEnvyMap.set(opt.ep, { ep: opt.ep, type: 'envy', envyDetails: [] });
        }
        mergedEnvyMap.get(opt.ep).envyDetails.push(...opt.envyDetails);
    }
    // Sort Envy Options Descending (High Score First)
    const uniqueEnvyOptions = Array.from(mergedEnvyMap.values()).sort((a, b) => b.ep - a.ep);


    // 2. MySekai Options
    for (const [ptStr, reqMults] of Object.entries(MY_SEKAI_REQ_MULTIPLIERS)) {
        const pt = parseInt(ptStr, 10);

        // Filter: Only >= 2500
        if (pt < 2500) continue;

        let achievable = false;
        const validReqs = [];

        // Use MY_SEKAI_POWERS.length to limit iteration (0 to 7 for 31.5 max)
        for (let i = 0; i < MY_SEKAI_POWERS.length; i++) {
            if (reqMults[i] !== null && reqMults[i] <= maxBonus) {
                achievable = true;
                validReqs.push({
                    powerIdx: i,
                    reqMult: reqMults[i]
                });
            }
        }

        if (achievable) {
            mySekaiOptions.push({
                ep: pt,
                type: 'mysekai',
                mySekaiDetails: [{
                    pt,
                    validReqs
                }]
            });
        }
    }

    // Sort MySekai options: 3000 Priority, then Descending
    mySekaiOptions.sort((a, b) => {
        if (a.ep === 3000 && b.ep !== 3000) return -1;
        if (b.ep === 3000 && a.ep !== 3000) return 1;
        return b.ep - a.ep;
    });

    return { envyOptions: uniqueEnvyOptions, mySekaiOptions };
};

/**
 * Solves the score art problem with MySekai priority, Envy Variety, and Two-Pass Strategy.
 * @param {number} gap 
 * @param {object} options 
 * @param {boolean} allowNonMod5 - If true, skip the strict Mod 5 check.
 */
export const solveScoreArt = (gap, { envyOptions, mySekaiOptions }, allowNonMod5 = false) => {
    if (gap <= 0) return [];

    // Internal solver function
    const runSolver = (currentEnvyOptions) => {
        const solutions = [];
        const maxSolutions = 100;

        // 1. DFS Setup
        const memoEnvy = new Map();
        const findEnvyCombinations = (target) => {
            if (target === 0) return [[]];
            if (target < 0) return [];
            if (memoEnvy.has(target)) return memoEnvy.get(target);

            const results = [];
            const maxResults = 50;

            const dfs = (rem, combo, startIdx, distinctCount) => {
                if (results.length >= maxResults) return;
                if (rem === 0) {
                    results.push([...combo]);
                    return;
                }

                for (let i = startIdx; i < currentEnvyOptions.length; i++) {
                    const opt = currentEnvyOptions[i];
                    if (opt.ep > rem) continue; // Descending sort: must continue, not break

                    let newDistinctCount = distinctCount;
                    if (combo.length === 0 || combo[combo.length - 1].ep !== opt.ep) {
                        newDistinctCount++;
                    }

                    if (newDistinctCount > 4) continue;

                    combo.push(opt);
                    dfs(rem - opt.ep, combo, i, newDistinctCount);
                    combo.pop();

                    if (results.length >= maxResults) return;
                }
            };

            dfs(target, [], 0, 0);
            memoEnvy.set(target, results);
            return results;
        };

        // 2. Reachability Check
        const MAX_ENVY_SEARCH = 50000;
        const dpLimit = Math.min(gap, MAX_ENVY_SEARCH);
        const envyReachable = new Array(dpLimit + 1).fill(false);
        envyReachable[0] = true;
        for (const opt of currentEnvyOptions) {
            if (opt.ep > dpLimit) continue;
            for (let s = opt.ep; s <= dpLimit; s++) {
                if (envyReachable[s - opt.ep]) envyReachable[s] = true;
            }
        }

        // 3. Tiered Search
        const thresholds = [];
        for (let t = 5000; t <= dpLimit; t += 5000) {
            thresholds.push(t);
        }
        // Ensure dpLimit is included if it's not covered (e.g. gap < 5000)
        if (thresholds.length === 0 || thresholds[thresholds.length - 1] < dpLimit) {
            thresholds.push(dpLimit);
        }

        for (const threshold of thresholds) {
            for (const mOpt of mySekaiOptions) {
                const minCount = Math.max(0, Math.ceil((gap - threshold) / mOpt.ep));
                const maxCount = Math.floor(gap / mOpt.ep);

                for (let count = maxCount; count >= minCount; count--) {
                    const currentMySekaiTotal = mOpt.ep * count;
                    const remainder = gap - currentMySekaiTotal;

                    if (remainder < 0) continue;
                    if (remainder > threshold) break;

                    if (remainder <= dpLimit && envyReachable[remainder]) {
                        const envyCombos = findEnvyCombinations(remainder);

                        for (const eCombo of envyCombos) {
                            const fullSolution = [];
                            for (let k = 0; k < count; k++) fullSolution.push(mOpt);
                            fullSolution.push(...eCombo);
                            solutions.push(fullSolution);
                        }

                        if (solutions.length >= maxSolutions) break;
                    }
                }
                if (solutions.length >= maxSolutions) break;
            }
            if (solutions.length >= maxSolutions) break;
        }
        return solutions;
    };

    // Helper to filter Envy options by Bonus % 5
    const filterEnvyMod5 = (options) => {
        const filtered = [];
        for (const opt of options) {
            if (opt.type !== 'envy') {
                filtered.push(opt);
                continue;
            }

            const newEnvyDetails = [];
            for (const d of opt.envyDetails) {
                const validSubDetails = d.details.filter(sub => sub.bonus % 5 === 0);
                if (validSubDetails.length > 0) {
                    newEnvyDetails.push({
                        ...d,
                        details: validSubDetails
                    });
                }
            }

            if (newEnvyDetails.length > 0) {
                filtered.push({
                    ...opt,
                    envyDetails: newEnvyDetails
                });
            }
        }
        return filtered;
    };

    let solutions = [];

    if (allowNonMod5) {
        // If allowed, run solver with ALL options immediately
        solutions = runSolver(envyOptions);
    } else {
        // Strict Mode: Filter options to ONLY include those with Bonus % 5 === 0
        const envyMod5 = filterEnvyMod5(envyOptions);
        solutions = runSolver(envyMod5);
    }

    return solutions;
};

/**
 * Scores and sorts the solutions.
 * @param {Array} solutions 
 * @param {boolean} allowNonMod5 - If true, skip strict Mod 5 sorting priority.
 */
export const sortSolutions = (solutions, allowNonMod5 = false) => {
    const scored = solutions.map(sol => {
        let totalFire = 0;
        let totalGames = sol.length;
        let envyFire = 0;
        let envyGames = 0;
        let mySekaiGames = 0;
        let totalMySekaiScore = 0;
        let diversityScore = 0;
        let isAllEnvyMod5 = true;

        for (const item of sol) {
            if (item.type === 'mysekai') {
                mySekaiGames++;
                totalMySekaiScore += item.ep;
                totalFire += 1;
            } else {
                envyGames++;
                let minE = 0;
                envyFire += minE;
                totalFire += minE;
                if (item.envyDetails) diversityScore += item.envyDetails.length;

                // Check if this item has ANY valid Mod 5 bonus
                const hasMod5Bonus = item.envyDetails.some(d =>
                    d.details.some(sub => sub.bonus % 5 === 0)
                );
                if (!hasMod5Bonus) isAllEnvyMod5 = false;
            }
        }

        return {
            combination: sol,
            mySekaiGames,
            totalMySekaiScore,
            envyFire,
            envyGames,
            totalFire,
            totalGames,
            diversityScore,
            isAllEnvyMod5
        };
    });

    scored.sort((a, b) => {
        // 1. All Envy Mod 5 Priority (True > False) - ONLY if not allowed non-mod 5 explicitly
        if (!allowNonMod5) {
            if (a.isAllEnvyMod5 !== b.isAllEnvyMod5) return b.isAllEnvyMod5 - a.isAllEnvyMod5;
        }

        // 2. Min Total Fire (Ascending)
        if (a.totalFire !== b.totalFire) return a.totalFire - b.totalFire;

        // 3. Min Envy Games (Ascending)
        if (a.envyGames !== b.envyGames) return a.envyGames - b.envyGames;

        // 4. Total MySekai Score (Descending)
        if (a.totalMySekaiScore !== b.totalMySekaiScore) return b.totalMySekaiScore - a.totalMySekaiScore;

        // 5. Diversity
        return b.diversityScore - a.diversityScore;
    });

    return scored;
};
