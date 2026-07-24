import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { LoginProvider } from '../../login';
import MysekaiTalksTab, { MysekaiTalksView } from './MysekaiTalksTab';

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/talks', search: '', hash: '' }),
  useNavigate: () => jest.fn(),
}));

const talk = {
  fixture: {
    id: 101,
    seq: 1,
    name: '테스트 가구',
    assetbundleName: 'test_fixture',
    mysekaiFixtureType: 'fixture',
  },
  scenario: {
    assetbundleName: 'mysekai/talk/scenario/talk',
    lua: 'talk_test_001',
    primaryCharacterId: 1,
    participantCharIds: null,
    talkId: 501,
    archiveSeq: 1,
    sortOrder: 1,
  },
  dialogueKey: 'mysekai/talk/scenario/talk:talk_test_001',
  duplicateFixtures: [],
};
talk.duplicateFixtures = [{ fixture: talk.fixture, scenario: talk.scenario }];

const data = {
  fixtures: [talk.fixture],
  scenariosByFixture: { 101: [talk.scenario] },
  talksByCharacter: { 1: [talk] },
  unmatchedTalks: [],
  talkIdToTweets: { 501: ['테스트 대사 제목'] },
  talkWithoutRelated: [],
  tweets: [],
};

const tamagotchiTalk = {
  fixture: {
    id: 837,
    seq: 837,
    name: '다마고치 가구',
    assetbundleName: 'mdl_clb1102_fixture_egg1',
    mysekaiFixtureType: 'fixture',
  },
  scenario: {
    assetbundleName: 'mysekai/talk/scenario/tamagotchi',
    lua: 'talk_tamagotchi_001',
    primaryCharacterId: 1,
    participantCharIds: null,
    archiveSeq: 2,
    sortOrder: 2,
  },
  dialogueKey: 'mysekai/talk/scenario/tamagotchi:talk_tamagotchi_001',
  duplicateFixtures: [],
};
tamagotchiTalk.duplicateFixtures = [{
  fixture: tamagotchiTalk.fixture,
  scenario: tamagotchiTalk.scenario,
}];

const translations = {
  'talks.preset': '프리셋',
  'talks.preset_number': '프리셋 {{count}}',
  'talks.choose_character': '캐릭터 선택',
  'talks.talk_count': '{{count}}개',
  'talks.character_talks': '{{name}}의 가구 대사',
  'talks.back': '뒤로',
  'talks.progress': '{{read}} / {{total}} 읽음',
  'talks.all': '전체',
  'talks.unread': '안 읽음',
  'talks.read': '읽음',
  'talks.mark_all_read': '전체 읽음',
  'talks.clear_all': '전체 해제',
  'talks.mark_all_confirm': '전체 읽음 확인',
  'talks.clear_all_confirm': '전체 해제 확인',
  'talks.check_mode': '체크 모드',
  'talks.rank_view': '캐릭터 랭크창',
  'talks.furniture_view': '가구 배치창',
  'talks.hide_duplicates': '중복 대사 가구 숨기기',
  'talks.filter': '필터',
  'talks.owned': '보유',
  'talks.not_owned': '미보유',
  'talks.check_owned': '보유 체크',
  'talks.uncheck_owned': '보유 해제',
  'talks.tamagotchi': '다마고치 보유',
  'talks.other_talks': '기타 대사 ({{count}}개)',
  'talks.tweets_only': '말풍선 ({{count}}개)',
  'talks.duplicate_title': '같은 대사가 발생하는 가구',
  'talks.export': '저장',
  'talks.import': '불러오기',
  'talks.reset': '전체 초기화',
  'talks.no_talks': '대사 없음',
  'talks.duplicate_count': '같은 대사 가구 {{count}}개',
  'talks.participants': '참여',
  'talks.dialogue_loading': '대사를 불러오는 중...',
  'talks.dialogue_empty': '표시할 대사가 없습니다.',
  'talks.dialogue_error': '대사를 불러오지 못했습니다.',
  'talks.dialogue_title': '{{name}} 대사',
  'talks.mark_read': '읽음 표시',
  'talks.mark_unread': '읽음 해제',
  'talks.read_and_close': '읽음 & 닫기',
  'talks.unread_and_close': '안읽음 & 닫기',
  'talks.close': '닫기',
};

