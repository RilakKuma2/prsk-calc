import React, { useState, useEffect } from 'react';
import { characterBirthdays } from '../data/characterBirthdays';
import { useTranslation } from '../contexts/LanguageContext';

const UpcomingEvents = ({ children }) => {
    const { t, language } = useTranslation();
    const [isVisible, setIsVisible] = useState(true);

    // Calculate events synchronously to avoid flash
    const [events] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return characterBirthdays
            .map(char => {
                const [bMonth, bDay] = char.date.split('.').map(Number);

                let nextBirthday = new Date(today.getFullYear(), bMonth - 1, bDay);
                if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }

                const acqDate = new Date(nextBirthday);
                acqDate.setDate(nextBirthday.getDate() - 3);

                const diffTime = nextBirthday.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    ...char,
                    nextBirthday,
                    acqDate,
                    diffDays
                };
            })
            .filter(item => item.diffDays >= 0 && item.diffDays <= 7)
            .sort((a, b) => a.diffDays - b.diffDays);
    });

    const getWeekday = (date) => {
        const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
        const daysJa = ['日', '月', '火', '水', '木', '金', '土'];
        const dayIdx = date.getDay();
        return language === 'ja' ? daysJa[dayIdx] : daysKo[dayIdx];
    };

    const formatDate = (date) => {
        return `${date.getMonth() + 1}.${date.getDate()}(${getWeekday(date)})`;
    };

    if (events.length === 0 || !isVisible) {
        return children;
    }

    const isMultiple = events.length > 1;

    // Combined Layout for Multiple Events
    return (
        <div className="mx-16 sm:mx-auto sm:w-full sm:max-w-md mt-2 mb-6 px-0 sm:px-4">
            <div className="relative overflow-visible rounded-xl shadow-lg border border-gray-100 bg-white">

                {/* Global Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 text-gray-400 hover:text-gray-600 z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* List/Grid of Events */}
                {/* If Multiple: Grid 2 Cols side-by-side to save vertical space */}
                <div className={`${isMultiple ? 'grid grid-cols-2 divide-x divide-gray-100' : 'flex flex-col'}`}>
                    {events.map((event, index) => {
                        const acqEndDate = new Date(event.nextBirthday);
                        acqEndDate.setDate(event.nextBirthday.getDate() - 1);

                        return (
                            <div
                                key={event.nameKo}
                                className={`relative flex items-center p-2 ${!isMultiple && index !== events.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                {/* Background Gradient Strip (Per Row/Cell) */}
                                <div
                                    className={`absolute left-0 top-0 bottom-0 w-2 
                      ${index === 0 ? 'rounded-tl-xl' : ''} 
                      ${index === events.length - 1 && !isMultiple ? 'rounded-bl-xl' : ''}
                      ${isMultiple && index === 0 ? 'rounded-bl-xl' : ''} 
                      ${isMultiple && index === events.length - 1 ? 'rounded-tr-xl rounded-br-xl' : ''}
                    `}
                                    style={{ backgroundColor: event.color }}
                                />
                                {/* Note: Rounded corners logic is simplified, might need tweak for perfectly rounded corners on grid */}

                                {/* Content */}
                                <div className={`flex items-center w-full pl-3 ${isMultiple ? 'gap-1.5' : 'gap-3'}`}>
                                    {/* Character Image - Smaller if Multiple */}
                                    <div className={`relative shrink-0 ${isMultiple ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'}`}>
                                        <img
                                            src={`/assets/characters/${event.image}.webp`}
                                            alt={event.nameKo}
                                            className="w-full h-full object-contain filter drop-shadow-sm"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-center text-sm min-w-0">
                                        <div className={`flex items-center justify-between ${isMultiple ? 'mb-0.5' : 'mb-1'}`}>
                                            {/* Name - Hidden on Mobile, Visible on Desktop (Unless multiple, then logic might differ) */}
                                            {/* If Multiple, Keep name hidden on mobile to save space, maybe small name? */}
                                            <span className={`hidden sm:block font-bold text-gray-800 ${isMultiple ? 'text-sm' : 'text-base'}`} style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                                                {language === 'ja' ? event.nameJa : event.nameKo}
                                            </span>

                                            {/* D-Day Tag */}
                                            <span className={`ml-auto sm:ml-0 font-bold text-white rounded-full ${isMultiple ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`} style={{ backgroundColor: event.color }}>
                                                {event.diffDays === 0 ? "D-Day" : `D-${event.diffDays}`}
                                            </span>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="flex flex-col gap-0.5">
                                            {/* Amatsuyu Date */}
                                            <div className={`${isMultiple ? '' : 'flex flex-col sm:flex-row sm:justify-between sm:items-center'}`}>
                                                <p className={`text-gray-500 leading-tight ${isMultiple ? 'text-[9px] hidden' : 'text-[10px] sm:text-xs sm:font-semibold sm:w-20'}`}>
                                                    {language === 'ja' ? 'Amatsuyu' : '아마츠유 기간'}
                                                </p>
                                                <div className={`font-bold text-gray-800 ${isMultiple ? 'text-[10px] sm:text-xs text-right leading-tight' : 'text-xs sm:text-sm whitespace-nowrap'}`}>
                                                    {isMultiple ? (
                                                        <>
                                                            <div className="sm:hidden">
                                                                <div>{formatDate(event.acqDate)}</div>
                                                                <div>~ {formatDate(acqEndDate)}</div>
                                                            </div>
                                                            <span className="hidden sm:inline">{formatDate(event.acqDate)} ~ {formatDate(acqEndDate)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="whitespace-nowrap">{formatDate(event.acqDate)} ~ {formatDate(acqEndDate)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Birthday Date */}
                                            <div className={`${isMultiple ? 'hidden sm:flex justify-end' : 'flex flex-col sm:flex-row sm:justify-between sm:items-center'}`}>
                                                <p className={`text-gray-500 leading-tight ${isMultiple ? 'text-[9px] hidden' : 'text-[10px] sm:text-xs sm:font-semibold sm:w-20'}`}>
                                                    {language === 'ja' ? '誕生日' : '생일'}
                                                </p>
                                                <p className={`font-bold text-gray-800 whitespace-nowrap ${isMultiple ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
                                                    {formatDate(event.nextBirthday)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        );
                    })}
                </div>
            </div>
        </div >
    );
};

export default UpcomingEvents;
