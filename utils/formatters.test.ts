import { describe, it, expect } from 'vitest';
import { formatPace } from './formatters';

describe('formatPace', () => {
  it('should format pace correctly for typical inputs', () => {
    // 5 distance in 25 minutes -> 5:00 pace
    expect(formatPace(5, 25)).toBe('5:00');
    // 10 distance in 55 minutes -> 5:30 pace
    expect(formatPace(10, 55)).toBe('5:30');
    // 1 distance in 8.5 minutes -> 8:30 pace
    expect(formatPace(1, 8.5)).toBe('8:30');
  });

  it('should return "0:00" when distance or duration is zero', () => {
    expect(formatPace(0, 0)).toBe('0:00');
    expect(formatPace(10, 0)).toBe('0:00');
    expect(formatPace(0, 50)).toBe('0:00');
  });

  it('should return "0:00" when distance or duration is negative', () => {
    expect(formatPace(-5, 25)).toBe('0:00');
    expect(formatPace(5, -25)).toBe('0:00');
    expect(formatPace(-10, -10)).toBe('0:00');
  });

  it('should format pace correctly for fractional inputs', () => {
    // 3.14 distance in 20 minutes -> ~6.369 -> 6:22
    expect(formatPace(3.14, 20)).toBe('6:22');
    // 5.5 distance in 27.5 minutes -> 5:00
    expect(formatPace(5.5, 27.5)).toBe('5:00');
  });

  it('should handle NaN and Infinity inputs gracefully', () => {
    expect(formatPace(NaN, 20)).toBe('0:00');
    expect(formatPace(5, NaN)).toBe('0:00');
    expect(formatPace(Infinity, 20)).toBe('0:00');
    expect(formatPace(5, Infinity)).toBe('0:00');
    expect(formatPace(NaN, NaN)).toBe('0:00');
  });
});
