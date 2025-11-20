
import { Run, RunType, GoogleToken } from '../types';

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_BASE = 'https://oauth2.googleapis.com/token';
const FITNESS_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

// Helper to build auth URL
export const getGoogleAuthUrl = (clientId: string): string => {
  const redirectUri = window.location.origin;
  const scope = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read'
  ].join(' ');
  
  // state=google helps distinguish from Strava callbacks
  return `${GOOGLE_AUTH_BASE}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=google`;
};

// Exchange Code for Token
export const exchangeGoogleToken = async (clientId: string, clientSecret: string, code: string): Promise<GoogleToken> => {
  try {
    const response = await fetch(GOOGLE_TOKEN_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: window.location.origin
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Google Auth Failed: ${err.error_description || response.statusText}`);
    }

    const data = await response.json();
    const expiresAt = Date.now() + (data.expires_in * 1000);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      scope: data.scope
    };
  } catch (error) {
    console.error("Error exchanging Google token:", error);
    throw error;
  }
};

// Refresh Token
export const refreshGoogleToken = async (clientId: string, clientSecret: string, refreshToken: string): Promise<GoogleToken> => {
    try {
        const response = await fetch(GOOGLE_TOKEN_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) throw new Error('Failed to refresh Google token');

        const data = await response.json();
        const expiresAt = Date.now() + (data.expires_in * 1000);
        
        return {
            access_token: data.access_token,
            refresh_token: refreshToken, // Keep old refresh token if new one not provided
            expires_at: expiresAt,
            scope: data.scope
        };
    } catch (error) {
        console.error("Error refreshing Google token:", error);
        throw error;
    }
};

// Fetch Activities (Sessions)
export const getGoogleFitActivities = async (
    currentTokens: GoogleToken,
    clientId: string,
    clientSecret: string,
    onTokenRefreshed?: (newToken: GoogleToken) => void
): Promise<Run[]> => {

    let accessToken = currentTokens.access_token;

    // Check expiration (buffer 5 mins)
    if (Date.now() >= currentTokens.expires_at - 300000 && currentTokens.refresh_token) {
        try {
            const newToken = await refreshGoogleToken(clientId, clientSecret, currentTokens.refresh_token);
            accessToken = newToken.access_token;
            if (onTokenRefreshed) onTokenRefreshed(newToken);
        } catch (e) {
            throw new Error("Google Token Expired. Please reconnect.");
        }
    }

    try {
        // 1. Get Sessions (Activity Type 8 = Running)
        // Limit to last 30 days to avoid massive payload
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const startTime = oneMonthAgo.toISOString();

        const sessionUrl = `${FITNESS_BASE}/sessions?activityType=8&startTime=${startTime}`;
        const response = await fetch(sessionUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(`Google Fit API Error: ${response.statusText}`);

        const data = await response.json();
        const sessions = data.session || [];
        const runs: Run[] = [];

        // 2. For each session, we ideally want more stats (Distance, Steps, HR)
        // We can use the 'bucket' aggregate endpoint to get data for specific session windows
        for (const session of sessions) {
            // Basic info
            const startMs = Number(session.startTimeMillis);
            const endMs = Number(session.endTimeMillis);
            const durationMin = (endMs - startMs) / 1000 / 60;

            // To get distance/hr, we need to aggregate
            const metrics = await fetchSessionMetrics(accessToken, startMs, endMs);

            runs.push({
                id: `google_${session.id}`,
                date: new Date(startMs).toISOString().split('T')[0],
                duration: Math.round(durationMin),
                distance: metrics.distance,
                type: RunType.EASY, // Default, hard to infer from Google Fit without speed analysis
                avgHr: Math.round(metrics.avgHr),
                rpe: 0,
                cadence: metrics.cadence,
                source: 'Google Fit',
                notes: session.name || 'Google Fit Run'
            });
        }

        return runs;

    } catch (error) {
        console.error("Google Fit Sync Error:", error);
        throw error;
    }
};

async function fetchSessionMetrics(accessToken: string, startMs: number, endMs: number) {
    try {
        const response = await fetch(`${FITNESS_BASE}/dataset:aggregate`, {
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                aggregateBy: [
                    { dataTypeName: "com.google.distance.delta" },
                    { dataTypeName: "com.google.heart_rate.bpm" },
                    { dataTypeName: "com.google.step_count.delta" }
                ],
                startTimeMillis: startMs,
                endTimeMillis: endMs
            })
        });

        if (!response.ok) return { distance: 0, avgHr: 0, cadence: 0 };

        const data = await response.json();
        const bucket = data.bucket?.[0]?.dataset;
        
        let distance = 0;
        let avgHr = 0;
        let steps = 0;

        if (bucket) {
            // Distance (index 0)
            const distPoints = bucket[0]?.point || [];
            distPoints.forEach((p: any) => {
                distance += p.value?.[0]?.fpVal || 0;
            });

            // HR (index 1)
            const hrPoints = bucket[1]?.point || [];
            let totalHr = 0;
            let countHr = 0;
            hrPoints.forEach((p: any) => {
                // HR can be fpVal or intVal depending on source
                const val = p.value?.[0]?.fpVal || p.value?.[0]?.intVal || 0;
                if (val > 0) {
                    totalHr += val;
                    countHr++;
                }
            });
            if (countHr > 0) avgHr = totalHr / countHr;

            // Steps (index 2)
            const stepPoints = bucket[2]?.point || [];
            stepPoints.forEach((p: any) => {
                steps += p.value?.[0]?.intVal || 0;
            });
        }

        // Calculate Cadence (Steps per minute)
        const durationMin = (endMs - startMs) / 1000 / 60;
        const cadence = durationMin > 0 ? Math.round(steps / durationMin) : 0;

        return {
            distance: Number((distance / 1000).toFixed(2)), // meters to km
            avgHr,
            cadence
        };

    } catch (e) {
        console.warn("Failed to fetch metrics for session", e);
        return { distance: 0, avgHr: 0, cadence: 0 };
    }
}
