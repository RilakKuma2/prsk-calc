import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

const LanguageSwitcher = () => {
    const { t, language, changeLanguage } = useTranslation();

    // Language Dropdown Logic
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleLanguageChange = (lang) => {
        changeLanguage(lang);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            {/* Language Toggle - Positioned Top Left */}
            <div className="absolute top-6 left-6 z-50" ref={dropdownRef}>
                <div className="relative">
                    <button
                        onClick={toggleDropdown}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                        aria-label="Change Language"
                    >
                        {/* Globe Icon SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
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
                        <div className="absolute left-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-[55]">
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

            {/* Web Store Icon Button - Positioned Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    className="p-2 rounded-full text-indigo-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors duration-200 focus:outline-none"
                    onClick={() => window.open('https://pjsekai.sega.jp/webstore', '_blank')}
                    aria-label="Official Web Store"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                        <line x1="7" y1="15" x2="7.01" y2="15" />
                        <line x1="11" y1="15" x2="13" y2="15" />
                    </svg>
                </button>
            </div>
        </>
    );
};

export default LanguageSwitcher;
