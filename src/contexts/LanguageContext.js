import React, { createContext, useState, useContext, useEffect } from 'react';
import ko from '../locales/ko';
import ja from '../locales/ja';
import en from '../locales/en';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        // 1. Check URL query parameter (Priority)
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang && ['ko', 'ja', 'en'].includes(urlLang)) {
            return urlLang;
        }

        // 2. Check Local Storage
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            return savedLanguage;
        }

        // 3. Check Browser Language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang) {
            if (browserLang.startsWith('ja')) return 'ja';
            // User requested to NOT auto-detect English, defaulting to Korean instead
            // if (browserLang.startsWith('en')) return 'en'; 
        }

        // 4. Default
        return 'ko';
    });

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;

        // Update URL query parameter without reloading
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.pushState({}, '', url);
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
