import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { BASIC_PASS_REWARDS, PREMIUM_PASS_REWARDS } from '../../data/passRewards'; // Import data
import { InputTableWrapper, InputRow } from '../common/InputComponents';

const CrystalCalculator = ({ surveyData, setSurveyData }) => {
    const { t } = useTranslation();

    // Tooltip state
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef(null);

    // Close tooltip on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setShowTooltip(false);
            }
        };
        if (showTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTooltip]);

    // Inputs
    const [currentTotal, setCurrentTotal] = useState(surveyData.crystalCurrentTotal || '');
    const [currentPaid, setCurrentPaid] = useState(surveyData.crystalCurrentPaid || '');
    const [passPoints, setPassPoints] = useState(surveyData.crystalPassPoints || 0);
    const [passRenewalDate, setPassRenewalDate] = useState(surveyData.crystalPassRenewalDate || 1); // New State: 1-31
    const [worldPassRenewalDate, setWorldPassRenewalDate] = useState(surveyData.crystalWorldPassRenewalDate || 1); // World Pass Renewal

    // Detailed Monthly Settings
    const [settings, setSettings] = useState(surveyData.crystalSettings || {
        // Passes
        premiumPass: false, // +1850 Paid, +5000 Free
        colorfulPass: false, // +2760 Paid, +3000 Free (프레셔스)
        deluxePass: false, // +1380 Paid, +1500 Free (디럭스)
        basicPass: false, // +440 Paid, +750 Free (베이직)
        mySekaiPass: false, // +1850 Paid
        worldPass: false, // +1380 Paid
        // Bonuses
        masterMission: false, // +700 Free
        challengeBonus: false, // +400 Free
        passMission: false, // +300 Free
        adBonus: false, // +440 Free (approx)
        // Paid Gacha
        selectGacha: false, // -3000 Paid in months 2, 5, 8, 11
        happinessGacha: false, // -3000 Paid in months 1, 4, 7, 10
        // Monthly paid purchases
        halfPriceCount: 0, // -1500 Paid per count per month
        annuityCount: 0 // -2000 Paid per count per month
    });

    // Gacha Plan - 3 slots per month: early (1-10일), mid (11-20일), late (21-말일)
    // Each slot: { enabled: bool, type: '1ceiling'|'2ceiling'|'birthday', halfPrice: bool, annuity: bool }
    const [gachaPlan, setGachaPlan] = useState(surveyData.crystalGachaPlan || {});
    const [usePaidWhenLow, setUsePaidWhenLow] = useState(surveyData.crystalUsePaidWhenLow === true); // Default false

    // Event Data State
    const [eventData, setEventData] = useState(null);

    // Fetch Event Data
    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const response = await fetch('https://api.rilaksekai.com/api/ranking');
                const data = await response.json();
                if (data && data.latest_event) {
                    setEventData(data.latest_event);
                }
            } catch (error) {
                console.error("Failed to fetch event data:", error);
            }
        };
        fetchEventData();
    }, []);

    // Gacha popup state
    const [gachaPopup, setGachaPopup] = useState({ open: false, index: null });
    const [typeDropdown, setTypeDropdown] = useState({ monthIndex: null, slotIndex: null }); // For custom dropdown
    const [countDropdown, setCountDropdown] = useState({ type: null }); // For half-price/annuity count dropdowns
    const gachaPopupRef = useRef(null);

    // Maximum slots per month
    const MAX_SLOTS = 3;

    // Close gacha popup on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (gachaPopupRef.current && !gachaPopupRef.current.contains(event.target)) {
                setGachaPopup({ open: false, index: null });
            }
        };
        if (gachaPopup.open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [gachaPopup.open]);

    useEffect(() => {
        setSurveyData({
            ...surveyData,
            crystalCurrentTotal: currentTotal,
            crystalCurrentPaid: currentPaid,
            crystalSettings: settings,
            crystalGachaPlan: gachaPlan,
            crystalPassPoints: passPoints,
            crystalPassRenewalDate: passRenewalDate,
            crystalWorldPassRenewalDate: worldPassRenewalDate,
            crystalUsePaidWhenLow: usePaidWhenLow
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTotal, currentPaid, settings, gachaPlan, passPoints, passRenewalDate, worldPassRenewalDate, usePaidWhenLow]);

    const handleSettingChange = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper to handle mutually exclusive Pass selection
    const handlePassChange = (type) => {
        setSettings(prev => ({
            ...prev,
            basicPass: type === 'basic',
            deluxePass: type === 'deluxe',
            colorfulPass: type === 'precious', // Precious maps to colorfulPass logic
        }));
    };

    // Helper to handle mutually exclusive Premium/MySekai selection
    const handlePremierPassChange = (type) => {
        setSettings(prev => ({
            ...prev,
            premiumPass: type === 'premium' || type === 'combo',
            mySekaiPass: type === 'mysekai' || type === 'combo',
        }));
    };

    // Get slots array for a month (returns array of slot configs)
    const getMonthSlots = (monthIndex) => {
        const monthData = gachaPlan[monthIndex];
        if (!monthData || !monthData.slots) {
            return [];
        }
        return monthData.slots;
    };

    // Add a new slot to month
    const addSlot = (monthIndex) => {
        const currentSlots = getMonthSlots(monthIndex);
        if (currentSlots.length >= MAX_SLOTS) return;

        const newSlot = { type: '1ceiling', halfPrice: false, annuity: false };
        setGachaPlan(prev => ({
            ...prev,
            [monthIndex]: {
                ...prev[monthIndex],
                slots: [...currentSlots, newSlot]
            }
        }));
    };

    // Remove a slot from month
    const removeSlot = (monthIndex, slotIndex) => {
        const currentSlots = getMonthSlots(monthIndex);
        const newSlots = currentSlots.filter((_, i) => i !== slotIndex);
        setGachaPlan(prev => ({
            ...prev,
            [monthIndex]: {
                ...prev[monthIndex],
                slots: newSlots
            }
        }));
    };

    // Update a specific slot
    const updateSlot = (monthIndex, slotIndex, updates) => {
        const currentSlots = getMonthSlots(monthIndex);
        const newSlots = currentSlots.map((slot, i) =>
            i === slotIndex ? { ...slot, ...updates } : slot
        );
        setGachaPlan(prev => ({
            ...prev,
            [monthIndex]: {
                ...prev[monthIndex],
                slots: newSlots
            }
        }));
    };

    // Calculate gacha cost for a single slot
    const calculateSlotCost = (config) => {
        if (!config) return { freeCost: 0, paidCost: 0 };

        let freeCost = 0;
        let paidCost = 0;

        // Determine base cost by type
        if (config.type === 'custom') {
            // Custom type: use customAmount and customIsPaid
            const amount = config.customAmount || 0;
            if (config.customIsPaid) {
                paidCost = amount;
            } else {
                freeCost = amount;
            }
        } else if (config.type === 'birthday') {
            freeCost = 15000; // Birthday card is free crystals only
            paidCost = 0;
        } else {
            const ceilings = config.type === '2ceiling' ? 2 : 1;
            const baseCeilingCost = 60000;

            for (let i = 0; i < ceilings; i++) {
                let thisCeilingFree = baseCeilingCost;
                let thisCeilingPaid = 0;

                // Half price: free -3000, paid +1500
                if (config.halfPrice) {
                    thisCeilingFree -= 3000;
                    thisCeilingPaid += 1500;
                }

                // Annuity: free -6000, paid +2000
                if (config.annuity) {
                    thisCeilingFree -= 6000;
                    thisCeilingPaid += 2000;
                }

                freeCost += thisCeilingFree;
                paidCost += thisCeilingPaid;
            }
        }

        return { freeCost, paidCost };
    };

    // Calculate total gacha cost for a month
    const calculateMonthGachaCost = (monthIndex) => {
        const slots = getMonthSlots(monthIndex);
        let totalFreeCost = 0;
        let totalPaidCost = 0;

        for (const slot of slots) {
            const { freeCost, paidCost } = calculateSlotCost(slot);
            totalFreeCost += freeCost;
            totalPaidCost += paidCost;
        }

        return { freeCost: totalFreeCost, paidCost: totalPaidCost };
    };

    // Check if any slot exists for a month
    const hasAnyGacha = (monthIndex) => {
        return getMonthSlots(monthIndex).length > 0;
    };

    // Constants - Monthly Free Crystals breakdown
    const MONTHLY_FREE = {
        attendance: 50 * 30, // 출석체크 50개 × 30일 = 1500
        challengeLive: 20 * 30, // 챌린지 라이브 20개 × 30일 = 600
        basicPass: 500, // 패스 기본
        premiumPassBonus: 5000, // 프리미엄 패스 추가
        // 이벤트 보상 (1회당)
        eventRewardsPerEvent: {
            eventPoints: 450, // 이벤스
            exchange: 500, // 교환소
            ranking: 500, // 랭킹
            sideStory: 150, // 사이드
            virtualLive: 300, // 버라
            mission: 70, // 미션
            area: 40 // 에어리어
        },
        eventsPerMonth: 3, // 월 3회 이벤트
        // 신곡 보상
        songRewardsPerSong: {
            sRank: 110, // S랭
            hard: 50, // 하드
            expert: 70, // 익스
            master: 70 // 마스터 (masterMission 켜면 추가)
        },
        newSongsPerMonth: 10, // 월 10곡
        broadcast: 500 // 공식 방송/리트윗
    };

    // Calculate derived values
    const EVENT_REWARDS_PER_EVENT = Object.values(MONTHLY_FREE.eventRewardsPerEvent).reduce((a, b) => a + b, 0);
    const EVENT_REWARDS_TOTAL = EVENT_REWARDS_PER_EVENT * MONTHLY_FREE.eventsPerMonth;
    // Song rewards: base (S랭+하드+익스) + master if enabled
    const BASE_SONG_REWARDS_PER_SONG = MONTHLY_FREE.songRewardsPerSong.sRank + MONTHLY_FREE.songRewardsPerSong.hard + MONTHLY_FREE.songRewardsPerSong.expert;
    const SONG_REWARDS_PER_SONG = settings.masterMission
        ? BASE_SONG_REWARDS_PER_SONG + MONTHLY_FREE.songRewardsPerSong.master
        : BASE_SONG_REWARDS_PER_SONG;
    const SONG_REWARDS_TOTAL = SONG_REWARDS_PER_SONG * MONTHLY_FREE.newSongsPerMonth;

    const BASE_FREE_GAIN = MONTHLY_FREE.attendance + MONTHLY_FREE.challengeLive + MONTHLY_FREE.basicPass + EVENT_REWARDS_TOTAL + SONG_REWARDS_TOTAL + MONTHLY_FREE.broadcast;

    // Helper: Count remaining specific weekdays (e.g. Sunday = 0)
    const countRemainingWeekdays = (year, month, currentDay, targetDay) => {
        let count = 0;
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let d = currentDay; d <= daysInMonth; d++) {
            if (new Date(year, month - 1, d).getDay() === targetDay) {
                count++;
            }
        }
        return count;
    };

    // Helper: Calculate income for the current specific month (partial) - Targeting Limited Event End
    const calculateCurrentMonthIncome = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();

        let targetDay = 10; // Default: Limited event ends around 10th
        let useApiForEnd = false;

        // Determine Target Day (End of Limited Event)
        if (eventData) {
            const startAt = new Date(eventData.startAt);
            const aggregateAt = new Date(eventData.aggregateAt);

            // Stale check (5 days)
            const isStale = (now > aggregateAt && (now - aggregateAt) > (5 * 24 * 60 * 60 * 1000));

            if (!isStale) {
                // Check if this event covers the 1st of the current month
                // Logic: Starts before or on Current Month 1st, Ends after Current Month 1st
                const currentMonthFirst = new Date(currentYear, currentMonth - 1, 1);

                if (startAt <= currentMonthFirst && aggregateAt >= currentMonthFirst) {
                    targetDay = aggregateAt.getDate();
                    useApiForEnd = true;
                }
            }
        }

        // Calculate Only Until Target Day
        // If today > targetDay, result is 0 (projection passed)
        const daysToCalculate = Math.max(0, targetDay - currentDay + 1);

        let free = 0;
        let paid = 0;

        // 1. Daily Login (50) & Challenge Live (20)
        free += (50 + 20) * daysToCalculate;

        // 2. Daily Passes (Paid 360/440/1000 part is monthly, daily is Free 25/50/100)
        if (settings.colorfulPass) free += 100 * daysToCalculate;
        if (settings.deluxePass) free += 50 * daysToCalculate;
        if (settings.basicPass) free += 25 * daysToCalculate;

        // Paid Crystals from Pass (Renewal Date Check)
        // If today < renewalDate, we assume logic: payment hasn't happened yet this month? 
        // Or if we purchased, we get Paid Crystals instantly.
        // Logic: Add Paid Crystal lump sum ONLY if currentDay < passRenewalDate
        // (Assuming if day >= renewal, we already got it or already updated our current balance logic?? 
        // Actually usually calculators assume "future income". If today >= renewal, this month's renewal passed.
        // So we only add if today < renewal.)

        if (currentDay < passRenewalDate) {
            if (settings.colorfulPass) paid += 3060; // Precious (Colorful)
            if (settings.deluxePass) paid += 1530; // Deluxe
            if (settings.basicPass) paid += 360;  // Basic
        }

        if (settings.worldPass && currentDay < worldPassRenewalDate) {
            paid += 1380; // World Pass Paid
        }

        // 3. Challenge Live Weekly Bonus (Sunday)
        // Count Sundays between currentDay and targetDay
        let sundayCount = 0;
        // Only count if valid range
        if (daysToCalculate > 0) {
            for (let d = currentDay; d <= targetDay; d++) {
                if (new Date(currentYear, currentMonth - 1, d).getDay() === 0) sundayCount++;
            }
        }

        if (settings.challengeBonus) {
            free += 100 * sundayCount;
        }

        // 4. Event End Reward
        // If we represent the period correctly, we assume user gets the end reward at targetDay.
        // Include if today <= targetDay
        if (currentDay <= targetDay) {
            // Reward: 300 (Base) + 100 (Pass)
            // If API used, maybe 370? User mentioned "370 end" in previous turn, but "300" in this turn ("Event end 300 crystal").
            // Previous prompt: "370 end". 
            // Let's stick to API data if available (370?), or generic 300.
            // Actually, recent PROSEKA standard is 370 for rankings? Or 500?
            // User said: "event end 370 (if pass checked 470)".
            // So default 370.

            const endReward = useApiForEnd ? 370 : 300; // API usually accurate, fallback 300
            free += endReward;

            if (settings.passMission) {
                free += 100;
            }
        }

        // 5. New Songs (1 every 3 days)
        const newSongs = Math.floor(daysToCalculate / 3);
        free += newSongs * 230;

        // Mission Pass (Dynamic Calculation based on Points)
        // Basic
        const remainingBasic = BASIC_PASS_REWARDS
            .filter(r => r.point > passPoints)
            .reduce((sum, r) => sum + r.crystals, 0);
        free += remainingBasic;

        // Premium
        if (settings.premiumPass) {
            const remainingPremium = PREMIUM_PASS_REWARDS
                .filter(r => r.point > passPoints)
                .reduce((sum, r) => sum + r.crystals, 0);
            free += remainingPremium;
        }

        // Master Mission (700) - Proportional to 10 days? 
        // User didn't specify, but previously implicitly accepted proportional.
        // 700 * (10/30) is small. Let's keep proportional to daysToCalculate.
        if (settings.masterMission) {
            // Base on full month length for ratio
            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
            free += Math.round(700 * (daysToCalculate / daysInMonth));
        }

        // Ad Bonus (14.5 per day)
        if (settings.adBonus) {
            // Exact calculation for remaining days
            free += Math.round(14.5 * daysToCalculate);
        }

        return { free, paid };
    };
    const CEILING_COST = 60000;

    // Calculation
    const calculateProjection = () => {
        const projections = [];
        let runningTotal = parseInt(currentTotal || 0);
        let runningPaid = parseInt(currentPaid || 0);

        const now = new Date();
        let currentMonth = now.getMonth() + 1; // 1-12
        let currentYear = now.getFullYear();

        // Calculate Monthly Income based on settings
        // Base monthly paid (fixed)
        let monthlyPaid = 0;

        // Passes
        if (settings.premiumPass) {
            monthlyPaid += 1850;
        }
        if (settings.colorfulPass) {
            monthlyPaid += 2760;
        }
        if (settings.deluxePass) {
            monthlyPaid += 1380;
        }
        if (settings.basicPass) {
            monthlyPaid += 440;
        }
        if (settings.mySekaiPass) {
            monthlyPaid += 1850;
        }
        if (settings.worldPass) {
            monthlyPaid += 1380;
        }

        // Helper: Get days in a month
        const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

        // Helper: Count Sundays in a month
        const getSundaysInMonth = (year, month) => {
            let count = 0;
            const daysInMonth = getDaysInMonth(year, month);
            for (let d = 1; d <= daysInMonth; d++) {
                if (new Date(year, month - 1, d).getDay() === 0) count++;
            }
            return count;
        };

        // Helper: Calculate monthly free for a specific month
        const getMonthlyFreeForMonth = (year, month) => {
            const daysInMonth = getDaysInMonth(year, month);
            const sundaysInMonth = getSundaysInMonth(year, month);

            // Daily-based rewards (adjusted by actual days in month)
            const attendanceForMonth = 50 * daysInMonth;
            const challengeLiveForMonth = 20 * daysInMonth;

            // Fixed monthly rewards
            const basicPassCrystals = MONTHLY_FREE.basicPass;
            const premiumBonus = settings.premiumPass ? MONTHLY_FREE.premiumPassBonus : 0;

            let monthFree = attendanceForMonth + challengeLiveForMonth + basicPassCrystals + premiumBonus
                + EVENT_REWARDS_TOTAL + SONG_REWARDS_TOTAL + MONTHLY_FREE.broadcast;

            // Colorful pass free crystals (3000)
            if (settings.colorfulPass) monthFree += 3000;
            if (settings.deluxePass) monthFree += 1500;
            if (settings.basicPass) monthFree += 750;

            // Bonuses (masterMission is already included in SONG_REWARDS_TOTAL)
            // Challenge bonus: 100 × 4.3주 = 430
            if (settings.challengeBonus) monthFree += 430;
            if (settings.passMission) monthFree += 300;
            if (settings.adBonus) monthFree += Math.round(14.5 * daysInMonth);

            return monthFree;
        };

        for (let i = 0; i < 12; i++) {
            let month = currentMonth + i;
            let year = currentYear;
            if (month > 12) {
                month -= 12;
                year += 1;
            }

            // Calculate Monthly Income
            if (i === 0) {
                // Current Month - Specific Calculation
                const current = calculateCurrentMonthIncome();

                // Add Monthly Lump Sums (Paid) + Detailed Free
                runningTotal += current.free;
                runningTotal += monthlyPaid;
                runningPaid += monthlyPaid;

            } else {  // Future Months - Calculate based on actual days in that month
                const monthlyFree = getMonthlyFreeForMonth(year, month);
                runningTotal += monthlyFree + monthlyPaid;
                runningPaid += monthlyPaid;
            }

            // Subtract Gacha with new slot-based calculation
            const { freeCost, paidCost } = calculateMonthGachaCost(i);
            const hasGacha = hasAnyGacha(i);

            let currentMonthPaidUsage = 0; // Track total paid usage for display

            if (hasGacha) {
                let freeAvailable = runningTotal - runningPaid;

                // Apply paid cost change first (SUBTRACT, don't add)
                runningPaid -= paidCost;
                runningTotal -= paidCost;
                currentMonthPaidUsage += paidCost;

                // Then apply free cost
                if (usePaidWhenLow) {
                    // Use paid crystals when free is insufficient
                    if (freeAvailable >= freeCost) {
                        runningTotal -= freeCost;
                    } else {
                        // Not enough free, use paid
                        let remainingCost = freeCost - freeAvailable;
                        runningTotal -= freeAvailable; // Free becomes 0 (effectively)

                        // Remaining cost comes from paid
                        runningPaid -= remainingCost;
                        runningTotal -= remainingCost;
                        currentMonthPaidUsage += remainingCost;
                    }
                } else {
                    // Keep free and paid separate (free can go negative)
                    runningTotal -= freeCost;
                }
            }

            // Apply paid gacha costs (Select: 2,5,8,11 / Happiness: 1,4,7,10)
            const selectMonths = [2, 5, 8, 11];
            const happinessMonths = [1, 4, 7, 10];

            if (settings.selectGacha && selectMonths.includes(month)) {
                runningPaid -= 3000;
                runningTotal -= 3000;
                currentMonthPaidUsage += 3000;
            }
            if (settings.happinessGacha && happinessMonths.includes(month)) {
                runningPaid -= 3000;
                runningTotal -= 3000;
                currentMonthPaidUsage += 3000;
            }

            // Apply monthly half-price and annuity purchases
            const halfPriceCost = (settings.halfPriceCount || 0) * 1500;
            const annuityCost = (settings.annuityCount || 0) * 2000;
            runningPaid -= halfPriceCost + annuityCost;
            runningTotal -= halfPriceCost + annuityCost;
            currentMonthPaidUsage += halfPriceCost + annuityCost;

            projections.push({
                index: i,
                year,
                month,
                total: runningTotal,
                paid: runningPaid,
                free: runningTotal - runningPaid,
                hasGacha,
                gachaCost: { freeCost, paidCost },
                paidUsage: currentMonthPaidUsage // Pass to render
            });
        }
        // Calculate display monthly income based on current month (30 days baseline)
        const displayMonthlyFree = getMonthlyFreeForMonth(currentYear, currentMonth);
        // Return projection plus the calculated monthly income for display
        return { projections, monthlyIncome: { free: displayMonthlyFree, paid: monthlyPaid } };
    };

    const { projections, monthlyIncome } = calculateProjection();

    // Current month info for tooltip display
    const currentMonthInfo = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        let sundaysInMonth = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            if (new Date(year, month - 1, d).getDay() === 0) sundaysInMonth++;
        }
        return { daysInMonth, sundaysInMonth };
    })();
    // Format month gacha cost display
    const formatMonthGachaCost = (monthIndex) => {
        const { freeCost, paidCost } = calculateMonthGachaCost(monthIndex);
        if (freeCost === 0 && paidCost === 0) return null;

        let text = "- " + freeCost.toLocaleString() + " ";
        if (paidCost !== 0) {
            const sign = paidCost > 0 ? '+' : '';
            text += " (" + sign + paidCost.toLocaleString() + " " + t('gacha.paid') + ")";
        }
        return text;
    };

    return (
        <div className="p-4 space-y-6">
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                <InputTableWrapper>
                    <InputRow
                        label={t('gacha.current_total')}
                        value={currentTotal}
                        onChange={(e) => setCurrentTotal(e.target.value)}
                        placeholder="0"
                    />
                    <InputRow
                        label={t('gacha.current_paid')}
                        value={currentPaid}
                        onChange={(e) => setCurrentPaid(e.target.value)}
                        placeholder="0"
                    />
                    <InputRow
                        label={t('gacha.current_pass_points')}
                        value={passPoints}
                        onChange={(e) => setPassPoints(Number(e.target.value))}
                        placeholder="0"
                    />
                </InputTableWrapper>

                <div className="border-t pt-2 space-y-3">
                    <label className="text-xs font-bold text-gray-500 block">{t('gacha.monthly_settings')}</label>

                    {/* Pass Group - Purple */}
                    <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-3">
                        <label className="text-xs font-bold text-purple-600 block mb-2">{t('gacha.pass_group')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {/* Premium / MySekai Selection */}
                            <div className="col-span-2 mb-2">
                                <div className="flex gap-1">
                                    {/* None */}
                                    <button
                                        onClick={() => handlePremierPassChange('none')}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${(!settings.premiumPass && !settings.mySekaiPass)
                                            ? 'bg-gray-600 text-white border-gray-600'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.pass_none')}
                                    </button>
                                    {/* Premium */}
                                    <button
                                        onClick={() => handlePremierPassChange('premium')}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${(settings.premiumPass && !settings.mySekaiPass)
                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.premium_pass_short', '프패')}
                                    </button>
                                    {/* Premium + MySekai */}
                                    <button
                                        onClick={() => handlePremierPassChange('combo')}
                                        className={`flex-[1.5] py-1 text-[11px] font-bold rounded border transition-colors ${(settings.premiumPass && settings.mySekaiPass)
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.premium_mysekai_short', '프패+마셐패스')}
                                    </button>
                                </div>
                            </div>

                            {/* Colorful Pass Selection */}
                            <div className="col-span-2 mt-2 pt-2 border-t border-purple-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-purple-700 font-bold">{t('gacha.colorful_pass')}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>{t('gacha.receival_date')}</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={passRenewalDate}
                                            onChange={(e) => {
                                                const val = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                                                setPassRenewalDate(val);
                                            }}
                                            className="w-12 px-1 py-0.5 border rounded text-right"
                                            placeholder="1"
                                        />
                                        <span>일</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {/* None */}
                                    <button
                                        onClick={() => handlePassChange('none')}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${(!settings.basicPass && !settings.deluxePass && !settings.colorfulPass)
                                            ? 'bg-gray-600 text-white border-gray-600'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.pass_none')}
                                    </button>
                                    {/* Basic */}
                                    <button
                                        onClick={() => handlePassChange('basic')}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${settings.basicPass
                                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.basic_pass_short', '베이직')}
                                    </button>
                                    {/* Deluxe */}
                                    <button
                                        onClick={() => handlePassChange('deluxe')}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${settings.deluxePass
                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.deluxe_pass_short', '디럭스')}
                                    </button>
                                    {/* Precious */}
                                    <button
                                        onClick={() => handlePassChange('precious')}
                                        className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${settings.colorfulPass
                                            ? 'bg-pink-100 text-pink-700 border-pink-300'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t('gacha.colorful_pass_short', '프레셔스')}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* World Pass */}
                        <div className="col-span-2 mt-2 pt-2 border-t border-purple-100 flex items-center gap-2">
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, worldPass: !prev.worldPass }))}
                                className={`flex-grow py-1 text-[11px] font-bold rounded border transition-colors ${settings.worldPass
                                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {t('gacha.world_pass_short', '월드 패스')}
                            </button>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap">
                                <span>{t('gacha.receival_date')}</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={worldPassRenewalDate}
                                    onChange={(e) => {
                                        const val = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                                        setWorldPassRenewalDate(val);
                                    }}
                                    className="w-10 px-1 py-0.5 border rounded text-right"
                                    placeholder="1"
                                />
                                <span>일</span>
                            </div>
                        </div>
                        {/* Paid Gacha - Select & Happiness */}
                        <div className="col-span-2 mt-2 pt-2 border-t border-purple-100">
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-[10px] text-gray-500">{t('gacha.paid_gacha')}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSettings(prev => ({ ...prev, selectGacha: !prev.selectGacha }))}
                                    className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${settings.selectGacha
                                        ? 'bg-pink-100 text-pink-700 border-pink-300'
                                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {t('gacha.select_gacha')}
                                </button>
                                <button
                                    onClick={() => setSettings(prev => ({ ...prev, happinessGacha: !prev.happinessGacha }))}
                                    className={`flex-1 py-1 text-[11px] font-bold rounded border transition-colors ${settings.happinessGacha
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {t('gacha.happiness_gacha')}
                                </button>
                            </div>
                        </div>
                        {/* Half-price & Annuity Count Row */}
                        <div className="col-span-2 mt-2 pt-2 border-t border-purple-100">
                            <div className="flex items-center justify-center gap-3">
                                {/* Half-price */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-gray-600 font-medium">{t('gacha.half_price_short')}</span>
                                    <div className="relative">
                                        <button
                                            onClick={() => setCountDropdown(prev => prev.type === 'halfPrice' ? { type: null } : { type: 'halfPrice' })}
                                            className="h-6 px-2 text-[11px] font-medium rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 min-w-[32px]"
                                        >
                                            {settings.halfPriceCount || 0}
                                        </button>
                                        {countDropdown.type === 'halfPrice' && (
                                            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                                {[0, 1, 2, 3, 4, 5].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => {
                                                            setSettings(prev => ({ ...prev, halfPriceCount: num }));
                                                            setCountDropdown({ type: null });
                                                        }}
                                                        className={`w-full px-3 py-1 text-[11px] hover:bg-gray-50 ${settings.halfPriceCount === num ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'}`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400">개</span>
                                </div>
                                {/* Annuity */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-gray-600 font-medium">{t('gacha.annuity_short')}</span>
                                    <div className="relative">
                                        <button
                                            onClick={() => setCountDropdown(prev => prev.type === 'annuity' ? { type: null } : { type: 'annuity' })}
                                            className="h-6 px-2 text-[11px] font-medium rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 min-w-[32px]"
                                        >
                                            {settings.annuityCount || 0}
                                        </button>
                                        {countDropdown.type === 'annuity' && (
                                            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                                {[0, 1, 2, 3, 4, 5].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => {
                                                            setSettings(prev => ({ ...prev, annuityCount: num }));
                                                            setCountDropdown({ type: null });
                                                        }}
                                                        className={`w-full px-3 py-1 text-[11px] hover:bg-gray-50 ${settings.annuityCount === num ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'}`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400">개</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bonus Group - Cyan */}
                <div className="border-2 border-cyan-200 bg-cyan-50 rounded-lg p-3">
                    <label className="text-xs font-bold text-cyan-600 block mb-2">{t('gacha.bonus_group', '무료돌')}</label>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Master Mission - Toggle Button */}
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, masterMission: !prev.masterMission }))}
                            className={`py-1 text-[11px] font-bold rounded border transition-colors ${settings.masterMission
                                ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {t('gacha.master_mission_short', '신곡 마스터 풀콤')}
                        </button>

                        {/* Challenge Bonus - Toggle Button */}
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, challengeBonus: !prev.challengeBonus }))}
                            className={`py-1 text-[11px] font-bold rounded border transition-colors ${settings.challengeBonus
                                ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {t('gacha.challenge_bonus_short', '챌라미션돌')}
                        </button>

                        {/* Pass Mission - Toggle Button */}
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, passMission: !prev.passMission }))}
                            className={`py-1 text-[11px] font-bold rounded border transition-colors ${settings.passMission
                                ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {t('gacha.pass_mission_short', '패스미션돌')}
                        </button>

                        {/* Ad Bonus - Toggle Button */}
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, adBonus: !prev.adBonus }))}
                            className={`py-1 text-[11px] font-bold rounded border transition-colors ${settings.adBonus
                                ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {t('gacha.ad_bonus_short', '광고돌')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-2 text-center text-sm relative">
                <span className="text-gray-600 flex items-center justify-center gap-1">
                    {t('gacha.total_crystals', '돌')}
                    <div className="relative inline-block" ref={tooltipRef}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                            onClick={() => setShowTooltip(!showTooltip)}
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>

                        {/* Tooltip */}
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-3 z-50 text-xs text-left ${showTooltip ? 'block' : 'hidden'} `}>
                            <h4 className="font-bold text-gray-800 mb-2 pb-1 border-b text-center">{t('gacha.breakdown.title')}</h4>

                            <div className="space-y-1.5 text-gray-600">
                                {/* Free Crystals - Calculate total from displayed items */}
                                {(() => {
                                    const now = new Date();
                                    const currentYear = now.getFullYear();
                                    const currentMonth = now.getMonth() + 1;
                                    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();

                                    // Count Sundays in current month
                                    let sundaysInMonth = 0;
                                    for (let d = 1; d <= daysInCurrentMonth; d++) {
                                        if (new Date(currentYear, currentMonth - 1, d).getDay() === 0) sundaysInMonth++;
                                    }

                                    // Calculate displayed total with correct days
                                    let displayTotal = 50 * daysInCurrentMonth; // attendance
                                    displayTotal += 20 * daysInCurrentMonth; // challenge live
                                    displayTotal += settings.premiumPass ? (MONTHLY_FREE.basicPass + MONTHLY_FREE.premiumPassBonus) : MONTHLY_FREE.basicPass;
                                    displayTotal += EVENT_REWARDS_TOTAL + SONG_REWARDS_TOTAL + MONTHLY_FREE.broadcast;
                                    // Pass bonuses
                                    if (settings.colorfulPass) displayTotal += 3000;
                                    if (settings.deluxePass) displayTotal += 1500;
                                    if (settings.basicPass) displayTotal += 750;
                                    // Other bonuses (masterMission already included in SONG_REWARDS_TOTAL)
                                    if (settings.challengeBonus) displayTotal += 430; // 100 × 4.3주
                                    if (settings.passMission) displayTotal += 300;
                                    if (settings.adBonus) displayTotal += Math.round(14.5 * daysInCurrentMonth);

                                    return (
                                        <div className="flex justify-between items-center bg-blue-50 p-1 rounded">
                                            <span className="font-bold text-blue-700">Total {t('gacha.free')}</span>
                                            <span className="font-bold text-blue-700">{displayTotal.toLocaleString()}</span>
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const now = new Date();
                                    const currentYear = now.getFullYear();
                                    const currentMonth = now.getMonth() + 1;
                                    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                                    const attendance = 50 * daysInMonth;
                                    const challengeLive = 20 * daysInMonth;

                                    return (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 px-1">
                                            <span>{t('gacha.breakdown.attendance')} <span className="text-[10px] text-gray-400">(50개 × {daysInMonth}일)</span></span>
                                            <span>{attendance.toLocaleString()}</span>

                                            <span>{t('gacha.breakdown.challenge_live')} <span className="text-[10px] text-gray-400">(20개 × {daysInMonth}일)</span></span>
                                            <span>{challengeLive.toLocaleString()}</span>

                                            <span>{t('gacha.breakdown.basic_pass')} <span className="text-[10px] text-gray-400">({settings.premiumPass ? t('gacha.breakdown.premium_pass_bonus') : MONTHLY_FREE.basicPass})</span></span>
                                            <span>{settings.premiumPass ? (MONTHLY_FREE.basicPass + MONTHLY_FREE.premiumPassBonus).toLocaleString() : MONTHLY_FREE.basicPass.toLocaleString()}</span>

                                            <div className="col-span-2 border-t border-gray-100 my-0.5"></div>

                                            <div className="flex flex-col">
                                                <span>{t('gacha.breakdown.event_rewards')} (×{MONTHLY_FREE.eventsPerMonth})</span>
                                                <span className="text-[10px] text-gray-400 pl-1">- {t('gacha.breakdown.event_detail_1')}</span>
                                                <span className="text-[10px] text-gray-400 pl-1">- {t('gacha.breakdown.event_detail_2')}</span>
                                                <span className="text-[10px] text-gray-400 pl-1">- {t('gacha.breakdown.event_detail_area')}</span>
                                            </div>
                                            <span>{EVENT_REWARDS_TOTAL.toLocaleString()}</span>

                                            <div className="col-span-2 border-t border-gray-100 my-0.5"></div>

                                            <div className="flex flex-col">
                                                <span>{t('gacha.breakdown.song_rewards')}</span>
                                                <span className="text-[10px] text-gray-400">- S랭({MONTHLY_FREE.songRewardsPerSong.sRank})+하드({MONTHLY_FREE.songRewardsPerSong.hard})+익스({MONTHLY_FREE.songRewardsPerSong.expert}){settings.masterMission ? `+마스터(${MONTHLY_FREE.songRewardsPerSong.master})` : ''} × {MONTHLY_FREE.newSongsPerMonth}곡</span>
                                            </div>
                                            <span>{SONG_REWARDS_TOTAL.toLocaleString()}</span>



                                            <span>{t('gacha.breakdown.broadcast')}</span>
                                            <span>{MONTHLY_FREE.broadcast.toLocaleString()}</span>
                                        </div>
                                    );
                                })()}

                                {/* Pass Free Crystals */}
                                {
                                    (settings.colorfulPass || settings.deluxePass || settings.basicPass) && (
                                        <>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 px-1">
                                                {settings.colorfulPass && (
                                                    <>
                                                        <span>{t('gacha.colorful_pass')} {t('gacha.free')}</span>
                                                        <span className="text-indigo-600">+3,000</span>
                                                    </>
                                                )}
                                                {settings.deluxePass && (
                                                    <>
                                                        <span>{t('gacha.deluxe_pass')} {t('gacha.free')}</span>
                                                        <span className="text-indigo-600">+1,500</span>
                                                    </>
                                                )}
                                                {settings.basicPass && (
                                                    <>
                                                        <span>{t('gacha.basic_pass')} {t('gacha.free')}</span>
                                                        <span className="text-indigo-600">+750</span>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )
                                }

                                {
                                    settings.challengeBonus && (
                                        <>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 px-1">
                                                <span>{t('gacha.breakdown.challenge_bonus')} <span className="text-[10px] text-gray-400">(100 × 4.3주)</span></span>
                                                <span className="text-indigo-600">+430</span>
                                            </div>
                                        </>
                                    )
                                }

                                {
                                    settings.passMission && (
                                        <>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 px-1">
                                                <span>{t('gacha.pass_mission')}</span>
                                                <span className="text-indigo-600">+300</span>
                                            </div>
                                        </>
                                    )
                                }

                                {
                                    settings.adBonus && (
                                        <>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 px-1">
                                                <span>{t('gacha.ad_bonus', '광고 보너스')} <span className="text-[10px] text-gray-400">(14.5(기댓값) × {currentMonthInfo.daysInMonth}일)</span></span>
                                                <span className="text-indigo-600">~{Math.round(14.5 * currentMonthInfo.daysInMonth).toLocaleString()}</span>
                                            </div>
                                        </>
                                    )
                                }

                                {/* Paid Crystals */}
                                {
                                    monthlyIncome.paid > 0 && (
                                        <>
                                            <div className="border-b border-gray-200 py-1 mb-1"></div>
                                            <div className="flex justify-between items-center bg-indigo-50 p-1 rounded">
                                                <span className="font-bold text-indigo-700">{t('gacha.breakdown.paid_pass')}</span>
                                                <span className="font-bold text-indigo-700">{monthlyIncome.paid.toLocaleString()}</span>
                                            </div>
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 px-1 text-gray-500">
                                                {settings.premiumPass && (
                                                    <>
                                                        <span>{t('gacha.premium_pass')}</span>
                                                        <span>1,850</span>
                                                    </>
                                                )}
                                                {settings.colorfulPass && (
                                                    <>
                                                        <span>{t('gacha.colorful_pass')}</span>
                                                        <span>2,760</span>
                                                    </>
                                                )}
                                                {settings.mySekaiPass && (
                                                    <>
                                                        <span>{t('gacha.mysekai_pass')}</span>
                                                        <span>1,850</span>
                                                    </>
                                                )}
                                                {settings.worldPass && (
                                                    <>
                                                        <span>{t('gacha.world_pass')}</span>
                                                        <span>1,380</span>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </span>
                <span className="font-bold text-blue-600">{t('gacha.free')} {monthlyIncome.free.toLocaleString()}</span>
                <span className="mx-1">/</span>
                <span className="font-bold text-indigo-600">{t('gacha.paid')} {monthlyIncome.paid.toLocaleString()}</span>
            </div >


            {/* Projection Table */}
            <div className="flex items-center justify-between px-1 mb-1 gap-2">
                <button
                    onClick={() => setUsePaidWhenLow(!usePaidWhenLow)}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-pre-line text-center leading-tight shrink-0 ${usePaidWhenLow
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                >
                    {t('gacha.use_paid_when_low')}
                </button>
                <div className="text-[10px] text-right leading-tight">
                    <div className="text-red-500 font-medium">{t('gacha.calc_note_warning')}</div>
                    <div className="text-red-500 font-medium">{t('gacha.calc_note_extra')}</div>
                </div>
            </div>
            <div className="overflow-visible rounded-xl shadow-sm border border-gray-100" >
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-3 py-2 min-w-[40px]">{t('gacha.month')}</th>
                            <th scope="col" className="px-3 py-2 text-center min-w-[70px]">{t('gacha.free')}</th>
                            <th scope="col" className="px-3 py-2 text-center min-w-[70px]">{t('gacha.paid')}</th>
                            <th scope="col" className="px-3 py-2 text-center min-w-[60px]">{t('gacha.gacha_plan')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projections.map((row) => (
                            <tr key={row.index} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {String(row.year).slice(-2)}/{String(row.month).padStart(2, '0')}
                                </td>
                                {/* Free Crystals Column */}
                                <td className="px-3 py-2 text-center align-top">
                                    <div className={`text-xs font-bold ${row.free < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {row.free.toLocaleString()}
                                    </div>
                                    {row.hasGacha && (() => {
                                        const { freeCost } = calculateMonthGachaCost(row.index);
                                        return (
                                            <div className="text-red-500 text-[10px] font-bold">
                                                -{freeCost.toLocaleString()}
                                            </div>
                                        );
                                    })()}
                                </td>
                                {/* Paid Crystals Column */}
                                <td className="px-3 py-2 text-center align-top">
                                    <div className={`text-xs font-bold ${row.paid < 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                                        {row.paid.toLocaleString()}
                                    </div>
                                    {row.paidUsage > 0 && (
                                        <div className="text-red-500 text-[10px] font-bold">
                                            -{row.paidUsage.toLocaleString()}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <div className="relative inline-block">
                                        <button
                                            onClick={() => setGachaPopup(prev =>
                                                (prev.open && prev.index === row.index)
                                                    ? { open: false, index: null }
                                                    : { open: true, index: row.index }
                                            )}
                                            className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${row.hasGacha
                                                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                } `}
                                        >
                                            {row.hasGacha ? t('gacha.gacha_on') : t('gacha.gacha_off')}
                                        </button>

                                        {/* Hover-style Popup (Below button, aligned to right edge) */}
                                        {gachaPopup.open && gachaPopup.index === row.index && (() => {
                                            const slots = getMonthSlots(row.index);
                                            const canAddMore = slots.length < MAX_SLOTS;

                                            return (
                                                <div
                                                    ref={gachaPopupRef}
                                                    className="absolute top-full right-0 mt-2 z-50 w-[230px] bg-white rounded-lg shadow-xl border border-gray-200 p-2 animate-fadeIn text-left flex flex-col gap-1.5"
                                                >
                                                    {/* Existing Slots */}
                                                    {slots.map((slot, slotIndex) => {
                                                        const isBirthday = slot.type === 'birthday';
                                                        return (
                                                            <div key={slotIndex} className="flex flex-col gap-1 p-1.5 bg-gray-50 rounded-lg">
                                                                {/* Row 1: Dropdown + Buttons + Delete */}
                                                                <div className="flex items-center gap-1">
                                                                    {/* Custom Type Dropdown */}
                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={() => setTypeDropdown(prev =>
                                                                                prev.monthIndex === row.index && prev.slotIndex === slotIndex
                                                                                    ? { monthIndex: null, slotIndex: null }
                                                                                    : { monthIndex: row.index, slotIndex }
                                                                            )}
                                                                            className="h-7 px-2 text-[11px] font-medium rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                                        >
                                                                            {slot.type === '1ceiling' ? t('gacha.type_1ceiling')
                                                                                : slot.type === '2ceiling' ? t('gacha.type_2ceiling')
                                                                                    : slot.type === 'birthday' ? t('gacha.birthday_card')
                                                                                        : t('gacha.type_custom')}
                                                                        </button>
                                                                        {/* Dropdown Menu */}
                                                                        {typeDropdown.monthIndex === row.index && typeDropdown.slotIndex === slotIndex && (
                                                                            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[80px]">
                                                                                {[
                                                                                    { value: '1ceiling', label: t('gacha.type_1ceiling') },
                                                                                    { value: '2ceiling', label: t('gacha.type_2ceiling') },
                                                                                    { value: 'birthday', label: t('gacha.birthday_card') },
                                                                                    { value: 'custom', label: t('gacha.type_custom') }
                                                                                ].map(option => (
                                                                                    <button
                                                                                        key={option.value}
                                                                                        onClick={() => {
                                                                                            if (option.value === 'birthday' || option.value === 'custom') {
                                                                                                updateSlot(row.index, slotIndex, { type: option.value, halfPrice: false, annuity: false });
                                                                                            } else {
                                                                                                updateSlot(row.index, slotIndex, { type: option.value });
                                                                                            }
                                                                                            setTypeDropdown({ monthIndex: null, slotIndex: null });
                                                                                        }}
                                                                                        className={`w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50 ${slot.type === option.value ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'}`}
                                                                                    >
                                                                                        {option.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Conditional Buttons based on type */}
                                                                    {slot.type === 'custom' ? (
                                                                        <>
                                                                            {/* Free/Paid Toggle for Custom */}
                                                                            <button
                                                                                onClick={() => updateSlot(row.index, slotIndex, { customIsPaid: false })}
                                                                                className={`h-7 px-2 text-[11px] font-bold rounded transition-colors ${!slot.customIsPaid
                                                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                                                                    }`}
                                                                            >
                                                                                {t('gacha.free')}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateSlot(row.index, slotIndex, { customIsPaid: true })}
                                                                                className={`h-7 px-2 text-[11px] font-bold rounded transition-colors ${slot.customIsPaid
                                                                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                                                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                                                                    }`}
                                                                            >
                                                                                {t('gacha.paid')}
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {/* Half Price Button */}
                                                                            <button
                                                                                onClick={() => !isBirthday && updateSlot(row.index, slotIndex, { halfPrice: !slot.halfPrice })}
                                                                                disabled={isBirthday}
                                                                                className={`h-7 px-2 text-[11px] font-bold rounded transition-colors shrink-0 ${isBirthday
                                                                                    ? 'bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed'
                                                                                    : slot.halfPrice
                                                                                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                                                                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                                                                    }`}
                                                                            >
                                                                                {t('gacha.half_price_short')}
                                                                            </button>

                                                                            {/* Annuity Button */}
                                                                            <button
                                                                                onClick={() => !isBirthday && updateSlot(row.index, slotIndex, { annuity: !slot.annuity })}
                                                                                disabled={isBirthday}
                                                                                className={`h-7 px-2 text-[11px] font-bold rounded transition-colors shrink-0 ${isBirthday
                                                                                    ? 'bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed'
                                                                                    : slot.annuity
                                                                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                                                                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                                                                    }`}
                                                                            >
                                                                                {t('gacha.annuity_short')}
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    {/* Delete Button */}
                                                                    <button
                                                                        onClick={() => removeSlot(row.index, slotIndex)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0 ml-auto"
                                                                        title="삭제"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </button>
                                                                </div>

                                                                {/* Row 2: Custom Amount Input (only for custom type) */}
                                                                {slot.type === 'custom' && (
                                                                    <input
                                                                        type="number"
                                                                        value={slot.customAmount || ''}
                                                                        onChange={(e) => updateSlot(row.index, slotIndex, { customAmount: parseInt(e.target.value) || 0 })}
                                                                        placeholder="0"
                                                                        className="w-full h-7 px-2 text-[11px] font-medium rounded border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-right"
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Add Slot Button */}
                                                    {canAddMore && (
                                                        <button
                                                            onClick={() => addSlot(row.index)}
                                                            className="flex items-center justify-center gap-1 py-1.5 rounded-lg border-2 border-dashed border-indigo-200 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-[11px] font-bold"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {t('gacha.add_gacha')} ({slots.length}/{MAX_SLOTS})
                                                        </button>
                                                    )}

                                                    {/* Empty State */}
                                                    {slots.length === 0 && (
                                                        <div className="text-center text-[10px] text-gray-400 py-1">
                                                            {t('gacha.no_gacha_planned')}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div >




        </div >
    );
};

export default CrystalCalculator;
