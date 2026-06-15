export const formatDuration = (ms, t) => {
    if (!ms || ms <= 0) return t ? (t('fire.ended') || "종료됨") : "종료됨";
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    
    if (t) {
        return `${days > 0 ? days + (t('fire.days_suffix') || '일') + ' ' : ''}${hours > 0 || days > 0 ? hours + (t('fire.hours_suffix') || '시간') + ' ' : ''}${minutes}${t('fire.minutes_suffix') || '분'}`.trim();
    }
    
    return `${days}일 ${hours}시간 ${minutes}분`;
};

export const formatTime = (ts) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
