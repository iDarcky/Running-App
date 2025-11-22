export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes * 60) % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatPace = (distance: number, duration: number): string => {
    if (distance <= 0 || duration <= 0) return "0:00";
    const avgPaceDec = duration / distance;
    const paceMin = Math.floor(avgPaceDec);
    const paceSec = Math.round((avgPaceDec - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
};

export const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatFullDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
