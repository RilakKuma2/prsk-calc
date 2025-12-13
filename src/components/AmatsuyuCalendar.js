
import React, { useState, useRef, useEffect } from 'react';
import { characterBirthdays } from '../data/characterBirthdays';
import { useTranslation } from '../contexts/LanguageContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isAcquisitionDate = (date, birthday) => {
    if (!date) return false;
    const [bMonth, bDay] = birthday.date.split('.').map(Number);
    const year = date.getFullYear();


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

const getRelevantAcqs = (date) => {
    if (!date) return [];
    return characterBirthdays.filter(b => isAcquisitionDate(date, b));
};

const hasIntersection = (acqs1, acqs2) => {
    if (!acqs1 || !acqs2) return false;
    return acqs1.some(a1 => acqs2.some(a2 => a1.nameKo === a2.nameKo));
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

    const labelRow = Array(7).fill(null);
    labelRow[firstDay] = formatMonth(month);

    const getAcquisitionBarStyle = (date) => {
        const currAcqs = getRelevantAcqs(date);
        if (currAcqs.length === 0) return { display: 'none' };

        currAcqs.sort((a, b) => {
            const isBa = isBirthday(date, a);
            const isBb = isBirthday(date, b);
            if (isBa && !isBb) return -1;
            if (!isBa && isBb) return 1;
            return 0;
        });

        const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1);

        const prevAcqs = getRelevantAcqs(prevDate);
        const nextAcqs = getRelevantAcqs(nextDate);

        const isConnectedLeft = hasIntersection(currAcqs, prevAcqs);
        const isConnectedRight = hasIntersection(currAcqs, nextAcqs);
        const isAllBirthdays = currAcqs.every(b => isBirthday(date, b));

        const gap = '17%';
        let backgroundStyle = { backgroundColor: currAcqs[0].color };
        if (currAcqs.length > 1) {
            backgroundStyle = {
                background: `linear-gradient(to right, ${currAcqs[0].color} 50%, ${currAcqs[1].color} 50%)`
            };
        }

        return {
            ...backgroundStyle,
            left: isConnectedLeft ? '0%' : gap,
            right: isConnectedRight ? '0%' : (isAllBirthdays ? '50%' : gap)
        };
    };

    const renderBirthdayCircle = (date) => {
        if (!date) return null;
        const birthdays = characterBirthdays.filter(b => isBirthday(date, b));
        if (birthdays.length === 0) return null;

        const hasRin = birthdays.find(b => b.nameKo === '린' || b.nameEn === 'Rin');
        const hasLen = birthdays.find(b => b.nameKo === '렌' || b.nameEn === 'Len');

        const style = {};
        if (hasRin && hasLen) {
            style.background = `linear-gradient(to bottom, ${hasRin.color} 50%, ${hasLen.color} 50%)`;
        } else {
            style.backgroundColor = birthdays[0].color;
        }

        return (
            <>
                <div
                    className="absolute w-10 h-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-[52]"
                    style={style}
                />
                {/* Character Images */}
                <div className="absolute bottom-0 right-0 z-[56] flex flex-row-reverse pointer-events-none">
                    {birthdays.map((char) => (
                        <div key={char.nameKo} className="relative w-6 h-6 -ml-2 first:ml-0">
                            <img
                                src={`/assets/characters/${char.image}.webp`}
                                alt={language === 'en' ? char.nameEn : (language === 'ja' ? char.nameJa : char.nameKo)}
                                className="w-full h-full object-contain filter drop-shadow-md"
                            />
                        </div>
                    ))}
                </div>
            </>
        );
    };

    const getRoundedClass = (date) => {
        const currAcqs = getRelevantAcqs(date);
        if (currAcqs.length === 0) return 'rounded-lg';

        const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1);

        const prevAcqs = getRelevantAcqs(prevDate);
        const nextAcqs = getRelevantAcqs(nextDate);

        const isConnectedLeft = hasIntersection(currAcqs, prevAcqs);
        const isConnectedRight = hasIntersection(currAcqs, nextAcqs);

        const roundL = isConnectedLeft ? 'rounded-l-none' : 'rounded-l-full';
        const roundR = isConnectedRight ? 'rounded-r-none' : 'rounded-r-full';

        return `${roundL} ${roundR}`;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getTextColor = (date, idx) => {
        const birthdays = characterBirthdays.filter(b => isBirthday(date, b));
        const hasBirthday = birthdays.length > 0;

        if (isToday(date) && !hasBirthday) return 'text-white font-extrabold'; // Normal Today

        if (hasBirthday) {
            const hasRin = birthdays.find(b => b.nameKo === '린' || b.nameEn === 'Rin');
            const hasLen = birthdays.find(b => b.nameKo === '렌' || b.nameEn === 'Len');
            let colorClass = 'text-white';

            if (hasRin || hasLen || isBrightColor(birthdays[0].color)) {
                colorClass = 'text-gray-800';
            }

            return isToday(date) ? `${colorClass} font-extrabold` : colorClass;
        }

        const isSun = idx % 7 === 0;
        const isSat = idx % 7 === 6;

        if (isSun) return 'text-[#8a898d]';
        if (isSat) return 'text-[#8a898d]';
        return 'text-black';
    };

    const renderTodayCircle = (date) => {
        if (!isToday(date)) return null;

        const hasBirthday = characterBirthdays.some(b => isBirthday(date, b));

        if (hasBirthday) {
            // If birthday exists, add a neon border ring labeled "Today" - Keep Fluorescent
            return (
                <div
                    className="absolute w-10 h-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-[53] border-2 border-[#ccff00] shadow-[0_0_8px_#ccff00]"
                />
            );
        }

        // Normal Today: #FF383C
        return (
            <div
                className="absolute w-9 h-9 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-[51] bg-[#FF383C] shadow-md"
            />
        );
    };

    return (
        <div className="mb-4" ref={(el) => setRef(el, index)}>
            {/* Label Row aligned with grid */}
            <div className="px-4 grid grid-cols-7 gap-y-1 gap-x-0 mb-1">
                {labelRow.map((label, idx) => (
                    <div key={idx} className="flex items-center justify-center text-lg font-bold text-black" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {label}
                    </div>
                ))}
            </div>

            <div className="px-4 pb-2 grid grid-cols-7 gap-y-1 gap-x-0">
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
                        {renderTodayCircle(date)}
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
                    <div className="px-4 pt-2 pb-0 flex justify-between items-end relative min-h-[40px]">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-black" style={{ fontFamily: "'Roboto', sans-serif" }}>
                                {formatMonth(displayDate.month)}
                            </span>
                        </div>

                        {/* Center: Year + Legend */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-end h-full pb-0.5">
                            <span className="text-base font-semibold text-black leading-none mb-0.5" style={{ fontFamily: "'Roboto', sans-serif" }}>
                                {formatYear(displayDate.year)}
                            </span>
                            <span className="text-[10px] text-gray-400 leading-none whitespace-nowrap" style={{ fontFamily: "'Roboto', sans-serif" }}>
                                {t('amatsuyu.legend_underline')}
                            </span>
                        </div>

                        <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500 mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Weekday Header - IOS Style: Gray, small */}
                    <div className="grid grid-cols-7 gap-0 px-4 pb-2">
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
