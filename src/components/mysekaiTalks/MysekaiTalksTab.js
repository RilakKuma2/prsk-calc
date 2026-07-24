import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  AccountStateConflictDialog,
  useAccountState,
  useAuth,
} from '../../login';
import {
  canUseFixtureDialogues,
  createMysekaiStorageAdapter,
  getMysekaiSnapshotStats,
  hasLocalMysekaiItems,
  hasMysekaiConflict,
  isMysekaiSnapshot,
  mergeMysekaiSnapshots,
  MYSEKAI_PRESETS,
  MYSEKAI_SYNC_NAMESPACE,
  normalizeMysekaiSnapshot,
} from '../../utils/mysekaiChecklist';
import {
  getCharacterColor,
  getCharacterName,
  getCharacterStampUrl,
  getFixtureThumbnailUrl,
  getTalkVoiceUrl,
  loadFixtureDialogue,
  loadMysekaiTalkData,
} from './mysekaiTalkData';
import './MysekaiTalksTab.css';

const storage = createMysekaiStorageAdapter();

const UNIT_CONFIG = [
  { name: 'Leo/need', color: '#4455dd', characters: [1, 2, 3, 4, 27, 32, 37, 42, 47, 52] },
  { name: 'MORE MORE JUMP!', color: '#6fba2c', characters: [5, 6, 7, 8, 28, 33, 38, 43, 48, 53] },
  { name: 'Vivid BAD SQUAD', color: '#ee1166', characters: [9, 10, 11, 12, 29, 34, 39, 44, 49, 54] },
  { name: 'Wonderlands×Showtime', color: '#ff9900', characters: [13, 14, 15, 16, 30, 35, 40, 45, 50, 55] },
  { name: '25-ji, Nightcord de.', color: '#884499', characters: [17, 18, 19, 20, 31, 36, 41, 46, 51, 56] },
];

const TAMAGOTCHI_LIST = [
  {
    id: 837,
    names: { ko: '마메치', ja: 'まめっち', en: 'Mametchi' },
    asset: 'mdl_clb1102_fixture_egg1_1',
  },
  {
    id: 838,
    names: { ko: '쿠치파치', ja: 'くちぱっち', en: 'Kuchipatchi' },
    asset: 'mdl_clb1102_fixture_egg2_1',
  },
  {
    id: 839,
    names: { ko: '미미치', ja: 'みみっち', en: 'Mimitchi' },
    asset: 'mdl_clb1102_fixture_egg3_1',
  },
  {
    id: 840,
    names: { ko: '메메치', ja: 'めめっち', en: 'Memetchi' },
    asset: 'mdl_clb1102_fixture_egg4_1',
  },
];

