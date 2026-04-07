export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes * 60) % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatPace = (distance: number, duration: number): string => {
    if (distance <= 0 || duration <= 0 || Number.isNaN(distance) || Number.isNaN(duration) || !Number.isFinite(distance) || !Number.isFinite(duration)) return "0:00";
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

export const KM_TO_MILES = 0.621371;

export const displayDistance = (kmDistance: number, unit: 'km' | 'mi' = 'km'): string => {
  if (unit === 'mi') {
    return (kmDistance * KM_TO_MILES).toFixed(2);
  }
  return kmDistance.toFixed(2);
};

export const displayPaceFromStr = (paceStr: string, unit: 'km' | 'mi' = 'km'): string => {
  if (unit === 'km' || !paceStr || !paceStr.includes(':')) return paceStr;

  const [min, sec] = paceStr.split(':').map(Number);
  const totalMinutesPerKm = min + (sec / 60);
  const totalMinutesPerMi = totalMinutesPerKm / KM_TO_MILES;

  const paceMin = Math.floor(totalMinutesPerMi);
  const paceSec = Math.round((totalMinutesPerMi - paceMin) * 60);

  return `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
};
