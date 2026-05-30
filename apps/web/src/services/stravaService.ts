import { Run, RunType, StravaToken } from '../types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

export const syncWithStrava = (clientId: string) => {
  const redirectUri = window.location.origin;
  const scope = 'read,activity:read,activity:read_all';
  window.location.href = `${STRAVA_OAUTH_BASE}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}&state=strava_auth`;
};

export const handleStravaCallback = async (code: string, clientId: string, clientSecret: string): Promise<Run[]> => {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();
  const accessToken = data.access_token;

  const activitiesRes = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=10`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const activities = await activitiesRes.json();
  return (activities || []).filter((a: any) => a.type === 'Run').map((a: any) => ({
    id: `strava_${a.id}`,
    date: a.start_date_local.split('T')[0],
    distance: Number((a.distance / 1000).toFixed(2)),
    duration: Math.round(a.moving_time / 60),
    pace: calculatePace(a.distance / 1000, a.moving_time / 60),
    type: 'Easy',
    avgHr: Math.round(a.average_heartrate || 0),
    rpe: 0,
    source: 'Strava',
    notes: a.name
  }));
};

const calculatePace = (dist: number, time: number) => {
    if (!dist || !time) return '0:00';
    const totalSeconds = (time * 60) / dist;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
