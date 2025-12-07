import React, { createContext, useState, useContext, useEffect } from 'react';
import ko from '../locales/ko';
import ja from '../locales/ja';
import en from '../locales/en';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            return savedLanguage;
        }
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang) {
            if (browserLang.startsWith('ja')) return 'ja';
            if (browserLang.startsWith('en')) return 'en';
        }
        return 'ko';
    });

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
    };

    const translations = {
        ko,
        ja,
        en,
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && value[k] !== undefined) {
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
