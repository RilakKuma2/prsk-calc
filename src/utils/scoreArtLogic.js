
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
export const generateOptions = (csvData, maxBonus, zeroScoreOnly, maxPower = null, maxEnvyScore = null) => {
    const envyOptions = [];
    const mySekaiOptions = [];

    // Calculate Envy Score Limit (default 100 -> 1,000,000)
    const envyScoreLimit = (maxEnvyScore && !isNaN(maxEnvyScore)) ? maxEnvyScore * 10000 : 1000000;

    // 1. Envy Options
    for (const [baseEP, details] of csvData.entries()) {
        // Filter sub-details by bonus and MAX SCORE limit (using minScore to include the bracket)
        const validDetails = details.filter(d =>
            d.bonus <= maxBonus &&
            d.bonus >= 25 && // Min bonus 40%
            d.minScore <= envyScoreLimit && // Use minScore for the limit
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
    // Determine user's power index if maxPower is provided
    let userPowerIdx = -1;
    if (maxPower !== null && !isNaN(maxPower)) {
        // Find the highest index where MY_SEKAI_POWERS[i] <= maxPower
        for (let i = MY_SEKAI_POWERS.length - 1; i >= 0; i--) {
            if (MY_SEKAI_POWERS[i] <= maxPower) {
                userPowerIdx = i;
                break;
            }
        }
    }

    // First pass: Collect all achievable options
    const allAchievableOptions = [];

    for (const [ptStr, reqMults] of Object.entries(MY_SEKAI_REQ_MULTIPLIERS)) {
        const pt = parseInt(ptStr, 10);

        // Filter: Only >= 2500
        if (pt < 2500) continue;

        let achievable = false;
        const validReqs = [];

        if (userPowerIdx !== -1) {
            // User specified Max Power: ONLY check that specific power index
            const reqMult = reqMults[userPowerIdx];
            if (reqMult !== null && reqMult <= maxBonus) {
                achievable = true;
                validReqs.push({
                    powerIdx: userPowerIdx,
                    reqMult: reqMult
                });
            }
        } else {
            // No Max Power specified: Check ALL power indices (Existing Logic)
            for (let i = 0; i < MY_SEKAI_POWERS.length; i++) {
                if (reqMults[i] !== null && reqMults[i] <= maxBonus) {
                    achievable = true;
                    validReqs.push({
                        powerIdx: i,
                        reqMult: reqMults[i]
                    });
                }
            }
        }

        if (achievable) {
            allAchievableOptions.push({
                ep: pt,
                type: 'mysekai',
                mySekaiDetails: [{
                    pt,
                    validReqs
                }]
            });
        }
    }

    // If Max Power is specified, filter to ONLY the highest achievable point
    if (userPowerIdx !== -1 && allAchievableOptions.length > 0) {
        // Sort descending by EP
        allAchievableOptions.sort((a, b) => b.ep - a.ep);
        // Take only the highest EP option
        const maxEpOption = allAchievableOptions[0];
        mySekaiOptions.push(maxEpOption);
    } else {
        // Otherwise, use all achievable options
        mySekaiOptions.push(...allAchievableOptions);
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

    // Prepare initial options
    let initialEnvyOptions = [];
    if (allowNonMod5) {
        initialEnvyOptions = [...envyOptions];
    } else {
        initialEnvyOptions = filterEnvyMod5(envyOptions);
    }

    // Internal solver function
    const runSolver = (currentEnvyOptions) => {
        const solutions = [];
        const maxSolutions = 100; // Find top 100 for this iteration

        // 1. DFS Setup
        const memoEnvy = new Map();
        const findEnvyCombinations = (target) => {
            if (target === 0) return [[]];
            if (target < 0) return [];
            if (memoEnvy.has(target)) return memoEnvy.get(target);

            const results = [];
            const maxResults = 200; // Sufficient depth

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

                            if (solutions.length >= maxSolutions) break;
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

    // Iterative Ban-and-Search
    const finalSolutions = [];
    const diversityCounts = new Map();
    const bannedEnvyEps = new Set();
    const MAX_PER_TYPE = 20;
    const TARGET_TOTAL = 100;

    for (let iter = 0; iter < 10; iter++) {
        // Filter options: Exclude banned Envy EPs
        const iterOptions = initialEnvyOptions.filter(opt => !bannedEnvyEps.has(opt.ep));

        if (iterOptions.length === 0 && initialEnvyOptions.length > 0) break;

        // Run solver with filtered options
        const newSolutions = runSolver(iterOptions);

        if (newSolutions.length === 0) break;

        let addedCount = 0;
        for (const sol of newSolutions) {
            // Find max Envy EP in this solution
            let maxEnvyEp = 0;
            for (const item of sol) {
                if (item.type === 'envy' && item.ep > maxEnvyEp) maxEnvyEp = item.ep;
            }

            const count = diversityCounts.get(maxEnvyEp) || 0;
            if (count < MAX_PER_TYPE) {
                finalSolutions.push(sol);
                diversityCounts.set(maxEnvyEp, count + 1);
                addedCount++;
            } else {
                // Saturated: Ban this Envy EP for next iterations
                bannedEnvyEps.add(maxEnvyEp);
            }
        }

        if (finalSolutions.length >= TARGET_TOTAL) break;
        if (addedCount === 0 && bannedEnvyEps.size > 0) {
            // If we didn't add anything but have bans, it means the top results were ALL banned types.
            // The loop will naturally continue with bans in place, forcing new results next time.
            // But if we truly made NO progress and have nothing else to ban (or everything is banned), we stop.
            // For now, let's just continue.
        }
    }

    return finalSolutions;
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

    // Find the maximum MySekai score to establish the "High Score Tier"
    const maxMySekaiScore = Math.max(...scored.map(s => s.totalMySekaiScore));
    const SCORE_THRESHOLD = 2000;

    scored.sort((a, b) => {
        // 1. All Envy Mod 5 Priority (True > False) - ONLY if not allowed non-mod 5 explicitly
        if (!allowNonMod5) {
            if (a.isAllEnvyMod5 !== b.isAllEnvyMod5) return b.isAllEnvyMod5 - a.isAllEnvyMod5;
        }

        // Determine Tiers
        // Tier 1: Score is within 2000 points of the Max Score
        // Tier 2: Score is lower than that
        const aIsTier1 = a.totalMySekaiScore >= (maxMySekaiScore - SCORE_THRESHOLD);
        const bIsTier1 = b.totalMySekaiScore >= (maxMySekaiScore - SCORE_THRESHOLD);

        if (aIsTier1 && bIsTier1) {
            // Both in Tier 1: Prioritize Efficiency (Less MySekai Games)
            if (a.mySekaiGames !== b.mySekaiGames) return a.mySekaiGames - b.mySekaiGames;
            // If games equal, higher score wins
            return b.totalMySekaiScore - a.totalMySekaiScore;
        }

        if (aIsTier1 !== bIsTier1) {
            // Tier 1 wins over Tier 2
            return bIsTier1 - aIsTier1;
        }

        // Both in Tier 2: Prioritize Higher Score
        if (a.totalMySekaiScore !== b.totalMySekaiScore) return b.totalMySekaiScore - a.totalMySekaiScore;

        // Fallbacks
        if (a.totalFire !== b.totalFire) return a.totalFire - b.totalFire;
        if (a.envyGames !== b.envyGames) return a.envyGames - b.envyGames;
        return b.diversityScore - a.diversityScore;
    });

    return scored;
};
