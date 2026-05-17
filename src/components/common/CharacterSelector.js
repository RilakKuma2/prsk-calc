import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { characterBirthdays } from '../../data/characterBirthdays';

const UNITS = [
    { name: 'Leo/need', ids: ['01', '02', '03', '04'], bg: 'bg-indigo-50' },
    { name: 'MORE MORE JUMP!', ids: ['05', '06', '07', '08'], bg: 'bg-green-50' },
    { name: 'Vivid BAD SQUAD', ids: ['09', '10', '11', '12'], bg: 'bg-red-50' },
    { name: 'Wonderlands×Showtime', ids: ['13', '14', '15', '16'], bg: 'bg-orange-50' },
    { name: '25-ji, Nightcord de.', ids: ['17', '18', '19', '20'], bg: 'bg-purple-50' },
    { name: 'VIRTUAL SINGER', ids: ['21', '22', '23', '24', '25', '26'], bg: 'bg-gray-50' }
];

const CharacterSelector = ({ selectedId, onSelect, language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0 });

    // Close on click outside & scroll & resize
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => setIsOpen(false);
        const handleResize = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Use capture for scrolling to detect scrolling in any parent
            window.addEventListener('scroll', handleScroll, { capture: true });
            window.addEventListener('resize', handleResize);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            // No need to calculate position; we'll use CSS positioning
        }
    }, [isOpen]);

    const getCharData = (id) => {
        const idStr = String(id).padStart(2, '0');
        return characterBirthdays.find(c => c.image === idStr);
    };

    const getCharName = (charData) => {
        if (!charData) return '';
        if (language === 'ja') return charData.nameJa;
        if (language === 'en') return charData.nameEn;
        return charData.nameKo;
    };

    const selectedChar = getCharData(selectedId);

    return (
        <div className="inline-block text-left" ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
                {selectedChar && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                            src={`${process.env.PUBLIC_URL}/assets/characters/${selectedChar.image}.webp`}
                            alt={getCharName(selectedChar)}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                    </div>
                )}
                <span className="font-bold text-gray-700 text-lg">
                    {getCharName(selectedChar)}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Panel - Anchored to button */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 500,
                        width: 'max-content',
                        maxWidth: '90vw',
                        maxHeight: 'calc(100vh - 200px)',
                        overflowY: 'auto',
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in origin-top"
                    >
                        <div className="p-3 space-y-2">
                            {UNITS.map((unit, idx) => (
                                <div key={idx} className={`p-2 rounded-lg ${unit.bg}`}>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {unit.ids.map(id => {
                                            const charData = characterBirthdays.find(c => c.image === id);
                                            const isSelected = String(selectedId) === String(Number(id));

                                            if (!charData) return null;

                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        onSelect(Number(id));
                                                        setIsOpen(false);
                                                    }}
                                                    className={`relative group w-12 h-12 rounded-full overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-110 hover:shadow-md border border-gray-200'}`}
                                                    title={getCharName(charData)}
                                                >
                                                    <img
                                                        src={`${process.env.PUBLIC_URL}/assets/characters/${id}.webp`}
                                                        alt={getCharName(charData)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterSelector;
