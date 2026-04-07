import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('geminiService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear any cached imports of geminiService
    vi.resetModules();
    // Create a copy of the environment before each test
    process.env = { ...originalEnv };
  });

  it('should throw an error when API_KEY is missing', async () => {
    // Ensure API_KEY is not set
    delete process.env.API_KEY;

    // Dynamically import the module so it evaluates with the modified process.env
    const { generateCoachInsights } = await import('./geminiService');

    const mockRuns = [
      {
        id: '1',
        date: '2023-01-01',
        distance: 5,
        duration: 1800,
        pace: '6:00',
        cadence: 160,
        heartRate: 145,
        feeling: 'good' as const,
        type: 'base' as const
      }
    ];

    // Assert that the function throws the expected error
    await expect(generateCoachInsights(mockRuns)).rejects.toThrow(
      "Gemini API Key is missing. Please check your configuration."
    );
  });
});
