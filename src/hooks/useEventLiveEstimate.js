import { useEffect, useMemo, useState } from 'react';
import { getMusicMetas } from '../utils/dataLoader';
import { calculateEventLiveEstimate } from '../utils/eventLiveEstimate';

export default function useEventLiveEstimate(data, bonus) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getMusicMetas().then(() => { if (active) setLoaded(true); }).catch(() => { if (active) setError('곡 계산 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); });
    return () => { active = false; };
  }, []);
  const { power, effi, internalValue, isDetailedInput, detailedSkills, eventLiveSong } = data;
  const points = useMemo(() => loaded ? calculateEventLiveEstimate({ power, effi, internalValue, isDetailedInput, detailedSkills, eventLiveSong }, bonus) : null,
    [loaded, bonus, power, effi, internalValue, isDetailedInput, detailedSkills, eventLiveSong]);
  return { points, error: error || (loaded && points === null ? '선택한 곡의 계산 데이터가 없습니다.' : ''), loading: !loaded && !error };
}
