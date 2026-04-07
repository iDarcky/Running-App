import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleStravaCallback } from './stravaService';

describe('stravaService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe('handleStravaCallback', () => {
    it('should throw an error if token exchange fails', async () => {
      // Mock the token exchange to fail
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as Response);

      await expect(
        handleStravaCallback('mock_code', 'mock_client_id', 'mock_client_secret')
      ).rejects.toThrow('Failed to exchange token: Bad Request');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            client_id: 'mock_client_id',
            client_secret: 'mock_client_secret',
            code: 'mock_code',
            grant_type: 'authorization_code',
          }),
        })
      );
    });

    it('should throw an error if activities fetch fails', async () => {
      // Mock the token exchange to succeed
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock_access_token' }),
      } as Response);

      // Mock the activities fetch to fail
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(
        handleStravaCallback('mock_code', 'mock_client_id', 'mock_client_secret')
      ).rejects.toThrow('Failed to fetch activities: Unauthorized');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        'https://www.strava.com/api/v3/athlete/activities?per_page=10',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock_access_token' },
        })
      );
    });

    it('should return a list of runs if both API calls succeed', async () => {
      // Mock the token exchange to succeed
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock_access_token' }),
      } as Response);

      // Mock the activities fetch to succeed
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            type: 'Run',
            id: 123,
            start_date_local: '2023-10-27T10:00:00Z',
            distance: 5000,
            moving_time: 1800,
            average_heartrate: 150,
            name: 'Morning Run',
          },
          {
            type: 'Ride', // Should be filtered out
            id: 124,
            start_date_local: '2023-10-28T10:00:00Z',
            distance: 20000,
            moving_time: 3600,
            average_heartrate: 130,
            name: 'Morning Ride',
          },
        ],
      } as Response);

      const runs = await handleStravaCallback('mock_code', 'mock_client_id', 'mock_client_secret');

      expect(runs).toHaveLength(1);
      expect(runs[0]).toEqual({
        id: 'strava_123',
        date: '2023-10-27',
        distance: 5,
        duration: 30, // 1800 / 60
        pace: '6:00', // (1800 * 60) / 5000 = 21.6 -> 21.6 / 60 -> Wait, manual check: 5km in 30min is 6:00/km
        type: 'Easy',
        avgHr: 150,
        rpe: 0,
        source: 'Strava',
        notes: 'Morning Run',
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
