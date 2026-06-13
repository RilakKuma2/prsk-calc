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

  return (
    <div 
      className={`tabs ${isDragging ? 'dragging' : ''}`} 
      ref={tabsRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{
        cursor: isDragging ? 'grabbing' : 'auto',
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
      }}
    >
      <div className="glider" style={gliderStyle}></div>
      {tabInfo.map(tab => (
        <div
          key={tab.id}
          className={`tab ${currentTab === tab.id ? 'active' : ''}`}
          onClick={(e) => handleTabClick(e, tab.id)}
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        >
          {tab.name}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
