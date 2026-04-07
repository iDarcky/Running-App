import { describe, it, expect } from 'vitest';
import { formatPace } from './formatters';

describe('formatPace', () => {
    it('formats normal pace correctly', () => {
        // distance: 5 km, duration: 30 minutes => 6 min/km
        expect(formatPace(5, 30)).toBe('6:00');

        // distance: 5 km, duration: 25 minutes => 5 min/km
        expect(formatPace(5, 25)).toBe('5:00');

        // distance: 10 km, duration: 45.5 minutes => 4.55 min/km => 4:33
        expect(formatPace(10, 45.5)).toBe('4:33');
    });

    it('returns 0:00 for zero inputs', () => {
        expect(formatPace(0, 0)).toBe('0:00');
        expect(formatPace(0, 30)).toBe('0:00');
        expect(formatPace(5, 0)).toBe('0:00');
    });

    it('returns 0:00 for negative inputs', () => {
        expect(formatPace(-5, 30)).toBe('0:00');
        expect(formatPace(5, -30)).toBe('0:00');
        expect(formatPace(-5, -30)).toBe('0:00');
    });
});
