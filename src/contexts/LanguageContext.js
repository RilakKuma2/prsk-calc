import React, { createContext, useState, useContext, useEffect } from 'react';
import ko from '../locales/ko';
import ja from '../locales/ja';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            return savedLanguage;
        }
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith('ja')) {
            return 'ja';
        }
        return 'ko';
    });

    useEffect(() => {
        // Effect to sync state if needed, but initial state handles the logic now.
        // We can keep the localStorage sync in changeLanguage.
    }, []);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const translations = {
        ko,
        ja,
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key; // Fallback to key if translation missing
            }
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
