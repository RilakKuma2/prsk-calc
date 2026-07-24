import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ChallengeScoreTab from './ChallengeScoreTab';
import ChallengeStageTab from './ChallengeStageTab';
import CharacterSelector from './common/CharacterSelector';
import { useTranslation } from '../contexts/LanguageContext';
import {
  CHALLENGE_PRESETS,
  createChallengeProfiles,
  getActiveChallengePreset,
  mirrorActiveChallengePreset,
  selectChallengeCharacter,
  selectChallengePreset,
  updateActiveChallengePreset,
} from '../utils/challengeProfiles';

const ChallengeTab = ({ surveyData, setSurveyData, subPath }) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const profiles = useMemo(
    () => createChallengeProfiles(surveyData),
    [surveyData],
  );
  const selectedCharacterId = profiles.selectedCharacterId;
  const selectedPreset = profiles.characters[selectedCharacterId]?.currentPreset || 'P1';
  const challengeData = getActiveChallengePreset(profiles);

  useEffect(() => {
    if (surveyData.challengeProfiles) return;
    setSurveyData((previous) => {
      const initialProfiles = createChallengeProfiles(previous);
      return mirrorActiveChallengePreset(previous, initialProfiles);
    });
  }, [setSurveyData, surveyData.challengeProfiles]);

  const commitProfiles = (transform) => {
    setSurveyData((previous) => {
      const currentProfiles = createChallengeProfiles(previous);
      const nextProfiles = transform(currentProfiles);
      return mirrorActiveChallengePreset(previous, nextProfiles);
    });
  };

  const handleCharacterChange = (characterId) => {
    commitProfiles((currentProfiles) => (
      selectChallengeCharacter(currentProfiles, characterId)
    ));
  };

  const handlePresetChange = (preset) => {
    commitProfiles((currentProfiles) => (
      selectChallengePreset(currentProfiles, preset)
    ));
  };

  const setChallengeData = (updater) => {
    commitProfiles((currentProfiles) => (
      updateActiveChallengePreset(currentProfiles, updater)
    ));
  };

  // Determine active sub tab from subPath
  const getSubTabFromPath = () => {
    if (subPath === 'stage') return 'stage';
    return 'score'; // default
  };

  const activeSubTab = getSubTabFromPath();

  const handleSubTabChange = (subTab) => {
    navigate(`/chall/${subTab}`);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-center gap-2">
        <CharacterSelector
          selectedId={selectedCharacterId}
          onSelect={handleCharacterChange}
          language={language}
          iconOnly
        />
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label={t('challenge.preset')}
        >
          {CHALLENGE_PRESETS.map((preset, index) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetChange(preset)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                selectedPreset === preset
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-pressed={selectedPreset === preset}
            >
              {t('deck.deck_label') || '덱'} {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'score' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => handleSubTabChange('score')}
        >
          {t('challenge.score')}
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'stage' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => handleSubTabChange('stage')}
        >
          {t('challenge.stage')}
        </button>
      </div>

      {activeSubTab === 'score' && (
        <ChallengeScoreTab
          surveyData={challengeData}
          setSurveyData={setChallengeData}
        />
      )}
      {activeSubTab === 'stage' && (
        <ChallengeStageTab
          surveyData={challengeData}
          setSurveyData={setChallengeData}
        />
      )}
    </div>
  );
};

export default ChallengeTab;
