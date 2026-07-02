import React from 'react';

const LanguageSwitcher = () => {
    return (
        <div className="absolute top-6 right-6 z-50">
            <button
                type="button"
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
    );
};

export default LanguageSwitcher;
