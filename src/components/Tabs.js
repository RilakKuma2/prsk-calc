import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const Tabs = ({ currentTab, setCurrentTab }) => {
  const { t } = useTranslation();
  const tabInfo = [
    { id: 'deck', name: t('tabs.deck') },
    { id: 'fire', name: t('tabs.fire') },
    { id: 'support', name: t('tabs.support') },
    { id: 'scoreArt', name: t('tabs.score_art') },
    { id: 'amatsuyu', name: t('tabs.amatsuyu') },
    { id: 'challenge', name: t('tabs.challenge') },
    { id: 'level', name: t('tabs.level') },
    { id: 'rank', name: t('tabs.rank') },
    { id: 'gacha', name: t('tabs.gacha') },
    { id: 'talks', name: t('tabs.talks') },
  ];

  const tabsRef = useRef(null);
  const [gliderStyle, setGliderStyle] = useState({});

  const updateGlider = useCallback(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector('.tab.active');
      if (activeTabElement) {
        const nextLeft = activeTabElement.offsetLeft;
        const nextWidth = activeTabElement.offsetWidth;
        setGliderStyle(previous => (
          previous.left === nextLeft && previous.width === nextWidth
            ? previous
            : { left: nextLeft, width: nextWidth }
        ));
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
    let timeout;
    const debouncedUpdateGlider = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(updateGlider, 100);
    };

    window.addEventListener('resize', debouncedUpdateGlider);

    return () => {
      window.removeEventListener('resize', debouncedUpdateGlider);
      window.clearTimeout(timeout);
    };
  }, [updateGlider]);

  // Final adjustment after full page load
  useEffect(() => {
    const timer = setTimeout(() => {
      updateGlider();
    }, 200);
    return () => clearTimeout(timer);
  }, [updateGlider]);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e) => {
    if (!tabsRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - tabsRef.current.offsetLeft);
    setScrollLeft(tabsRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !tabsRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 10) {
      setHasDragged(true);
    }
    tabsRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTabClick = (e, tabId) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setCurrentTab(tabId);
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabInfo.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabInfo.length) % tabInfo.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabInfo.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabInfo[nextIndex];
    setCurrentTab(nextTab.id);
    tabsRef.current?.querySelectorAll('.tab')[nextIndex]?.focus();
  };

  return (
    <div 
      className={`tabs ${isDragging ? 'dragging' : ''}`} 
      ref={tabsRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      role="tablist"
      aria-label={t('app.title')}
      style={{
        cursor: isDragging ? 'grabbing' : 'auto',
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
      }}
    >
      <div className="glider" style={gliderStyle}></div>
      {tabInfo.map((tab, index) => (
        <button
          type="button"
          key={tab.id}
          className={`tab ${currentTab === tab.id ? 'active' : ''}`}
          onClick={(e) => handleTabClick(e, tab.id)}
          onKeyDown={(event) => handleTabKeyDown(event, index)}
          role="tab"
          aria-selected={currentTab === tab.id}
          tabIndex={currentTab === tab.id ? 0 : -1}
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
