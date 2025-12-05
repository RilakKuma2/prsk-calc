import React, { useState, useEffect } from 'react';
import { InputTableWrapper, InputRow, SelectRow } from './common/InputComponents';
import { useTranslation } from '../contexts/LanguageContext';

import AmatsuyuCalendar from './AmatsuyuCalendar';
import AmatsuyuNotificationModal from './AmatsuyuNotificationModal';
import { characterBirthdays } from '../data/characterBirthdays';

const AmatsuyuTab = ({ surveyData, setSurveyData }) => {
  const { t, language } = useTranslation();
  const [hasCurrentYearCard, setHasCurrentYearCard] = useState(surveyData.hasCurrentYearCard || 'N');
  const [pastCardsOwned, setPastCardsOwned] = useState(surveyData.pastCardsOwned || '0');
  const [currentLevel, setCurrentLevel] = useState(surveyData.amatsuyuCurrentLevel || '0');
  const [targetLevel, setTargetLevel] = useState(surveyData.amatsuyuTargetLevel || '400');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const [notifySettings, setNotifySettings] = useState(() => {
    const saved = localStorage.getItem('amatsuyu_notify_settings');
    return saved ? JSON.parse(saved) : { enabled: false, notifyAcq: true, notifyBd: true, time: '21:00' };
  });

  // Notification Logic
  useEffect(() => {
    if (!notifySettings.enabled) return;

    const checkNotification = () => {
      const now = new Date();
      const [targetHour, targetMinute] = notifySettings.time.split(':').map(Number);

      // Check if current time matches (roughly within the minute)
      // Or if we passed it and haven't notified today? 
      // Simple trigger: If now.hours == target && now.minutes == target
      // Better: Store 'last_notified_date' in localStorage to avoid duplicate/missed.

      const lastNotified = localStorage.getItem('amatsuyu_last_notified');
      const todayStr = now.toISOString().split('T')[0];

      if (lastNotified === todayStr) return; // Already notified today

      if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
        // Check logic
        const checkDate = (offsetDays) => {
          // Return list of characters whose event is 'offsetDays' away from now?
          // Logic: 
          // Notify "Tomorrow is Acq Start" -> Today is (AcqStart - 1). AcqStart is (Bd - 3). So Today is (Bd - 4).
          // Notify "Tomorrow is Birthday" -> Today is (Bd - 1).

          // Construct test date: Today + Offset
          const targetDate = new Date();
          targetDate.setDate(now.getDate() + offsetDays);
          const tMonth = targetDate.getMonth() + 1;
          const tDay = targetDate.getDate();

          return characterBirthdays.filter(c => {
            const [bM, bD] = c.date.split('.').map(Number);
            return bM === tMonth && bD === tDay;
          });
        };

        const msgs = [];

        if (notifySettings.notifyAcq) {
          // Check if Today is D-4 (Tomorrow is D-3 = Acq Start)
          // Actually: Browser D-1 of Acq Start.
          // Acq Start is "Birthday - 3 days".
          // Notification Day = "Acq Start - 1 day" = "Birthday - 4 days".
          // So we want to find birthdays strictly 4 days ahead.
          const acqTargets = checkDate(4);
          acqTargets.forEach(c => {
            const name = language === 'ko' ? c.nameKo : c.nameJa; // Fallback? Locale depends on browser context usually for Notification but here app context.
            // Keep simple: use app language logic if possible, or mixed.
            msgs.push(language === 'ko' ? `${name} 아마츠유 획득 기간 시작 전날입니다.` : `${name} あまつゆ獲得期間開始の前日です。`);
          });
        }

        if (notifySettings.notifyBd) {
          // Check if Today is D-1 (Tomorrow is Birthday)
          const bdTargets = checkDate(1);
          bdTargets.forEach(c => {
            const name = language === 'ko' ? c.nameKo : c.nameJa;
            msgs.push(language === 'ko' ? `${name} 생일 전날입니다.` : `${name} 誕生日の前日です。`);
          });
        }

        if (msgs.length > 0) {
          if (Notification.permission === 'granted') {
            new Notification('Proseka Calculator', { body: msgs.join('\n') });
            localStorage.setItem('amatsuyu_last_notified', todayStr);
          }
        }
      }
    };

    const interval = setInterval(checkNotification, 15000); // Check every 15s to be safe
    return () => clearInterval(interval);
  }, [notifySettings, language]);

  const saveSettings = (newSettings) => {
    setNotifySettings(newSettings);
    localStorage.setItem('amatsuyu_notify_settings', JSON.stringify(newSettings));
  };

  const rewardTable = [
    { level: 2, rewards: { 'birthday_title': 'basic 1', 'small_can': 3, 'skill_book_inter': 1, 'photo_film': 5 } },
    { level: 3, rewards: { 'kakera': 50 } },
    { level: 4, rewards: { 'exclusive_kakera': 50 } },
    { level: 6, rewards: { 'kakera': 50 } },
    { level: 8, rewards: { 'exclusive_kakera': 50 } },
    { level: 10, rewards: { 'birthday_title': 'basic 2', 'small_can': 3, 'score_inter': 10, 'mission_gacha_ticket': 1 } },
    { level: 13, rewards: { 'kakera': 50 } },
    { level: 16, rewards: { 'exclusive_kakera': 50 } },
    { level: 19, rewards: { 'kakera': 50 } },
    { level: 22, rewards: { 'exclusive_kakera': 50 } },
    { level: 25, rewards: { 'birthday_title': 'basic 3', 'small_can': 3, 'skill_book_inter': 1, 'char_memoria': 1 } },
    { level: 29, rewards: { 'kakera': 50 } },
    { level: 33, rewards: { 'exclusive_kakera': 50 } },
    { level: 37, rewards: { 'kakera': 50 } },
    { level: 41, rewards: { 'exclusive_kakera': 50 } },
    { level: 45, rewards: { 'birthday_title': 'wing 1', 'small_can': 5, 'score_inter': 10, 'mission_gacha_ticket': 1 } },
    { level: 50, rewards: { 'kakera': 50 } },
    { level: 55, rewards: { 'exclusive_kakera': 50 } },
    { level: 60, rewards: { 'kakera': 50 } },
    { level: 65, rewards: { 'exclusive_kakera': 50 } },
    { level: 70, rewards: { 'birthday_title': 'wing 2', 'small_can': 5, 'skill_book_inter': 1, 'char_memoria': 1 } },
    { level: 79, rewards: { 'kakera': 50 } },
    { level: 88, rewards: { 'exclusive_kakera': 50 } },
    { level: 97, rewards: { 'kakera': 50 } },
    { level: 106, rewards: { 'exclusive_kakera': 50 } },
    { level: 115, rewards: { 'birthday_title': 'wing 3', 'small_can': 5, 'score_inter': 10, 'mission_gacha_ticket': 2 } },
    { level: 125, rewards: { 'kakera': 50 } },
    { level: 135, rewards: { 'exclusive_kakera': 50 } },
    { level: 145, rewards: { 'kakera': 50 } },
    { level: 155, rewards: { 'exclusive_kakera': 50 } },
    { level: 165, rewards: { 'birthday_title': 'flower 1', 'small_can': 7, 'skill_book_inter': 1, 'char_memoria': 2 } },
    { level: 177, rewards: { 'kakera': 50 } },
    { level: 189, rewards: { 'exclusive_kakera': 50 } },
    { level: 201, rewards: { 'kakera': 50 } },
    { level: 213, rewards: { 'exclusive_kakera': 50 } },
    { level: 225, rewards: { 'birthday_title': 'flower 2', 'small_can': 7, 'score_inter': 10, 'mission_gacha_ticket': 3 } },
    { level: 240, rewards: { 'kakera': 50 } },
    { level: 255, rewards: { 'exclusive_kakera': 50 } },
    { level: 270, rewards: { 'kakera': 50 } },
    { level: 285, rewards: { 'exclusive_kakera': 50 } },
    { level: 300, rewards: { 'birthday_title': 'flower 3', 'small_can': 7, 'skill_book_inter': 1, 'char_memoria': 3 } },
    { level: 320, rewards: { 'kakera': 50 } },
    { level: 340, rewards: { 'exclusive_kakera': 50 } },
    { level: 360, rewards: { 'kakera': 50 } },
    { level: 380, rewards: { 'exclusive_kakera': 50 } },
    { level: 400, rewards: { 'birthday_title': 'star_flower 3', 'small_can': 10, 'score_inter': 10, 'mission_gacha_ticket': 3 } },
  ];

  const [birthdayCardBonus, setBirthdayCardBonus] = useState(0);
  const [amatsuyuPointsPerItem, setAmatsuyuPointsPerItem] = useState(0);
  const [neededAmatsuyu, setNeededAmatsuyu] = useState(0);
  const [mySekaiStones, setMySekaiStones] = useState(0);
  const [mySekaiLaps, setMySekaiLaps] = useState(0);
  const [fiveFireStones, setFiveFireStones] = useState(0);
  const [fiveFireHours, setFiveFireHours] = useState(0);
  const [cumulativeRewards, setCumulativeRewards] = useState({});
  const [highestBirthdayTitle, setHighestBirthdayTitle] = useState('');

  useEffect(() => {
    const newSurveyData = { ...surveyData, hasCurrentYearCard, pastCardsOwned, amatsuyuCurrentLevel: currentLevel, amatsuyuTargetLevel: targetLevel };
    setSurveyData(newSurveyData);

    // Calculate Birthday Card Bonus
    let bonus = 0;
    if (hasCurrentYearCard === 'Y') {
      bonus += 50;
    }
    bonus += parseInt(pastCardsOwned) * 15;
    setBirthdayCardBonus(bonus);

    // Calculate Amatsuyu Points per Item
    const basePoints = 100;
    const pointsPerItem = basePoints * (1 + bonus / 100);
    setAmatsuyuPointsPerItem(pointsPerItem);

    // Calculate Needed Amatsuyu
    const currentLvl = parseInt(currentLevel || '0');
    const targetLvl = parseInt(targetLevel || '400');
    const pointsPerLevel = 10000;

    if (targetLvl <= currentLvl) {
      setNeededAmatsuyu(0);
      setMySekaiStones(0);
      setMySekaiLaps(0);
      setFiveFireStones(0);
      setFiveFireHours(0);
      setCumulativeRewards({});
      setHighestBirthdayTitle('');
      return;
    }

    const totalPointsNeeded = (targetLvl - currentLvl) * pointsPerLevel;
    const needed = Math.ceil(totalPointsNeeded / pointsPerItem);
    setNeededAmatsuyu(needed);

    // My Sekai Calculations
    const mySekaiAmatsuyuPerStone = 42 / 2.5; // 42 Amatsuyu per 25 stones
    const mySekaiAmatsuyuPerLap = 1162;

    const msStones = Math.ceil(needed / mySekaiAmatsuyuPerStone);
    setMySekaiStones(msStones);
    const msLaps = Math.ceil(needed / mySekaiAmatsuyuPerLap);
    setMySekaiLaps(msLaps);

    // 5-Fire Run Calculations
    const fiveFireAmatsuyuPerStone = 25 / 5; // 25 Amatsuyu per 50 stones
    const fiveFireAmatsuyuPerHour = 675;

    const ffStones = Math.ceil(needed / fiveFireAmatsuyuPerStone);
    setFiveFireStones(ffStones);
    const ffHours = (needed / fiveFireAmatsuyuPerHour).toFixed(1);
    setFiveFireHours(ffHours);

    // Calculate Cumulative Rewards
    const rewards = {};
    let currentHighestTitle = '';
    rewardTable.forEach(item => {
      if (targetLvl >= item.level) {
        for (const [key, value] of Object.entries(item.rewards)) {
          if (key === 'birthday_title') {
            // Translate title parts
            const parts = value.split(' ');
            const type = parts[0];
            const level = parts[1];
            currentHighestTitle = `${t(`amatsuyu.${type}`)} ${level}`;
          } else {
            rewards[key] = (rewards[key] || 0) + value;
          }
        }
      }
    });
    setCumulativeRewards(rewards);
    setHighestBirthdayTitle(currentHighestTitle);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCurrentYearCard, pastCardsOwned, currentLevel, targetLevel, t]);

  return (
    <div id="amatsuyu-tab-content" className="p-4 space-y-4">
      {/* Input Section - Reverted to Default Style (Exact Match with AutoTab) */}
      <InputTableWrapper>
        <SelectRow
          label={t('amatsuyu.current_year_card')}
          value={hasCurrentYearCard}
          onChange={e => setHasCurrentYearCard(e.target.value)}
          options={[
            { value: "Y", label: "Y" },
            { value: "N", label: "N" },
          ]}
          spacer={true}
        />
        <SelectRow
          label={t('amatsuyu.past_cards_count')}
          value={pastCardsOwned}
          onChange={e => setPastCardsOwned(e.target.value)}
          options={[0, 1, 2, 3, 4].map(num => ({ value: num, label: num }))}
          spacer={true}
        />
        <InputRow
          label={t('amatsuyu.current_level')}
          value={currentLevel}
          onChange={e => setCurrentLevel(e.target.value)}
          placeholder="0"
          spacer={true}
        />
        <InputRow
          label={t('amatsuyu.target_level')}
          value={targetLevel}
          onChange={e => { const value = parseInt(e.target.value); setTargetLevel(isNaN(value) ? 0 : Math.min(400, Math.max(0, value))); }}
          placeholder="400"
          spacer={true}
        />
      </InputTableWrapper>

      {/* Result Sections Wrapper - Slightly Reduced Width (340px max, 85% mobile) */}
      <div className="w-[85%] max-w-[340px] mx-auto space-y-4">
        {/* Calendar & Notification Buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t('amatsuyu.calendar')}
          </button>

          <button
            onClick={() => setShowNotifyModal(true)}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors border ${notifySettings.enabled ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Summary - Compact, No Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 ">
          <div className="grid grid-cols-2 items-center mb-1 text-center max-[375px]:text-sm">
            <span className="text-gray-600">{t('amatsuyu.card_multiplier')}</span>
            <span className="font-bold text-purple-600">{birthdayCardBonus}%</span>
          </div>
          <div className="grid grid-cols-2 items-center mb-1 text-center max-[375px]:text-sm">
            <span className="text-gray-600">{t('amatsuyu.points_per_item')}</span>
            <span className="font-bold text-purple-600 ">{Math.floor(amatsuyuPointsPerItem).toLocaleString()}pt</span>
          </div>
          <div className="grid grid-cols-2 items-center pt-1 border-t mt-1 text-center">
            <span className="text-gray-900 font-bold">{t('amatsuyu.needed_amatsuyu')}</span>
            <span className="font-bold text-lg text-purple-600">{neededAmatsuyu.toLocaleString()}{t('amatsuyu.suffix_count')}</span>
          </div>
        </div>

        {/* Strategy Cards - Always 2 columns, Font Reduced to text-sm */}
        <div className="grid grid-cols-2 gap-3 text-sm ">
          {/* MySekai Card */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-3 ">
            <h4 className="font-bold text-green-800 mb-1 flex items-center">
              <span className="mr-1">🌱</span> {t('amatsuyu.mysekai')}
            </h4>
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-green-700">{t('amatsuyu.needed_fire')}</span>
                <span className="font-bold text-green-900">{mySekaiStones.toLocaleString()}{t('amatsuyu.suffix_fire')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t('amatsuyu.laps')}</span>
                <span className="font-bold text-green-900">{mySekaiLaps.toLocaleString()}{t('amatsuyu.suffix_laps')}</span>
              </div>
            </div>
          </div>

          {/* 5-Fire Card */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h4 className="font-bold text-blue-800 mb-1 flex items-center">
              <span className="mr-1">🔥</span> {t('amatsuyu.five_fire_run')}
            </h4>
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-blue-700">{t('amatsuyu.needed_fire')}</span>
                <span className="font-bold text-blue-900">{fiveFireStones.toLocaleString()}{t('amatsuyu.suffix_fire')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">{t('amatsuyu.time')}</span>
                <span className="font-bold text-blue-900">{fiveFireHours}{t('amatsuyu.time')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reference Text - Moved here */}
        <div className="text-xs text-gray-500 text-center">
          {t('amatsuyu.reference_text')}
        </div>

        {/* Rewards Section - Compact, No Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {highestBirthdayTitle && (
            <div className="mb-2 text-center bg-yellow-50 border border-yellow-200 rounded p-2 flex justify-center items-center gap-2">
              <span className="text-sm font-bold text-yellow-800">{t('amatsuyu.title')}:</span>
              <span className="text-sm font-bold text-yellow-800">{highestBirthdayTitle}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-[375px]:text-xs">
            {Object.entries(cumulativeRewards).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[60%_40%] items-center text-center border-b border-gray-100 pb-1 last:border-0">
                <span className="text-gray-600">{t(`amatsuyu.rewards.${key}`)}</span>
                <span className="font-bold text-gray-900">{value.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(cumulativeRewards).length === 0 && (
              <div className="col-span-2 text-center text-gray-400 py-1">{t('amatsuyu.no_rewards')}</div>
            )}
          </div>
        </div>

        {/* Info & Reference Table */}
        <div className="text-base text-gray-500 space-y-4">
          <p className="text-center">
            <a href={language === 'ja' ? "https://pjsekai.com/?086da69e4a" : "https://m.dcinside.com/board/pjsekai/2278357"} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">
              {t('amatsuyu.summary_link')}
            </a>
          </p>

          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm ">
            <table className="w-full text-center border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 font-bold text-gray-700 border-b border-gray-200">{t('amatsuyu.title')}</th>
                  <th className="p-2 font-bold text-gray-700 border-b border-gray-200" colSpan="3">{t('amatsuyu.level_requirements')}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-b border-gray-100">{t('amatsuyu.basic')}</td>
                  <td className="p-2 border-b border-gray-100 border-r">2</td>
                  <td className="p-2 border-b border-gray-100 border-r">10</td>
                  <td className="p-2 border-b border-gray-100">25</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-b border-gray-100">{t('amatsuyu.wing')}</td>
                  <td className="p-2 border-b border-gray-100 border-r">45</td>
                  <td className="p-2 border-b border-gray-100 border-r">70</td>
                  <td className="p-2 border-b border-gray-100">115</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-b border-gray-100">{t('amatsuyu.flower')}</td>
                  <td className="p-2 border-b border-gray-100 border-r">165</td>
                  <td className="p-2 border-b border-gray-100 border-r">225</td>
                  <td className="p-2 border-b border-gray-100">300</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-gray-900 bg-gray-50 border-r border-gray-100">{t('amatsuyu.star_flower')}</td>
                  <td className="p-2" colSpan="3">400</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showCalendar && <AmatsuyuCalendar onClose={() => setShowCalendar(false)} />}
      {showNotifyModal && (
        <AmatsuyuNotificationModal
          settings={notifySettings}
          onSave={saveSettings}
          onClose={() => setShowNotifyModal(false)}
        />
      )}
    </div>
  );
};

export default AmatsuyuTab;