const RubyText = ({ text }) => {
  const parts = [];
  const matcher = /<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/g;
  let cursor = 0;
  let match;
  while ((match = matcher.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <ruby key={`${match.index}-${match[1]}`}>
        {match[1]}
        <rt>{match[2]}</rt>
      </ruby>,
    );
    cursor = matcher.lastIndex;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

const CharacterStamp = ({ characterId, language, size = 30 }) => (
  <img
    className="mysekai-talk-character-stamp"
    src={getCharacterStampUrl(characterId)}
    alt={getCharacterName(characterId, language)}
    title={getCharacterName(characterId, language)}
    loading="lazy"
    width={size}
    height={size}
    style={{ borderColor: getCharacterColor(characterId) }}
  />
);

const FixtureImage = ({ fixture, className = '' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [fixture?.id]);
  if (failed) {
    return <span className={`mysekai-talk-image-placeholder ${className}`} aria-hidden="true">🪑</span>;
  }
  return (
    <img
      className={className}
      src={getFixtureThumbnailUrl(fixture)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const DialogueModal = ({
  talk,
  title,
  language,
  lines,
  loading,
  error,
  isRead,
  isOwned,
  onToggleRead,
  onToggleOwned,
  onPlayVoice,
  playingVoiceName,
  voiceErrorName,
  onClose,
  t,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const participants = talk.scenario.participantCharIds
    || [talk.scenario.primaryCharacterId];

  return (
    <div
      className="mysekai-talk-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="mysekai-talk-modal"
        role="dialog"
        aria-modal="true"
        aria-label={talk.fixture.name}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div className="mysekai-talk-modal-fixture-wrap">
            <FixtureImage fixture={talk.fixture} className="mysekai-talk-modal-fixture" />
            <button
              type="button"
              className={`mysekai-talk-modal-owned-badge ${isOwned ? 'active' : ''}`}
              onClick={onToggleOwned}
              aria-label={t(isOwned ? 'talks.uncheck_owned' : 'talks.check_owned')}
              aria-pressed={isOwned}
            >
              ✓
            </button>
            {talk.duplicateFixtures.length > 1 && (
              <span className="mysekai-talk-modal-duplicate-badge">
                +{talk.duplicateFixtures.length - 1}
              </span>
            )}
          </div>
          <div className="mysekai-talk-modal-heading">
            <h2>{title}</h2>
            <p>{talk.fixture.name}</p>
          </div>
          <button
            type="button"
            className={`mysekai-talk-modal-read-close ${isRead ? 'unread' : 'read'}`}
            onClick={() => {
              onToggleRead();
              onClose();
            }}
          >
            {isRead ? '❌' : '✅'}{' '}
            {t(isRead ? 'talks.unread_and_close' : 'talks.read_and_close')}
          </button>
          <button
            type="button"
            className="mysekai-talk-modal-close"
            onClick={onClose}
            aria-label={t('talks.close')}
          >
            ×
          </button>
        </header>

        <div className="mysekai-talk-modal-body">
          {participants.length > 1 && (
            <div className="mysekai-talk-participants">
              <span>{t('talks.participants')}</span>
              {participants.map((characterId) => (
                <CharacterStamp
                  key={characterId}
                  characterId={characterId}
                  language={language}
                  size={28}
                />
              ))}
            </div>
          )}

          <div className="mysekai-talk-dialogue-body">
            {loading && (
              <div className="mysekai-talk-dialogue-loading">
                <span className="mysekai-talk-dialogue-spinner" aria-hidden="true" />
                <p>{t('talks.dialogue_loading')}</p>
              </div>
            )}
            {!loading && error && (
              <p className="mysekai-talk-dialogue-status error">{error}</p>
            )}
            {!loading && !error && lines.length === 0 && (
              <p className="mysekai-talk-dialogue-status">{t('talks.dialogue_empty')}</p>
            )}
            {!loading && lines.map((line, index) => (
              <div
                className="mysekai-talk-dialogue-line"
                key={`${line.voiceName || line.speaker}-${index}`}
                style={{ borderColor: getCharacterColor(line.speakerId) }}
              >
                {line.speakerId ? (
                  <CharacterStamp
                    characterId={line.speakerId}
                    language={language}
                    size={40}
                  />
                ) : (
                  <span className="mysekai-talk-unknown-character">?</span>
                )}
                <p><RubyText text={line.text} /></p>
                {line.voiceName && (
                  <button
                    type="button"
                    className={`mysekai-talk-voice-button ${voiceErrorName === line.voiceName ? 'error' : ''}`}
                    onClick={() => onPlayVoice(line.voiceName)}
                    aria-label={t('talks.play_voice')}
                  >
                    {playingVoiceName === line.voiceName ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export const MysekaiTalksView = ({
  data,
  language,
  currentPreset,
  ownedFixtures,
  seenDialogues,
  canViewDialogues,
  onSelectPreset,
  onToggleOwned,
  onToggleSeen,
  onSetAllSeen,
  onImport,
  onReset,
  t,
}) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState(0);
  const [ownedFilter, setOwnedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('rank');
  const [isCheckMode, setIsCheckMode] = useState(false);
  const [isTamagotchiExpanded, setIsTamagotchiExpanded] = useState(false);
  const [ownedTamagotchi, setOwnedTamagotchi] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('mysekai_ownedTamagotchi') || 'null')
        || { 837: false, 838: false, 839: false, 840: false };
    } catch {
      return { 837: false, 838: false, 839: false, 840: false };
    }
  });
  const [hideDuplicateFurniture, setHideDuplicateFurniture] = useState(
    () => window.localStorage.getItem('mysekai_hideDuplicateFurniture') === 'true',
  );
  const [selectedTalk, setSelectedTalk] = useState(null);
  const [dialogueLines, setDialogueLines] = useState([]);
  const [dialogueLoading, setDialogueLoading] = useState(false);
  const [dialogueError, setDialogueError] = useState('');
  const [pendingImport, setPendingImport] = useState(null);
  const [duplicateTalk, setDuplicateTalk] = useState(null);
  const [showOtherTalks, setShowOtherTalks] = useState(false);
  const [expandedOtherTalkId, setExpandedOtherTalkId] = useState(null);
  const [otherTalkLines, setOtherTalkLines] = useState([]);
  const [otherTalkLoading, setOtherTalkLoading] = useState(false);
  const [showTweetsOnly, setShowTweetsOnly] = useState(false);
  const [playingVoiceName, setPlayingVoiceName] = useState(null);
  const [voiceErrorName, setVoiceErrorName] = useState(null);
  const dialogueAbortRef = useRef(null);
  const otherDialogueAbortRef = useRef(null);
  const audioRef = useRef(null);
  const seenSet = useMemo(() => new Set(seenDialogues), [seenDialogues]);

  useEffect(() => {
    window.localStorage.setItem(
      'mysekai_ownedTamagotchi',
      JSON.stringify(ownedTamagotchi),
    );
  }, [ownedTamagotchi]);

  useEffect(() => {
    window.localStorage.setItem(
      'mysekai_hideDuplicateFurniture',
      String(hideDuplicateFurniture),
    );
  }, [hideDuplicateFurniture]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingVoiceName(null);
    setVoiceErrorName(null);
  }, []);

  const playVoice = useCallback((voiceName, lua) => {
    if (!canViewDialogues || !voiceName || !lua) return;
    if (playingVoiceName === voiceName) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(getTalkVoiceUrl(lua, voiceName));
    audioRef.current = audio;
    setPlayingVoiceName(voiceName);
    audio.onended = stopAudio;
    audio.play().catch(() => {
      setVoiceErrorName(voiceName);
      setPlayingVoiceName(null);
      window.setTimeout(() => setVoiceErrorName(null), 1_000);
    });
  }, [canViewDialogues, playingVoiceName, stopAudio]);

  const closeDialogue = useCallback(() => {
    dialogueAbortRef.current?.abort();
    dialogueAbortRef.current = null;
    stopAudio();
    setSelectedTalk(null);
    setDialogueLines([]);
    setDialogueLoading(false);
    setDialogueError('');
  }, [stopAudio]);

  useEffect(() => () => {
    dialogueAbortRef.current?.abort();
    otherDialogueAbortRef.current?.abort();
    audioRef.current?.pause();
  }, []);
  useEffect(() => {
    if (!canViewDialogues) {
      closeDialogue();
      setShowOtherTalks(false);
      setShowTweetsOnly(false);
    }
  }, [canViewDialogues, closeDialogue]);

  const getCharacterTalks = useCallback((characterId) => (
    (data.talksByCharacter[characterId] || []).reduce((result, talk) => {
      const availableDuplicates = talk.duplicateFixtures.filter(({ fixture }) => (
        !TAMAGOTCHI_LIST.some((item) => item.id === fixture.id)
        || ownedTamagotchi[fixture.id]
      ));
      if (!availableDuplicates.length) return result;
      const primary = availableDuplicates.find(
        ({ fixture }) => fixture.id === talk.fixture.id,
      ) || availableDuplicates[0];
      result.push({
        ...talk,
        fixture: primary.fixture,
        scenario: primary.scenario,
        duplicateFixtures: availableDuplicates,
      });
      return result;
    }, [])
  ), [data.talksByCharacter, ownedTamagotchi]);

  const allCharacterTalks = getCharacterTalks(selectedCharacterId);
  const characterTalks = allCharacterTalks.filter((talk) => {
    const isOwned = talk.duplicateFixtures.some(
      ({ fixture }) => ownedFixtures[fixture.id],
    );
    if (ownedFilter === 'owned') return isOwned;
    if (ownedFilter === 'not_owned') return !isOwned;
    return true;
  });
  const readCount = characterTalks.reduce(
    (count, talk) => count + (seenSet.has(talk.dialogueKey) ? 1 : 0),
    0,
  );
  const characterOtherTalks = data.unmatchedTalks.filter((talk) => (
    talk.primaryCharId === selectedCharacterId
    || talk.charIds?.includes(selectedCharacterId)
  ));
  const characterTweetsOnly = data.talkWithoutRelated.filter(
    (tweet) => tweet.gameCharacterUnitId === selectedCharacterId,
  );
  const tweetTextById = useMemo(
    () => new Map(data.tweets.map((tweet) => [tweet.id, tweet.text])),
    [data.tweets],
  );

  const chooseCharacter = (characterId) => {
    closeDialogue();
    setOwnedFilter('all');
    setDuplicateTalk(null);
    setShowOtherTalks(false);
    setShowTweetsOnly(false);
    setSelectedCharacterId(characterId);
  };

  const openTalk = async (talk) => {
    if (!canViewDialogues) {
      onToggleSeen(talk.dialogueKey, talk.fixture.id);
      return;
    }

    dialogueAbortRef.current?.abort();
    const controller = new AbortController();
    dialogueAbortRef.current = controller;
    setSelectedTalk(talk);
    setDialogueLines([]);
    setDialogueError('');
    setDialogueLoading(true);
    try {
      const lines = await loadFixtureDialogue({
        assetbundleName: talk.scenario.assetbundleName,
        lua: talk.scenario.lua,
        language,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setDialogueLines(lines);
      if (!lines.length) setDialogueError(t('talks.dialogue_empty'));
    } catch {
      if (!controller.signal.aborted) setDialogueError(t('talks.dialogue_error'));
    } finally {
      if (!controller.signal.aborted) setDialogueLoading(false);
    }
  };

  const handleTalkClick = (talk) => {
    if (!canViewDialogues || isCheckMode) {
      onToggleSeen(talk.dialogueKey, talk.fixture.id);
      return;
    }
    openTalk(talk);
  };

  const loadOtherTalk = async (talk) => {
    if (!canViewDialogues) return;
    if (expandedOtherTalkId === talk.id) {
      otherDialogueAbortRef.current?.abort();
      setExpandedOtherTalkId(null);
      setOtherTalkLines([]);
      return;
    }
    otherDialogueAbortRef.current?.abort();
    const controller = new AbortController();
    otherDialogueAbortRef.current = controller;
    setExpandedOtherTalkId(talk.id);
    setOtherTalkLines([]);
    setOtherTalkLoading(true);
    try {
      const lines = await loadFixtureDialogue({
        assetbundleName: talk.assetbundleName,
        lua: talk.lua,
        language,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setOtherTalkLines(lines);
    } catch {
      if (!controller.signal.aborted) setOtherTalkLines([]);
    } finally {
      if (!controller.signal.aborted) setOtherTalkLoading(false);
    }
  };

  const exportChecklist = () => {
    const payload = {
      dialogues: seenDialogues.map((key) => (
        key.includes(':') ? key.split(':').pop() : key
      )),
      fixtures: Object.keys(ownedFixtures).map(Number),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mysekai_checklist_${currentPreset}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const readImport = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result || 'null'));
        const rawDialogues = Array.isArray(raw) ? raw : raw.dialogues;
        const fixtures = (Array.isArray(raw?.fixtures) ? raw.fixtures : [])
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0);
        const dialogues = (Array.isArray(rawDialogues) ? rawDialogues : [])
          .filter((key) => typeof key === 'string' && key.length > 0)
          .map((key) => (
            key.includes(':') ? key : `mysekai/talk/scenario/talk:${key}`
          ));
        if (!fixtures.length && !dialogues.length) throw new Error('empty');
        setPendingImport({
          fileName: file.name,
          fixtures: [...new Set(fixtures)],
          dialogues: [...new Set(dialogues)],
        });
      } catch {
        window.alert(t('talks.import_invalid'));
      }
    };
    reader.readAsText(file);
  };

  const resetChecklist = () => {
    if (!window.confirm(t('talks.reset_confirm'))) return;
    setOwnedTamagotchi({ 837: false, 838: false, 839: false, 840: false });
    onReset();
  };

  const furnitureViewTalks = (hideDuplicateFurniture
    ? characterTalks
    : characterTalks.flatMap((talk) => (
      talk.duplicateFixtures.map(({ fixture, scenario }) => ({
        ...talk,
        fixture,
        scenario,
        expandedDuplicate: true,
      }))
    ))
  ).sort((left, right) => (
    (left.fixture.seq || left.fixture.id) - (right.fixture.seq || right.fixture.id)
  ));

  const renderTalkCard = (talk, compact = false) => {
    const isRead = seenSet.has(talk.dialogueKey);
    const isOwned = talk.expandedDuplicate
      ? Boolean(ownedFixtures[talk.fixture.id])
      : talk.duplicateFixtures.some(
        ({ fixture }) => ownedFixtures[fixture.id],
      );
    const participants = talk.scenario.participantCharIds || [];
    const activate = () => handleTalkClick(talk);
    return (
      <div
        className={`mysekai-talk-card ${compact ? 'compact' : ''} ${isRead ? 'read' : 'unread'}`}
        key={`${talk.dialogueKey}-${talk.fixture.id}`}
        role="button"
        tabIndex={0}
        aria-label={talk.fixture.name}
        aria-pressed={isRead}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        }}
      >
        {(isOwned || isCheckMode) && (
          <button
            type="button"
            className={`mysekai-talk-owned-mark ${isOwned ? 'active' : ''}`}
            aria-label={t(isOwned ? 'talks.uncheck_owned' : 'talks.check_owned')}
            aria-pressed={isOwned}
            onClick={(event) => {
              event.stopPropagation();
              onToggleOwned(talk.fixture.id);
            }}
          >
            ✓
          </button>
        )}
        <FixtureImage fixture={talk.fixture} className="mysekai-talk-fixture-image" />
        {!compact && (
          <span className="mysekai-talk-fixture-name">{talk.fixture.name}</span>
        )}
        {!talk.expandedDuplicate && talk.duplicateFixtures.length > 1 && (
          canViewDialogues ? (
            <button
              type="button"
              className="mysekai-talk-duplicate-badge"
              onClick={(event) => {
                event.stopPropagation();
                setDuplicateTalk(talk);
              }}
              aria-label={t('talks.duplicate_count', {
                count: talk.duplicateFixtures.length,
              })}
            >
              +{talk.duplicateFixtures.length - 1}
            </button>
          ) : (
            <span className="mysekai-talk-duplicate-badge">
              +{talk.duplicateFixtures.length - 1}
            </span>
          )
        )}
        {participants.length > 1 && (
          <span className="mysekai-talk-card-participants">
            {participants.slice(0, 4).map((characterId) => (
              <CharacterStamp
                key={characterId}
                characterId={characterId}
                language={language}
                size={20}
              />
            ))}
          </span>
        )}
      </div>
    );
  };

  const rankPages = [];
  for (let index = 0; index < characterTalks.length; index += 6) {
    rankPages.push(characterTalks.slice(index, index + 6));
  }

  return (
    <div className="mysekai-talk-page">
      {!selectedCharacterId && (
        <div className="mysekai-talk-top-actions">
          <div className="mysekai-talk-preset-row" aria-label={t('talks.preset')}>
            {MYSEKAI_PRESETS.map((preset, index) => (
              <button
                type="button"
                key={preset}
                className={currentPreset === preset ? 'active' : ''}
                aria-pressed={currentPreset === preset}
                onClick={() => onSelectPreset(preset)}
              >
                {t('talks.preset_number', { count: index + 1 })}
              </button>
            ))}
          </div>
          <div className="mysekai-talk-file-actions">
            <button type="button" onClick={exportChecklist}>{t('talks.export')}</button>
            <label>
              {t('talks.import')}
              <input type="file" accept=".json" onChange={readImport} />
            </label>
            <button type="button" className="danger" onClick={resetChecklist}>
              {t('talks.reset')}
            </button>
          </div>
        </div>
      )}

      {!selectedCharacterId ? (
        <section className="mysekai-talk-character-picker">
          <h2>{t('talks.choose_character')}</h2>
          {UNIT_CONFIG.map((unit) => {
            const characters = unit.characters.filter(
              (characterId) => getCharacterTalks(characterId).length > 0,
            );
            if (!characters.length) return null;
            return (
              <div
                className="mysekai-talk-unit"
                key={unit.name}
                style={{
                  '--mysekai-unit-color': unit.color,
                  '--mysekai-unit-soft': `${unit.color}14`,
                  '--mysekai-character-count': characters.length,
                }}
              >
                <h3>{unit.name}</h3>
                <div>
                  {characters.map((characterId) => (
                    <button
                      type="button"
                      className="mysekai-talk-character"
                      key={characterId}
                      onClick={() => chooseCharacter(characterId)}
                    >
                      <CharacterStamp
                        characterId={characterId}
                        language={language}
                        size={46}
                      />
                      <span>{getCharacterName(characterId, language)}</span>
                      <small>
                        {t('talks.talk_count', {
                          count: getCharacterTalks(characterId).length,
                        })}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="mysekai-talk-list-section">
          <header className="mysekai-talk-list-header">
            <button type="button" onClick={() => chooseCharacter(0)}>
              ← {t('talks.back')}
            </button>
            <h2>
              {t('talks.character_talks', {
                name: getCharacterName(selectedCharacterId, language),
              })}
            </h2>
            <span>{t('talks.progress', { read: readCount, total: characterTalks.length })}</span>
          </header>

          {canViewDialogues && (characterOtherTalks.length > 0 || characterTweetsOnly.length > 0) && (
            <div className="mysekai-talk-extra-actions">
              {characterOtherTalks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherTalks(true);
                    setExpandedOtherTalkId(null);
                    setOtherTalkLines([]);
                  }}
                >
                  {t('talks.other_talks', { count: characterOtherTalks.length })}
                </button>
              )}
              {characterTweetsOnly.length > 0 && (
                <button type="button" onClick={() => setShowTweetsOnly(true)}>
                  {t('talks.tweets_only', { count: characterTweetsOnly.length })}
                </button>
              )}
            </div>
          )}

          <div className="mysekai-talk-controls">
            <div className="mysekai-talk-bulk-actions">
              {isCheckMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('talks.mark_all_confirm'))) {
                        onSetAllSeen(characterTalks, true);
                      }
                    }}
                  >
                    {t('talks.mark_all_read')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('talks.clear_all_confirm'))) {
                        onSetAllSeen(characterTalks, false);
                      }
                    }}
                  >
                    {t('talks.clear_all')}
                  </button>
                  <div className="mysekai-talk-preset-row compact" aria-label={t('talks.preset')}>
                    {MYSEKAI_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        className={currentPreset === preset ? 'active' : ''}
                        aria-pressed={currentPreset === preset}
                        onClick={() => onSelectPreset(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={exportChecklist}>{t('talks.export')}</button>
                  <label className="mysekai-talk-compact-file">
                    {t('talks.import')}
                    <input type="file" accept=".json" onChange={readImport} />
                  </label>
                </>
              )}
              <button
                type="button"
                className={isCheckMode ? 'active' : ''}
                onClick={() => setIsCheckMode((value) => !value)}
              >
                {t('talks.check_mode')}
              </button>
            </div>
          </div>

          <div className="mysekai-talk-view-toggle">
            <button
              type="button"
              className={viewMode === 'rank' ? 'active' : ''}
              onClick={() => setViewMode('rank')}
            >
              {t('talks.rank_view')}
            </button>
            <button
              type="button"
              className={viewMode === 'furniture' ? 'active' : ''}
              onClick={() => setViewMode('furniture')}
            >
              {t('talks.furniture_view')}
            </button>
          </div>

          {viewMode === 'furniture' && (
            <label className="mysekai-talk-hide-duplicates">
              <input
                type="checkbox"
                checked={hideDuplicateFurniture}
                onChange={(event) => setHideDuplicateFurniture(event.target.checked)}
              />
              {t('talks.hide_duplicates')}
            </label>
          )}

          <div className="mysekai-talk-owned-filter" role="group">
            <span>{t('talks.filter')}</span>
            {['all', 'owned', 'not_owned'].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={ownedFilter === value ? 'active' : ''}
                  aria-pressed={ownedFilter === value}
                  onClick={() => setOwnedFilter(value)}
                >
                  {t(`talks.${value}`)}
                </button>
            ))}
          </div>

          <div className="mysekai-talk-tamagotchi">
            <button
              type="button"
              onClick={() => setIsTamagotchiExpanded((value) => !value)}
              aria-expanded={isTamagotchiExpanded}
            >
              {!isTamagotchiExpanded && TAMAGOTCHI_LIST
                .filter((item) => ownedTamagotchi[item.id])
                .map((item) => (
                  <img
                    key={item.id}
                    src={`https://asset.rilaksekai.com/mysekai/thumbnail/fixture/${item.asset}/${item.asset}.webp`}
                    alt=""
                    loading="lazy"
                  />
                ))}
              {t('talks.tamagotchi')} {isTamagotchiExpanded ? '▲' : '▼'}
            </button>
            {isTamagotchiExpanded && (
              <div>
                {TAMAGOTCHI_LIST.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={ownedTamagotchi[item.id] ? 'active' : ''}
                    aria-pressed={Boolean(ownedTamagotchi[item.id])}
                    onClick={() => setOwnedTamagotchi((previous) => ({
                      ...previous,
                      [item.id]: !previous[item.id],
                    }))}
                  >
                    <img
                      src={`https://asset.rilaksekai.com/mysekai/thumbnail/fixture/${item.asset}/${item.asset}.webp`}
                      alt=""
                      loading="lazy"
                    />
                    <span>{item.names[language] || item.names.en}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {characterTalks.length ? (
            viewMode === 'rank' ? (
              <div className="mysekai-talk-rank-list">
                {rankPages.reduce((pairs, page, index) => {
                  if (index % 2 === 0) pairs.push([page, rankPages[index + 1] || []]);
                  return pairs;
                }, []).map(([left, right], pairIndex) => (
                  <div className="mysekai-talk-rank-pair" key={pairIndex}>
                    <div className="mysekai-talk-rank-page">
                      <span className="mysekai-talk-rank-number">{pairIndex + 1}</span>
                      {left.map((talk) => renderTalkCard(talk, true))}
                    </div>
                    <div className="mysekai-talk-rank-page">
                      {right.map((talk) => renderTalkCard(talk, true))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mysekai-talk-grid">
                {furnitureViewTalks.map((talk) => renderTalkCard(talk))}
              </div>
            )
          ) : (
            <p className="mysekai-talk-empty">{t('talks.no_talks')}</p>
          )}
        </section>
      )}

      {canViewDialogues && selectedTalk && (
        <DialogueModal
          talk={selectedTalk}
          title={data.talkIdToTweets[selectedTalk.scenario.talkId]?.[0]?.replace(/\\n/g, ' ')
            || t('talks.dialogue_title', {
              name: getCharacterName(
                selectedTalk.scenario.primaryCharacterId || selectedCharacterId,
                language,
              ),
            })}
          language={language}
          lines={dialogueLines}
          loading={dialogueLoading}
          error={dialogueError}
          isRead={seenSet.has(selectedTalk.dialogueKey)}
          isOwned={Boolean(ownedFixtures[selectedTalk.fixture.id])}
          onToggleRead={() => onToggleSeen(
            selectedTalk.dialogueKey,
            selectedTalk.fixture.id,
          )}
          onToggleOwned={() => onToggleOwned(selectedTalk.fixture.id)}
          onPlayVoice={(voiceName) => playVoice(voiceName, selectedTalk.scenario.lua)}
          playingVoiceName={playingVoiceName}
          voiceErrorName={voiceErrorName}
          onClose={closeDialogue}
          t={t}
        />
      )}

      {duplicateTalk && canViewDialogues && (
        <div
          className="mysekai-talk-modal-backdrop"
          role="presentation"
          onMouseDown={() => setDuplicateTalk(null)}
        >
          <section
            className="mysekai-talk-simple-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('talks.duplicate_title')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2>{t('talks.duplicate_title')}</h2>
            <div className="mysekai-talk-duplicate-list">
              {duplicateTalk.duplicateFixtures.map(({ fixture, scenario }) => (
                <button
                  type="button"
                  key={fixture.id}
                  onClick={() => {
                    setDuplicateTalk(null);
                    openTalk({
                      ...duplicateTalk,
                      fixture,
                      scenario,
                    });
                  }}
                >
                  <FixtureImage fixture={fixture} />
                  <span>{fixture.name}</span>
                  {ownedFixtures[fixture.id] && <b>✓</b>}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setDuplicateTalk(null)}>
              {t('talks.close')}
            </button>
          </section>
        </div>
      )}

      {showOtherTalks && canViewDialogues && (
        <div
          className="mysekai-talk-modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowOtherTalks(false)}
        >
          <section
            className="mysekai-talk-simple-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('talks.other_talks_title')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>{t('talks.other_talks_title')}</h2>
              <button type="button" onClick={() => setShowOtherTalks(false)}>×</button>
            </header>
            <div className="mysekai-talk-other-list">
              {characterOtherTalks.map((talk) => {
                const expanded = expandedOtherTalkId === talk.id;
                return (
                  <div key={talk.id}>
                    <button type="button" onClick={() => loadOtherTalk(talk)}>
                      <span>
                        {talk.charIds.slice(0, 3).map((characterId) => (
                          <CharacterStamp
                            key={characterId}
                            characterId={characterId}
                            language={language}
                            size={26}
                          />
                        ))}
                      </span>
                      <b>
                        {data.talkIdToTweets[talk.id]?.[0]?.replace(/\\n/g, ' ')
                          || talk.lua}
                      </b>
                      <i>{expanded ? '▲' : '▼'}</i>
                    </button>
                    {expanded && (
                      <div className="mysekai-talk-other-lines">
                        {otherTalkLoading ? (
                          <p>{t('talks.dialogue_loading')}</p>
                        ) : otherTalkLines.length ? (
                          otherTalkLines.map((line, index) => (
                            <div
                              className="mysekai-talk-dialogue-line"
                              key={`${line.voiceName || line.speaker}-${index}`}
                              style={{ borderColor: getCharacterColor(line.speakerId) }}
                            >
                              {line.speakerId ? (
                                <CharacterStamp
                                  characterId={line.speakerId}
                                  language={language}
                                  size={36}
                                />
                              ) : (
                                <span className="mysekai-talk-unknown-character">?</span>
                              )}
                              <p><RubyText text={line.text} /></p>
                              {line.voiceName && (
                                <button
                                  type="button"
                                  className="mysekai-talk-voice-button"
                                  onClick={() => playVoice(line.voiceName, talk.lua)}
                                >
                                  {playingVoiceName === line.voiceName ? 'Ⅱ' : '▶'}
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p>{t('talks.dialogue_empty')}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {showTweetsOnly && canViewDialogues && (
        <div
          className="mysekai-talk-modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowTweetsOnly(false)}
        >
          <section
            className="mysekai-talk-simple-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('talks.tweets_only_title')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>{t('talks.tweets_only_title')}</h2>
              <button type="button" onClick={() => setShowTweetsOnly(false)}>×</button>
            </header>
            <div className="mysekai-talk-tweet-list">
              {characterTweetsOnly.map((item) => (
                <div key={item.id}>
                  <CharacterStamp
                    characterId={selectedCharacterId}
                    language={language}
                    size={32}
                  />
                  <p>
                    {tweetTextById.get(item.mysekaiCharacterTalkTweetId)
                      || `#${item.mysekaiCharacterTalkTweetId}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {pendingImport && (
        <div className="mysekai-talk-modal-backdrop" role="presentation">
          <section
            className="mysekai-talk-import-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('talks.import_title')}
          >
            <h2>{t('talks.import_title')}</h2>
            <p>{pendingImport.fileName}</p>
            <p>
              {t('talks.import_summary', {
                fixtures: pendingImport.fixtures.length,
                dialogues: pendingImport.dialogues.length,
              })}
            </p>
            <small>
              {t('talks.current_summary', {
                fixtures: Object.keys(ownedFixtures).length,
                dialogues: seenDialogues.length,
              })}
            </small>
            <button
              type="button"
              className="danger"
              onClick={() => {
                onImport(pendingImport, 'replace');
                setPendingImport(null);
              }}
            >
              {t('talks.import_replace')}
            </button>
            <button
              type="button"
              onClick={() => {
                onImport(pendingImport, 'merge');
                setPendingImport(null);
              }}
            >
              {t('talks.import_merge')}
            </button>
            <button type="button" onClick={() => setPendingImport(null)}>
              {t('talks.close')}
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

const MysekaiTalksTab = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const canViewDialogues = canUseFixtureDialogues(user);
  const sync = useAccountState({
    namespace: MYSEKAI_SYNC_NAMESPACE,
    storage,
    normalize: normalizeMysekaiSnapshot,
    validate: isMysekaiSnapshot,
    isEmpty: (snapshot) => getMysekaiSnapshotStats(snapshot).total === 0,
    hasLocalOnly: hasLocalMysekaiItems,
    isConflict: hasMysekaiConflict,
    merge: mergeMysekaiSnapshots,
    enabled: Boolean(user),
    saveDelayMs: 10_000,
    refreshOnFocus: true,
    refreshDelayMs: 750,
    refreshMinIntervalMs: 1_000,
    flushOnHide: true,
    logLabel: t('talks.sync_label'),
  });
  const snapshot = normalizeMysekaiSnapshot(sync.value);
  const currentPreset = snapshot.currentPreset;
  const currentState = snapshot.presets[currentPreset];
  const [data, setData] = useState(null);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setDataError('');
    loadMysekaiTalkData({
      language,
      includeDialogueExtras: canViewDialogues,
      signal: controller.signal,
    })
      .then((nextData) => {
        if (!controller.signal.aborted) setData(nextData);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDataError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => controller.abort();
  }, [canViewDialogues, language]);

  const updateCurrentPreset = useCallback((updater) => {
    sync.setValue((previous) => {
      const normalized = normalizeMysekaiSnapshot(previous);
      const preset = normalized.currentPreset;
      return normalizeMysekaiSnapshot({
        ...normalized,
        presets: {
          ...normalized.presets,
          [preset]: updater(normalized.presets[preset]),
        },
      });
    });
  }, [sync]);

  useEffect(() => {
    if (!data || currentState.seenDialogues.length === 0) return;
    const seen = new Set(currentState.seenDialogues);
    const missingFixtureIds = new Set();
    Object.values(data.talksByCharacter).forEach((talks) => {
      talks.forEach((talk) => {
        if (!seen.has(talk.dialogueKey)) return;
        if (!currentState.ownedFixtures[talk.fixture.id]) {
          missingFixtureIds.add(talk.fixture.id);
        }
      });
    });
    if (!missingFixtureIds.size) return;
    updateCurrentPreset((preset) => {
      const owned = { ...preset.ownedFixtures };
      missingFixtureIds.forEach((fixtureId) => {
        owned[fixtureId] = true;
      });
      return { ...preset, ownedFixtures: owned };
    });
  }, [
    currentState.ownedFixtures,
    currentState.seenDialogues,
    data,
    updateCurrentPreset,
  ]);

  const toggleSeen = useCallback((dialogueKey, fixtureId) => {
    updateCurrentPreset((preset) => {
      const seen = new Set(preset.seenDialogues);
      const owned = { ...preset.ownedFixtures };
      if (seen.has(dialogueKey)) {
        seen.delete(dialogueKey);
      } else {
        seen.add(dialogueKey);
        owned[fixtureId] = true;
      }
      return {
        ...preset,
        ownedFixtures: owned,
        seenDialogues: [...seen],
      };
    });
  }, [updateCurrentPreset]);

  const toggleOwned = useCallback((fixtureId) => {
    updateCurrentPreset((preset) => {
      const owned = { ...preset.ownedFixtures };
      if (owned[fixtureId]) delete owned[fixtureId];
      else owned[fixtureId] = true;
      return { ...preset, ownedFixtures: owned };
    });
  }, [updateCurrentPreset]);

  const setAllSeen = useCallback((talks, shouldRead) => {
    updateCurrentPreset((preset) => {
      const seen = new Set(preset.seenDialogues);
      const owned = { ...preset.ownedFixtures };
      talks.forEach((talk) => {
        if (shouldRead) {
          seen.add(talk.dialogueKey);
          owned[talk.fixture.id] = true;
        } else {
          seen.delete(talk.dialogueKey);
        }
      });
      return {
        ...preset,
        ownedFixtures: owned,
        seenDialogues: [...seen],
      };
    });
  }, [updateCurrentPreset]);

  const importChecklist = useCallback((imported, mode) => {
    updateCurrentPreset((preset) => {
      const owned = mode === 'replace' ? {} : { ...preset.ownedFixtures };
      imported.fixtures.forEach((fixtureId) => {
        owned[fixtureId] = true;
      });
      const seen = mode === 'replace'
        ? new Set(imported.dialogues)
        : new Set([...preset.seenDialogues, ...imported.dialogues]);
      return {
        ...preset,
        ownedFixtures: owned,
        seenDialogues: [...seen],
      };
    });
  }, [updateCurrentPreset]);

  const resetChecklist = useCallback(() => {
    updateCurrentPreset((preset) => ({
      ...preset,
      ownedFixtures: {},
      seenDialogues: [],
    }));
  }, [updateCurrentPreset]);

  const selectPreset = useCallback((preset) => {
    if (!MYSEKAI_PRESETS.includes(preset)) return;
    sync.setValue((previous) => ({
      ...normalizeMysekaiSnapshot(previous),
      currentPreset: preset,
    }));
  }, [sync]);

  if (!data && !dataError) {
    return <div className="mysekai-talk-loading">{t('talks.loading')}</div>;
  }
  if (dataError) {
    return (
      <div className="mysekai-talk-error">
        <strong>{t('talks.load_error')}</strong>
        <span>{dataError}</span>
      </div>
    );
  }

  return (
    <>
      <MysekaiTalksView
        data={data}
        language={language}
        currentPreset={currentPreset}
        ownedFixtures={currentState.ownedFixtures}
        seenDialogues={currentState.seenDialogues}
        canViewDialogues={canViewDialogues}
        onSelectPreset={selectPreset}
        onToggleOwned={toggleOwned}
        onToggleSeen={toggleSeen}
        onSetAllSeen={setAllSeen}
        onImport={importChecklist}
        onReset={resetChecklist}
        t={t}
      />
      <AccountStateConflictDialog
        open={Boolean(sync.conflict)}
        title={t('talks.conflict_title')}
        localSummary={t('talks.conflict_summary', {
          count: sync.conflict ? getMysekaiSnapshotStats(sync.conflict.local).total : 0,
        })}
        remoteSummary={t('talks.conflict_summary', {
          count: sync.conflict ? getMysekaiSnapshotStats(sync.conflict.remote).total : 0,
        })}
        busy={sync.status === 'saving'}
        mergeHint={t('talks.conflict_hint')}
        onChoose={sync.resolveConflict}
      />
    </>
  );
};

export default MysekaiTalksTab;
