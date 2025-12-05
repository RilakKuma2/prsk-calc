
import React, { useState, useRef, useEffect } from 'react';
import { characterBirthdays } from '../data/characterBirthdays';
import { useTranslation } from '../contexts/LanguageContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper logic extracted for reuse
const isAcquisitionDate = (date, birthday) => {
    if (!date) return false;
    const [bMonth, bDay] = birthday.date.split('.').map(Number);
    const year = date.getFullYear();


    // We need to handle year boundaries properly for logic
    // But since we compare timestamps, we just need the correct birthday year relative to date

    // Correct logic: Find the birthday instance closest to 'date' or ensure year matches
    // Actually, simply constructing bDate with date.getFullYear() works for standard cases
    // but D-3 could be in previous year (e.g. Jan 2 birthday -> Dec 30 acq).

    // Let's check date against birthday in current year, prev year, next year
    const checkYear = (y) => {
        const bd = new Date(y, bMonth - 1, bDay);
        const oneDay = 86400000;
        const diff = bd.getTime() - date.getTime();
        return diff >= 0 && diff <= 3 * oneDay;
    };

    return checkYear(year) || checkYear(year + 1) || checkYear(year - 1);
};

const isBirthday = (date, birthday) => {
    if (!date) return false;
    const [bMonth, bDay] = birthday.date.split('.').map(Number);
    return date.getMonth() === bMonth - 1 && date.getDate() === bDay;
};

const getAcqSignature = (date) => {
    if (!date) return null;
    const relevantAcq = characterBirthdays.filter(b => isAcquisitionDate(date, b));
    if (relevantAcq.length === 0) return null;
    const names = relevantAcq.map(b => b.nameKo).sort();
    return names.join('+');
};

const isBrightColor = (color) => {
    return ['#ffee11', '#ffcc11', '#ffdd43', '#ffbb00', '#ffccaa', '#99eedd', '#ddaacc'].includes(color.toLowerCase());
};

