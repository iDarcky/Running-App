import test from 'node:test';
import assert from 'node:assert';
import { formatDuration } from './formatters.ts';

test('formatDuration', async (t) => {
  await t.test('formats 0 minutes correctly', () => {
    assert.strictEqual(formatDuration(0), '0:00');
  });

  await t.test('formats fractions of a minute (seconds only)', () => {
    assert.strictEqual(formatDuration(0.5), '0:30'); // 30 seconds
    assert.strictEqual(formatDuration(0.25), '0:15'); // 15 seconds
  });

  await t.test('formats minutes without hours', () => {
    assert.strictEqual(formatDuration(59), '59:00');
    assert.strictEqual(formatDuration(45.5), '45:30');
  });

  await t.test('formats exactly 1 hour', () => {
    assert.strictEqual(formatDuration(60), '1:00:00');
  });

  await t.test('formats hours and minutes', () => {
    assert.strictEqual(formatDuration(61), '1:01:00');
    assert.strictEqual(formatDuration(90), '1:30:00');
  });

  await t.test('formats hours, minutes, and seconds', () => {
    assert.strictEqual(formatDuration(61.5), '1:01:30');
    assert.strictEqual(formatDuration(119.9), '1:59:54'); // 119.9 = 1h 59m 54s
    assert.strictEqual(formatDuration(125.25), '2:05:15'); // 2h 5m 15s
  });
});
