import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const Tabs = ({ currentTab, setCurrentTab }) => {
  const { t } = useTranslation();
  const tabInfo = [
    { id: 'deck', name: t('tabs.deck') },
    { id: 'fire', name: t('tabs.fire') },
    { id: 'scoreArt', name: t('tabs.score_art') },
    { id: 'amatsuyu', name: t('tabs.amatsuyu') },
    { id: 'challenge', name: t('tabs.challenge') },
    { id: 'level', name: t('tabs.level') },
    { id: 'rank', name: t('tabs.rank') },
    { id: 'gacha', name: t('tabs.gacha') },
  ];

  const tabsRef = useRef(null);
  const [gliderStyle, setGliderStyle] = useState({});

  const updateGlider = useCallback(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector('.tab.active');
      if (activeTabElement) {
        setGliderStyle({
          left: activeTabElement.offsetLeft,
          width: activeTabElement.offsetWidth,
        });
      }
    }
  }, []);

  // Update glider on tab change and scroll active tab into view
  useLayoutEffect(() => {
    updateGlider();
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector('.tab.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentTab, updateGlider]);

  // Update glider on window resize
  useEffect(() => {
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    const debouncedUpdateGlider = debounce(updateGlider, 100);

    window.addEventListener('resize', debouncedUpdateGlider);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', debouncedUpdateGlider);
    };
  }, [updateGlider]);

  // Final adjustment after full page load
  useEffect(() => {
    const timer = setTimeout(() => {
      updateGlider();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Update glider on window resize
  useEffect(() => {
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    const debouncedUpdateGlider = debounce(updateGlider, 100);

    window.addEventListener('resize', debouncedUpdateGlider);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', debouncedUpdateGlider);
    };
  }, [updateGlider]);

  return (
    <div className="tabs" ref={tabsRef}>
      <div className="glider" style={gliderStyle}></div>
      {tabInfo.map(tab => (
        <div
          key={tab.id}
          className={`tab ${currentTab === tab.id ? 'active' : ''}`}
          onClick={() => setCurrentTab(tab.id)}
        >
          {tab.name}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