const MonthView = ({ year, month, t, index, setRef, language }) => {
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const formatMonth = (m) => {
        // iOS style usually just number or "N월"
        if (language === 'ko') return `${m + 1}월`;
        if (language === 'ja') return `${m + 1}月`;
        return `${m + 1}`;
    };

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(new Date(year, month, i));
    }

    // Label Row Logic: Position month name above the 1st day
    const labelRow = Array(7).fill(null);
    labelRow[firstDay] = formatMonth(month);

    const getAcquisitionBarStyle = (date) => {
        if (!date) return {};
        const relevantAcq = characterBirthdays.filter(b => isAcquisitionDate(date, b));
        if (relevantAcq.length === 0) return { display: 'none' };

        const currSig = getAcqSignature(date);

        // Next day check
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const nextSig = getAcqSignature(nextDate);

        const sameNext = currSig === nextSig;

        // Check if next day is birthday for the same character(s)
        const isNextBd = relevantAcq.some(b => isBirthday(nextDate, b));

        // Check if TODAY is birthday
        const isTodayBirthday = relevantAcq.some(b => isBirthday(date, b));

        // Previous day check (needed for positioning?)
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        const prevSig = getAcqSignature(prevDate);
        const samePrev = currSig === prevSig;

        const gap = '17%';

        let backgroundStyle = { backgroundColor: relevantAcq[0].color };
        if (relevantAcq.length > 1) {
            // Assuming Rin comes first in the array as per data file
            backgroundStyle = {
                background: `linear-gradient(to right, ${relevantAcq[0].color} 50%, ${relevantAcq[1].color} 50%)`
            };
        }

        return {
            ...backgroundStyle,
            left: samePrev ? '0%' : gap,
            right: isTodayBirthday ? '50%' : (sameNext ? '0%' : (isNextBd ? '-50%' : gap))
        };
    };

    const renderBirthdayCircle = (date) => {
        if (!date) return null;
        const birthdays = characterBirthdays.filter(b => isBirthday(date, b));
        if (birthdays.length === 0) return null;

        const hasRin = birthdays.find(b => b.nameKo === '린');
        const hasLen = birthdays.find(b => b.nameKo === '렌');

        const style = {};
        if (hasRin && hasLen) {
            style.background = `linear-gradient(to bottom, ${hasRin.color} 50%, ${hasLen.color} 50%)`;
        } else {
            style.backgroundColor = birthdays[0].color;
        }

        return (
            <div
                className="absolute w-10 h-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-[52]"
                style={style}
            />
        );
    };

    const getRoundedClass = (date) => {
        if (!date) return 'rounded-lg';

        const currSig = getAcqSignature(date);
        if (!currSig) return 'rounded-lg';

        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const prevSig = getAcqSignature(prevDate);
        const nextSig = getAcqSignature(nextDate);

        const samePrev = currSig === prevSig;
        const sameNext = currSig === nextSig;

        // Check if next day is birthday for current acquisition char
        const currentAcqs = characterBirthdays.filter(b => isAcquisitionDate(date, b));
        const isNextBd = currentAcqs.some(b => isBirthday(nextDate, b));

        const roundL = samePrev ? 'rounded-l-none' : 'rounded-l-full';
        const roundR = (sameNext || isNextBd) ? 'rounded-r-none' : 'rounded-r-full';

        return `${roundL} ${roundR}`;
    };

    const getTextColor = (date, idx) => {
        // Birthday -> White/Contrast
        const birthdays = characterBirthdays.filter(b => isBirthday(date, b));
        if (birthdays.length > 0) {
            const hasRin = birthdays.find(b => b.nameKo === '린');
            const hasLen = birthdays.find(b => b.nameKo === '렌');
            if (hasRin || hasLen) return 'text-gray-800';
            if (isBrightColor(birthdays[0].color)) return 'text-gray-800';
            return 'text-white';
        }

        // Acquisition (Outlined) -> Standard Text Color (Black/Gray)
        // So we fall through to default logic below

        const isSun = idx % 7 === 0;
        const isSat = idx % 7 === 6;

        if (isSun) return 'text-[#8a898d]';
        if (isSat) return 'text-[#8a898d]';
        return 'text-black';
    };

    return (
        <div className="mb-4" ref={(el) => setRef(el, index)}>
            {/* Label Row aligned with grid */}
            <div className="px-2 grid grid-cols-7 gap-y-1 gap-x-0 mb-1">
                {labelRow.map((label, idx) => (
                    <div key={idx} className="flex items-center justify-center text-lg font-bold text-black" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {label}
                    </div>
                ))}
            </div>

            <div className="px-2 pb-2 grid grid-cols-7 gap-y-1 gap-x-0">
                {calendarDays.map((date, idx) => (
                    <div
                        key={idx}
                        className="relative h-12 flex items-center justify-center text-lg font-medium"
                    >
                        {date && (
                            <div
                                className={`absolute h-1.5 bottom-1 transition-all ${getRoundedClass(date)}`}
                                style={{
                                    ...getAcquisitionBarStyle(date),
                                    zIndex: 50 - date.getDate() // Ensure earlier days cover later days
                                }}
                            />
                        )}
                        {renderBirthdayCircle(date)}
                        <span className={`relative z-[55] ${date ? getTextColor(date, idx) : ''}`} style={{ fontFamily: "'Roboto', sans-serif" }}>
                            {date ? date.getDate() : ''}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AmatsuyuCalendar = ({ onClose }) => {
    const { t, language } = useTranslation();
    const [currentDate] = useState(new Date());
    const [displayDate, setDisplayDate] = useState({ year: currentDate.getFullYear(), month: currentDate.getMonth() });

    const containerRef = useRef(null);
    const monthRefs = useRef([]);

    // Generate list of months
    const monthsToDisplay = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        monthsToDisplay.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const setMonthRef = (el, index) => {
        monthRefs.current[index] = el;
    };

    const formatYear = (y) => {
        if (language === 'ko') return `${y}년`;
        if (language === 'ja') return `${y}年`;
        return `${y}`;
    };

    const formatMonth = (m) => {
        if (language === 'ko') return `${m + 1}월`;
        if (language === 'ja') return `${m + 1}月`;
        return `${m + 1}`;
    };

    const handleScroll = () => {
        if (!containerRef.current) return;

        const containerTop = containerRef.current.scrollTop;
        const headerOffset = 120;

        // Find the month that is closest to top
        for (let i = 0; i < monthsToDisplay.length; i++) {
            const el = monthRefs.current[i];
            if (el) {
                const { offsetTop, offsetHeight } = el;
                // If element is in "active" zone (top part of viewport)
                if (offsetTop <= containerTop + headerOffset && offsetTop + offsetHeight > containerTop + headerOffset) {
                    setDisplayDate(monthsToDisplay[i]);
                    break;
                }
            }
        }
    };

    // Set initial display date on mount
    useEffect(() => {
        handleScroll();
    }, []);


    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm flex flex-col h-[600px] max-h-[80vh] overflow-hidden relative font-sans" onClick={e => e.stopPropagation()}>

                {/* Unified Sticky Header (Pure White/Translucent) */}
                <div className="absolute top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-b border-gray-200">
                    <div className="px-5 pt-4 pb-2 flex justify-between items-center relative">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-black" style={{ fontFamily: "'Roboto', sans-serif" }}>
                                {formatMonth(displayDate.month)}
                            </span>
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <span className="text-ms font-semibold text-black" style={{ fontFamily: "'Roboto', sans-serif" }}>
                                {formatYear(displayDate.year)}
                            </span>
                        </div>

                        <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* Weekday Header - IOS Style: Gray, small */}
                    <div className="grid grid-cols-7 gap-0 px-2 pb-3">
                        {WEEKDAYS.map((d, idx) => (
                            <div key={d} className={`text-center text-[11px] font-semibold uppercase ${idx === 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {d}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Month List */}
                <div
                    className="overflow-y-auto flex-1 custom-scrollbar pt-[90px]"
                    ref={containerRef}
                    onScroll={handleScroll}
                >
                    {monthsToDisplay.map((m, idx) => (
                        <MonthView
                            key={idx}
                            year={m.year}
                            month={m.month}
                            t={t}
                            language={language}
                            index={idx}
                            setRef={setMonthRef}
                        />
                    ))}
                    <div className="h-20"></div>
                </div>
            </div>
        </div>
    );
};

export default AmatsuyuCalendar;
