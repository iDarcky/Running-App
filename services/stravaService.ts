
import { Run, RunType, StravaToken } from '../types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

// --- OAuth Helpers ---

export const getStravaAuthUrl = (clientId: string): string => {
  const redirectUri = window.location.origin; // Redirect back to the same page
  // Explicitly request both activity:read and activity:read_all to ensure we cover all bases
  const scope = 'read,activity:read,activity:read_all,profile:read_all'; 
  // Add state=strava to distinguish from other providers
  // IMPORTANT: redirect_uri must be encoded
  return `${STRAVA_OAUTH_BASE}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}&state=strava`;
};

export const exchangeStravaToken = async (clientId: string, clientSecret: string, code: string): Promise<StravaToken> => {
  try {
    const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete: data.athlete
    };
  } catch (error) {
    console.error("Error exchanging Strava token:", error);
    throw error;
  }
};

export const refreshStravaToken = async (clientId: string, clientSecret: string, refreshToken: string): Promise<StravaToken> => {
  try {
    const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error("Error refreshing Strava token:", error);
    throw error;
  }
};

// --- API Calls ---

/**
 * Validates a token structure or basic API access
 */
export const validateStravaToken = async (accessToken: string): Promise<boolean> => {
  if (!accessToken) return false;
  try {
    const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const getStravaActivities = async (
    currentTokens: StravaToken, 
    clientId: string, 
    clientSecret: string,
    onTokenRefreshed?: (newToken: StravaToken) => void
): Promise<any[]> => {
    
    let accessToken = currentTokens.access_token;

    // Check expiration (expires_at is in seconds, Date.now() is ms)
    const nowSeconds = Math.floor(Date.now() / 1000);
    
    // If expired or about to expire (within 5 mins), refresh
    if (currentTokens.expires_at && nowSeconds >= currentTokens.expires_at - 300) {
        try {
            console.log("Strava token expired, refreshing...");
            const newToken = await refreshStravaToken(clientId, clientSecret, currentTokens.refresh_token);
            accessToken = newToken.access_token;
            
            // Callback to save new tokens to storage
            if (onTokenRefreshed) {
                onTokenRefreshed({
                    ...newToken,
                    // Ensure we keep the athlete data if not returned by refresh
                    athlete: currentTokens.athlete 
                });
            }
        } catch (e) {
            throw new Error("Failed to refresh Strava token. Please reconnect.");
        }
    }

    try {
        const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=30`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!response.ok) {
            let errData: any = {};
            let details = '';
            try {
                errData = await response.json();
                details = errData.message ? `: ${errData.message}` : '';
            } catch (e) {
                details = `: ${response.statusText}`;
            }

            // Check specifically for missing activity:read permission
            if (errData.errors && Array.isArray(errData.errors)) {
                 const missingScope = errData.errors.find((err: any) => 
                    err.resource === 'AccessToken' && 
                    (err.field === 'activity:read_permission' || err.code === 'missing_scope')
                 );
                 
                 if (missingScope) {
                     throw new Error("Permission Denied: Your token lacks 'activity:read' scope. Please reconnect and ensure all checkboxes are selected.");
                 }
                 details += ` (${JSON.stringify(errData.errors)})`;
            }
            
            if (response.status === 401) {
                throw new Error(`Unauthorized (401). Token invalid or expired. Please reconnect.`);
            }
            
            throw new Error(`Strava API Error ${response.status}${details}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error: any) {
        console.error("Strava sync error:", error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
             throw new Error("Network Error: Could not connect to Strava. This may be a CORS issue or network connectivity problem.");
        }
        throw error;
    }
};

export const mapStravaToRun = (activity: any): Run => {
    // Map workout type: 0=default, 1=race, 2=long run, 3=intervals
    let type = RunType.EASY;
    
    // Check properties safely
    const workoutType = activity.workout_type;
    
    if (workoutType === 1) type = RunType.RACE;
    else if (workoutType === 2) type = RunType.LONG;
    else if (workoutType === 3) type = RunType.INTERVAL;
    else {
        // Heuristics based on intensity if available
        if (activity.suffer_score && activity.suffer_score > 50) type = RunType.TEMPO;
    }

    // Cadence handling: Strava returns steps per minute. 
    let cadence = activity.average_cadence || 0;
    if (cadence > 0 && cadence < 110) {
        cadence = cadence * 2;
    }

    return {
        id: `strava_${activity.id}`,
        date: activity.start_date_local ? activity.start_date_local.split('T')[0] : new Date().toISOString().split('T')[0],
        distance: activity.distance ? Number((activity.distance / 1000).toFixed(2)) : 0, // meters to km
        duration: activity.moving_time ? Math.round(activity.moving_time / 60) : 0, // seconds to minutes
        type: type,
        avgHr: Math.round(activity.average_heartrate || 0),
        rpe: 0, // RPE is not standard in activity list response
        cadence: Math.round(cadence),
        strideLength: 0, // Not typically available in standard list
        source: 'Strava',
        notes: activity.name || 'Strava Activity' // Use activity title as notes
    };
};
