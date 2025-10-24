import React from 'react';

const Tabs = ({ currentTab, setCurrentTab }) => {
  const tabInfo = [
    { id: 'internal', name: '내부치' },
    { id: 'level', name: '레벨' },
    { id: 'power', name: '종합력' },
    { id: 'fire', name: '이벤런' },
    { id: 'challenge', name: '챌라' },
    { id: 'amatsuyu', name: '아마츠유' },
  ];

  return (
    <div className="tabs">
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
