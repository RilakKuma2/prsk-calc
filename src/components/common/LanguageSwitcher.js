import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

const LanguageSwitcher = () => {
    const { language, changeLanguage, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Info Bubble State
    const [showInfo, setShowInfo] = useState(false);
    const [isInfoLocked, setIsInfoLocked] = useState(false);

    const dropdownRef = useRef(null);
    const infoRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Language Dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }

            // Info Bubble (Unlock on outside click)
            if (isInfoLocked && infoRef.current && !infoRef.current.contains(event.target)) {
                setIsInfoLocked(false);
                setShowInfo(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isInfoLocked]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleLanguageChange = (lang) => {
        changeLanguage(lang);
        setIsOpen(false);
    };

    // Info Button Handlers
    const handleInfoEnter = () => {
        if (!isInfoLocked) setShowInfo(true);
    };

    const handleInfoLeave = () => {
        if (!isInfoLocked) setShowInfo(false);
    };

    const handleInfoClick = () => {
        if (isInfoLocked) {
            // If already locked, unlock and hide (toggle off)
            setIsInfoLocked(false);
            setShowInfo(false);
        } else {
            // Lock it open
            setIsInfoLocked(true);
            setShowInfo(true);
        }
    };

    return (
        <>
            {/* Info Button - Positioned Top Left */}
            <div className="absolute top-6 left-6 z-50" ref={infoRef}>
                <div className="relative">
                    <button
                        className={`p-2 rounded-full transition-colors duration-200 focus:outline-none ${isInfoLocked ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}

                        onMouseEnter={handleInfoEnter}
                        onMouseLeave={handleInfoLeave}
                        onClick={handleInfoClick}
                        aria-label="Copyright Info"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>

                    {/* Info Tooltip */}
                    {showInfo && (
                        <div className="absolute top-10 left-0 w-72 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 text-sm text-gray-600 leading-relaxed z-[60] animate-fade-in text-left flex flex-col gap-3">
                            {/* Contact Info */}
                            <div className="flex items-center gap-2 text-gray-800 font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                <a href="mailto:rilak@rilaksekai.com" className="hover:text-indigo-600 transition-colors">rilak@rilaksekai.com</a>
                            </div>

                            {/* Separator */}
                            <div className="border-t border-gray-100"></div>

                            {/* Disclaimer */}
                            <div className="text-[10px] text-gray-400 text-justify leading-snug">
                                {t('app.copyright') || "이 웹사이트는 자료를 소유하지 않습니다. 모든 권리는 Sega, Colorful Palette, Crypton을 포함한 자료들의 정당한 소유자에게 있습니다."}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Language Toggle - Positioned Top Right */}
            <div className="absolute top-6 right-6 z-50" ref={dropdownRef}>
                <div className="relative">
                    <button
                        onClick={toggleDropdown}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                        aria-label="Change Language"
                    >
                        {/* Globe Icon SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                    </button>

                    {/* Language Dropdown */}
                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-[55]">
                            <button
                                onClick={() => handleLanguageChange('ko')}
                                className={`block w-full text-left px-4 py-2 text-sm ${language === 'ko' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                한국어
                            </button>
                            <button
                                onClick={() => handleLanguageChange('ja')}
                                className={`block w-full text-left px-4 py-2 text-sm ${language === 'ja' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                日本語
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default LanguageSwitcher;

