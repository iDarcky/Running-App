import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  formatDuration,
  formatPace,
  formatDate,
  formatFullDate,
  displayDistance,
  displayPaceFromStr
} from './formatters.ts';

describe('formatters', () => {
  test('displayDistance', () => {
    // Test km (default)
    assert.strictEqual(displayDistance(0), '0.00');
    assert.strictEqual(displayDistance(1), '1.00');
    assert.strictEqual(displayDistance(5.5), '5.50');
    assert.strictEqual(displayDistance(12.3456), '12.35');

    // Test mi conversion (1 km * 0.621371 = 0.621371)
    assert.strictEqual(displayDistance(0, 'mi'), '0.00');
    assert.strictEqual(displayDistance(1, 'mi'), '0.62');
    assert.strictEqual(displayDistance(5.5, 'mi'), '3.42');
    assert.strictEqual(displayDistance(10, 'mi'), '6.21');
  });

  test('displayPaceFromStr', () => {
    // Test km (returns same string)
    assert.strictEqual(displayPaceFromStr('5:00', 'km'), '5:00');
    assert.strictEqual(displayPaceFromStr('4:30', 'km'), '4:30');

    // Test mi conversion
    // 5:00 min/km = 8:03 min/mi
    assert.strictEqual(displayPaceFromStr('5:00', 'mi'), '8:03');
    // 6:00 min/km = 9:39 min/mi
    assert.strictEqual(displayPaceFromStr('6:00', 'mi'), '9:39');

    // Edge cases
    assert.strictEqual(displayPaceFromStr('', 'mi'), '');
    assert.strictEqual(displayPaceFromStr('invalid', 'mi'), 'invalid');
  });

  test('formatDuration', () => {
    // Test seconds/minutes
    assert.strictEqual(formatDuration(0.5), '0:30');
    assert.strictEqual(formatDuration(1), '1:00');
    assert.strictEqual(formatDuration(45.5), '45:30');

    // Test hours
    assert.strictEqual(formatDuration(60), '1:00:00');
    assert.strictEqual(formatDuration(75.25), '1:15:15');
  });

  test('formatPace', () => {
    // Test zero distance
    assert.strictEqual(formatPace(0, 30), '0:00');
    // Test normal pace (5km in 25 min = 5:00 min/km)
    assert.strictEqual(formatPace(5, 25), '5:00');
    // Test rounding
    assert.strictEqual(formatPace(3, 10), '3:20');
  });

  test('formatDate', () => {
    const dateStr = '2023-10-27';
    const result = formatDate(dateStr);
    // Locale-agnostic: ensure it returns a string with some content
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.length > 0);
  });

  test('formatFullDate', () => {
    const dateStr = '2023-10-27';
    const result = formatFullDate(dateStr);
    // Locale-agnostic: ensure it returns a string with some content
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.length > 0);
  });
});
