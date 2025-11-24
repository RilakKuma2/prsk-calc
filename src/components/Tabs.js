import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';

const Tabs = ({ currentTab, setCurrentTab }) => {
  const tabInfo = [
    { id: 'internal', name: '내부치' },
    { id: 'level', name: '레벨' },
    { id: 'power', name: '스코어' },
    { id: 'fire', name: '이벤런' },
    { id: 'challenge', name: '챌라' },
    { id: 'amatsuyu', name: '아마츠유' },
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

  // Update glider on tab change
  useLayoutEffect(() => {
    updateGlider();
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
