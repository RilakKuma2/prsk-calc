import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

const EventOverrideDropdown = ({ value, options, onChange, assetPath, iconOnly = false, extraOptions = [], autoOption = null }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const allOptions = [...options, ...extraOptions];
    const selected = allOptions.find(option => option.key === value);
    const displayOption = selected || autoOption;
    const isAutoSelected = !value;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-left shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    {displayOption?.file ? (
                        <img
                            src={`${process.env.PUBLIC_URL}/assets/event/${assetPath}/${displayOption.file}`}
                            alt={displayOption.label}
                            className={`${iconOnly ? 'h-6 w-7' : 'h-5 w-5'} shrink-0 object-contain`}
                        />
                    ) : (
                        <span className="truncate text-sm font-bold text-gray-700">{displayOption?.label || (t('support.auto') || '자동')}</span>
                    )}
                    {displayOption?.file && (
                        <span className="truncate text-sm font-bold text-gray-700">{displayOption.label}</span>
                    )}
                    {isAutoSelected && displayOption && (
                        <span className="shrink-0 text-[10px] font-bold text-gray-400">({t('support.auto') || '자동'})</span>
                    )}
                </span>
                <svg className={`ml-1 h-3 w-3 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/10">
                    <div className={iconOnly ? 'grid grid-cols-3 gap-1 p-1.5' : ''}>
                        <button
                            type="button"
                            onClick={() => handleSelect('')}
                            className={`${iconOnly ? 'flex h-9 items-center justify-center rounded-md px-1 text-xs' : 'flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm'} font-bold transition-colors ${!value ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
                            title={t('support.auto') || '자동'}
                        >
                            {t('support.auto') || '자동'}
                        </button>
                        {allOptions.map(option => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => handleSelect(option.key)}
                                className={`${iconOnly ? 'flex h-9 items-center justify-center rounded-md px-1 text-xs' : 'flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm'} font-bold transition-colors ${value === option.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                title={option.label}
                            >
                                {option.file ? (
                                    <img
                                        src={`${process.env.PUBLIC_URL}/assets/event/${assetPath}/${option.file}`}
                                        alt={option.label}
                                        className={`${iconOnly ? 'h-6 w-8' : 'h-5 w-5'} object-contain`}
                                    />
                                ) : (
                                    option.label
                                )}
                                {!iconOnly && option.file && option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventOverrideDropdown;
