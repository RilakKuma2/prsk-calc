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

    const updateManifestAndTitle = (lang) => {
        // Update manifest
        let manifestFile = 'manifest_ko.json';
        if (lang === 'ja') manifestFile = 'manifest_ja.json';
        else if (lang === 'en') manifestFile = 'manifest_en.json';

        let link = document.querySelector("link[rel='manifest']");
        if (link) {
            link.href = manifestFile;
        } else {
            link = document.createElement('link');
            link.rel = 'manifest';
            link.href = manifestFile;
            document.head.appendChild(link);
        }

        // Update apple-mobile-web-app-title
        const titleMap = {
            ko: '프로세카 계산기',
            ja: 'プロセカ計算機',
            en: 'Prsk Calc'
        };
        const appTitle = titleMap[lang] || titleMap.ko;

        let metaTitle = document.querySelector("meta[name='apple-mobile-web-app-title']");
        if (metaTitle) {
            metaTitle.setAttribute('content', appTitle);
        } else {
            metaTitle = document.createElement('meta');
            metaTitle.setAttribute('name', 'apple-mobile-web-app-title');
            metaTitle.setAttribute('content', appTitle);
            document.head.appendChild(metaTitle);
        }

        // Update <title> tag as well if needed
        document.title = appTitle;
    };

    useEffect(() => {
        document.documentElement.lang = language;
        updateManifestAndTitle(language);
    }, [language]);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        // document.documentElement.lang = lang; // redundant with useEffect

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

    const t = (key, replacements = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return key; // Fallback to key if translation missing
            }
        }

        // Simple string interpolation for {{key}}
        if (typeof value === 'string' && replacements) {
            Object.keys(replacements).forEach(rKey => {
                value = value.replace(new RegExp(`{{${rKey}}}`, 'g'), replacements[rKey]);
            });
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