const t = (key, values = {}) => Object.entries(values).reduce(
  (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
  translations[key] || key,
);

const renderView = (overrides = {}) => {
  const props = {
    data,
    language: 'ko',
    currentPreset: 'P1',
    ownedFixtures: {},
    seenDialogues: [],
    canViewDialogues: false,
    onSelectPreset: jest.fn(),
    onToggleOwned: jest.fn(),
    onToggleSeen: jest.fn(),
    onSetAllSeen: jest.fn(),
    onImport: jest.fn(),
    onReset: jest.fn(),
    t,
    ...overrides,
  };
  return {
    props,
    ...render(<MysekaiTalksView {...props} />),
  };
};

describe('MysekaiTalksView', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('starts with character selection instead of a full furniture catalogue', () => {
    renderView();

    expect(screen.getByText('캐릭터 선택')).not.toBeNull();
    expect(screen.queryByText('테스트 가구')).toBeNull();
    expect(screen.getByText('저장')).not.toBeNull();
    expect(screen.getByText('불러오기')).not.toBeNull();
    expect(screen.getByText('전체 초기화')).not.toBeNull();
  });

  it('keeps every available character in a unit on one row', () => {
    const talksByCharacter = Object.fromEntries(
      [1, 2, 3, 4, 27, 32].map((characterId) => [characterId, [talk]]),
    );
    renderView({
      data: {
        ...data,
        talksByCharacter,
      },
    });

    const unit = screen.getByText('Leo/need').closest('.mysekai-talk-unit');
    expect(unit?.style.getPropertyValue('--mysekai-character-count')).toBe('6');
    expect(unit?.querySelectorAll('.mysekai-talk-character')).toHaveLength(6);
  });

  it('restores rank, furniture, ownership, and Tamagotchi controls', () => {
    const dataWithTamagotchi = {
      ...data,
      fixtures: [...data.fixtures, tamagotchiTalk.fixture],
      scenariosByFixture: {
        ...data.scenariosByFixture,
        837: [tamagotchiTalk.scenario],
      },
      talksByCharacter: {
        1: [talk, tamagotchiTalk],
      },
    };
    const { props } = renderView({ data: dataWithTamagotchi });

    fireEvent.click(screen.getByText('이치카').closest('button'));

    expect(screen.getByRole('button', { name: '캐릭터 랭크창' })).not.toBeNull();
    expect(screen.getByRole('button', { name: '가구 배치창' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /다마고치 보유/ })).not.toBeNull();
    expect(screen.queryByRole('button', { name: '다마고치 가구' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '가구 배치창' }));
    expect(screen.getByText('테스트 가구')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /다마고치 보유/ }));
    fireEvent.click(screen.getByRole('button', { name: '마메치' }));
    expect(screen.getByRole('button', { name: '다마고치 가구' })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '체크 모드' }));
    fireEvent.click(screen.getAllByRole('button', { name: '보유 체크' })[0]);
    expect(props.onToggleOwned).toHaveBeenCalledWith(101);
  });

  it('keeps extra and duplicate dialogue windows hidden without invite permission', () => {
    const duplicateFixture = {
      ...talk.fixture,
      id: 102,
      seq: 2,
      name: '중복 가구',
    };
    const duplicateData = {
      ...data,
      talksByCharacter: {
        1: [{
          ...talk,
          duplicateFixtures: [
            { fixture: talk.fixture, scenario: talk.scenario },
            { fixture: duplicateFixture, scenario: talk.scenario },
          ],
        }],
      },
      unmatchedTalks: [{
        id: 9001,
        primaryCharId: 1,
        charIds: [1],
        assetbundleName: 'mysekai/talk/scenario/other',
        lua: 'other_001',
      }],
      talkWithoutRelated: [{
        id: 9002,
        gameCharacterUnitId: 1,
        mysekaiCharacterTalkTweetId: 9003,
      }],
      tweets: [{ id: 9003, text: '말풍선 테스트' }],
    };
    renderView({ data: duplicateData });

    fireEvent.click(screen.getByText('이치카').closest('button'));

    expect(screen.queryByText('기타 대사 (1개)')).toBeNull();
    expect(screen.queryByText('말풍선 (1개)')).toBeNull();
    expect(screen.queryByRole('button', { name: '같은 대사 가구 2개' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('restores extra and duplicate dialogue windows for invite-enabled accounts', () => {
    const duplicateFixture = {
      ...talk.fixture,
      id: 102,
      seq: 2,
      name: '중복 가구',
    };
    const duplicateData = {
      ...data,
      talksByCharacter: {
        1: [{
          ...talk,
          duplicateFixtures: [
            { fixture: talk.fixture, scenario: talk.scenario },
            { fixture: duplicateFixture, scenario: talk.scenario },
          ],
        }],
      },
      unmatchedTalks: [{
        id: 9001,
        primaryCharId: 1,
        charIds: [1],
        assetbundleName: 'mysekai/talk/scenario/other',
        lua: 'other_001',
      }],
      talkWithoutRelated: [{
        id: 9002,
        gameCharacterUnitId: 1,
        mysekaiCharacterTalkTweetId: 9003,
      }],
      tweets: [{ id: 9003, text: '말풍선 테스트' }],
    };
    renderView({ data: duplicateData, canViewDialogues: true });

    fireEvent.click(screen.getByText('이치카').closest('button'));

    expect(screen.getByText('기타 대사 (1개)')).not.toBeNull();
    expect(screen.getByText('말풍선 (1개)')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '같은 대사 가구 2개' }));
    expect(screen.getByRole('dialog', {
      name: '같은 대사가 발생하는 가구',
    })).not.toBeNull();
    expect(screen.getByText('중복 가구')).not.toBeNull();
  });

  it('only toggles read state for users without dialogue permission', () => {
    global.fetch = jest.fn();
    const { props } = renderView();

    fireEvent.click(screen.getByText('이치카').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /테스트 가구/ }));

    expect(props.onToggleSeen).toHaveBeenCalledWith(
      'mysekai/talk/scenario/talk:talk_test_001',
      101,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/초대|열람 제한/)).toBeNull();
  });

  it('opens and loads dialogue for an invite-enabled account', async () => {
    global.fetch = jest.fn(async (input) => {
      if (String(input).endsWith('/talk_test_001.lua')) {
        return {
          ok: true,
          status: 200,
          text: async () => [
            'label("一歌")',
            'voice("talk", "voice_001", Characters.Ichika)',
            'text("테스트 대사")',
          ].join('\n'),
        };
      }
      return { ok: false, status: 404, text: async () => '' };
    });
    const { props, container } = renderView({ canViewDialogues: true });

    fireEvent.click(screen.getByText('이치카').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /테스트 가구/ }));

    const dialog = await screen.findByRole('dialog', { name: '테스트 가구' });
    expect(dialog).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByText('테스트 대사')).not.toBeNull();
    });
    expect(screen.getByText('테스트 대사 제목')).not.toBeNull();
    expect(screen.getByRole('button', { name: '보유 체크' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /읽음 & 닫기/ })).not.toBeNull();
    expect(dialog.querySelector('footer')).toBeNull();
    expect(container.querySelector('.mysekai-talk-read-mark')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '보유 체크' }));
    expect(props.onToggleOwned).toHaveBeenCalledWith(101);
    fireEvent.click(screen.getByRole('button', { name: /읽음 & 닫기/ }));
    expect(props.onToggleSeen).toHaveBeenCalledWith(
      'mysekai/talk/scenario/talk:talk_test_001',
      101,
    );
    expect(screen.queryByRole('dialog', { name: '테스트 가구' })).toBeNull();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('does not render a green check icon on read furniture cards', () => {
    const { container } = renderView({
      seenDialogues: ['mysekai/talk/scenario/talk:talk_test_001'],
    });

    fireEvent.click(screen.getByText('이치카').closest('button'));

    expect(container.querySelector('.mysekai-talk-card.read')).not.toBeNull();
    expect(container.querySelector('.mysekai-talk-read-mark')).toBeNull();
  });

  it('keeps anonymous use local without calling the account Worker', async () => {
    const rowsForUrl = (url) => {
      if (url.endsWith('/mysekaiFixtures.json')) return [talk.fixture];
      if (url.endsWith('/mysekaiCharacterTalks.json')) {
        return [{
          id: 501,
          mysekaiCharacterTalkConditionGroupId: 201,
          mysekaiGameCharacterUnitGroupId: 301,
          assetbundleName: talk.scenario.assetbundleName,
          lua: talk.scenario.lua,
          characterArchiveMysekaiCharacterTalkGroupId: 401,
        }];
      }
      if (url.endsWith('/mysekaiCharacterTalkConditions.json')) {
        return [{
          id: 101,
          mysekaiCharacterTalkConditionType: 'mysekai_fixture_id',
          mysekaiCharacterTalkConditionTypeValue: 101,
        }];
      }
      if (url.endsWith('/mysekaiCharacterTalkConditionGroups.json')) {
        return [{ groupId: 201, mysekaiCharacterTalkConditionId: 101 }];
      }
      if (url.endsWith('/mysekaiGameCharacterUnitGroups.json')) {
        return [{ id: 301, gameCharacterUnitId1: 1 }];
      }
      if (url.endsWith('/mysekaiCharacterTalkSomeCharacterTalks.json')) {
        return [{ id: 1, mysekaiCharacterTalkId: 501, mainGameCharacterUnitId: 1 }];
      }
      if (url.endsWith('/characterArchiveMysekaiCharacterTalkGroups.json')) {
        return [{ id: 401, seq: 1 }];
      }
      return [];
    };
    global.fetch = jest.fn(async (input) => ({
      ok: true,
      status: 200,
      json: async () => rowsForUrl(String(input)),
    }));

    render(
      <LanguageProvider>
        <LoginProvider authBaseUrl="" storageBaseUrl="" cacheKey="talks-anonymous-auth">
          <MysekaiTalksTab />
        </LoginProvider>
      </LanguageProvider>,
    );

    expect(await screen.findByText('캐릭터 선택')).not.toBeNull();
    const requestedUrls = global.fetch.mock.calls.map(([url]) => String(url));
    expect(requestedUrls.some((url) => url.includes('/api/auth/'))).toBe(false);
    expect(requestedUrls.some((url) => url.includes('/v1/states/'))).toBe(false);
    expect(requestedUrls.some((url) => (
      url.endsWith('/mysekaiCharacterTalkTweets.json')
      || url.endsWith('/mysekaiCharacterTalkTweetWithoutRelatedTalks.json')
      || url.endsWith('/mysekaiCharacterTalkPreActions.json')
    ))).toBe(false);

    fireEvent.click(screen.getByText('이치카').closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /테스트 가구/ }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('mysekai_seenDialogues')))
        .toEqual(['mysekai/talk/scenario/talk:talk_test_001']);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
