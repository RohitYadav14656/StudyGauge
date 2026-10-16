import {
  calculateNextRevisionDate,
  getStartAndEndOfDay,
} from '../src/services/revisionService.js';

describe('Spaced Revision System Logic', () => {
  describe('calculateNextRevisionDate', () => {
    const defaultIntervals = [1, 3, 7, 14, 30];

    test('stage 0 (1st revision) adds 1 day', () => {
      const baseDate = new Date('2026-09-01T10:00:00.000Z');
      const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(baseDate, defaultIntervals, 0);

      expect(intervalDays).toBe(1);
      expect(nextRevisionDate.toISOString()).toBe('2026-09-02T10:00:00.000Z');
    });

    test('stage 1 (2nd revision) adds 3 days', () => {
      const baseDate = new Date('2026-09-01T10:00:00.000Z');
      const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(baseDate, defaultIntervals, 1);

      expect(intervalDays).toBe(3);
      expect(nextRevisionDate.toISOString()).toBe('2026-09-04T10:00:00.000Z');
    });

    test('stage 2 (3rd revision) adds 7 days', () => {
      const baseDate = new Date('2026-09-01T10:00:00.000Z');
      const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(baseDate, defaultIntervals, 2);

      expect(intervalDays).toBe(7);
      expect(nextRevisionDate.toISOString()).toBe('2026-09-08T10:00:00.000Z');
    });

    test('stage 3 (4th revision) adds 14 days', () => {
      const baseDate = new Date('2026-09-01T10:00:00.000Z');
      const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(baseDate, defaultIntervals, 3);

      expect(intervalDays).toBe(14);
      expect(nextRevisionDate.toISOString()).toBe('2026-09-15T10:00:00.000Z');
    });

    test('stage 4+ (5th revision) caps at 30 days', () => {
      const baseDate = new Date('2026-09-01T10:00:00.000Z');
      const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(baseDate, defaultIntervals, 10);

      expect(intervalDays).toBe(30);
      expect(nextRevisionDate.toISOString()).toBe('2026-10-01T10:00:00.000Z');
    });

    test('supports custom interval configurations', () => {
      const customIntervals = [2, 5, 10, 20];
      const baseDate = new Date('2026-09-01T10:00:00.000Z');
      const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(baseDate, customIntervals, 1);

      expect(intervalDays).toBe(5);
      expect(nextRevisionDate.toISOString()).toBe('2026-09-06T10:00:00.000Z');
    });
  });

  describe('getStartAndEndOfDay timezone helper', () => {
    test('computes exact start and end of UTC day when offset is 0', () => {
      const targetDate = new Date('2026-09-19T14:30:00.000Z');
      const { startOfDay, endOfDay } = getStartAndEndOfDay(targetDate, 0);

      expect(startOfDay.toISOString()).toBe('2026-09-19T00:00:00.000Z');
      expect(endOfDay.toISOString()).toBe('2026-09-19T23:59:59.999Z');
    });

    test('handles UTC+5:30 offset (-330 mins offset)', () => {
      const targetDate = new Date('2026-09-19T04:00:00.000Z'); // In UTC+5:30 this is 09:30 AM Sept 19
      const { startOfDay, endOfDay } = getStartAndEndOfDay(targetDate, -330);

      expect(startOfDay.toISOString()).toBe('2026-09-18T18:30:00.000Z'); // Sept 19 00:00 IST = Sept 18 18:30 UTC
      expect(endOfDay.toISOString()).toBe('2026-09-19T18:29:59.999Z');   // Sept 19 23:59 IST = Sept 19 18:29:59.999 UTC
    });
  });
});
