import { Run, RunType, GoogleToken } from '../types';

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_BASE = 'https://oauth2.googleapis.com/token';
const FITNESS_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

export const syncWithGoogleFit = (clientId: string) => {
  const redirectUri = window.location.origin;
  const scope = 'https://www.googleapis.com/auth/fitness.activity.read';
  window.location.href = `${GOOGLE_AUTH_BASE}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=google_fit_auth`;
};

export const handleGoogleFitCallback = async (code: string, clientId: string, clientSecret: string): Promise<Run[]> => {
  const response = await fetch(GOOGLE_TOKEN_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: window.location.origin
    })
  });

  const data = await response.json();
  const accessToken = data.access_token;

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const startTime = oneMonthAgo.toISOString();

  const sessionsRes = await fetch(`${FITNESS_BASE}/sessions?activityType=8&startTime=${startTime}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const sessionData = await sessionsRes.json();
  const sessions = sessionData.session || [];

  return sessions.map((s: any) => ({
    id: `google_${s.id}`,
    date: new Date(Number(s.startTimeMillis)).toISOString().split('T')[0],
    duration: Math.round((Number(s.endTimeMillis) - Number(s.startTimeMillis)) / 60000),
    distance: 0,
    pace: '0:00',
    type: 'Easy',
    avgHr: 0,
    rpe: 0,
    source: 'Google Fit',
    notes: s.name
  }));
};

export const initiateGoogleAuth = syncWithGoogleFit;
