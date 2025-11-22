
import { Run, RunType, Goal, Achievement } from './types';

export const RUN_TYPE_ORDER = [
  RunType.EASY,
  RunType.RECOVERY,
  RunType.TEMPO,
  RunType.INTERVAL,
  RunType.LONG,
  RunType.RACE
];

export const RUN_TYPE_COLORS: Record<RunType, string> = {
  [RunType.EASY]: '#118AB2',      // Blue
  [RunType.RECOVERY]: '#06D6A0',  // Green (Mint)
  [RunType.TEMPO]: '#F78C6B',     // Orange/Salmon
  [RunType.INTERVAL]: '#EF476F',  // Pink/Red
  [RunType.LONG]: '#073B4C',      // Dark Blue
  [RunType.RACE]: '#FFD166',      // Yellow
};

export const SAMPLE_RUNS: Run[] = [
    { id: 'sample_1', date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], distance: 5.2, duration: 32, type: RunType.EASY, avgHr: 142, rpe: 4, cadence: 165, source: 'Manual', notes: 'Shakeout run, feeling good.' },
    { id: 'sample_2', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], distance: 12.5, duration: 78, type: RunType.LONG, avgHr: 155, rpe: 6, cadence: 162, source: 'Garmin', notes: 'Long slow distance.' },
    { id: 'sample_3', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], distance: 8.0, duration: 45, type: RunType.TEMPO, avgHr: 168, rpe: 8, cadence: 172, source: 'Strava', notes: '2x10min threshold.' },
    { id: 'sample_4', date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0], distance: 6.0, duration: 38, type: RunType.EASY, avgHr: 138, rpe: 3, cadence: 164, source: 'Manual' },
    { id: 'sample_5', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], distance: 10.0, duration: 55, type: RunType.EASY, avgHr: 145, rpe: 5, cadence: 166, source: 'Garmin' },
];

export const SAMPLE_GOALS: Goal[] = [
    { id: 'g1', type: 'distance', targetValue: 30, period: 'weekly' },
    { id: 'g2', type: 'frequency', targetValue: 4, period: 'weekly' }
];

export const ACHIEVEMENTS: Achievement[] = [
    { 
        id: 'first_steps', 
        title: 'First Steps', 
        description: 'Log your first run.', 
        iconName: 'Footprints', 
        condition: (runs) => runs.length >= 1 
    },
    { 
        id: 'week_streak', 
        title: 'Consistent', 
        description: 'Run 3 times in a week.', 
        iconName: 'Flame', 
        condition: (runs) => {
            if (runs.length < 3) return false;
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return runs.filter(r => new Date(r.date) >= weekAgo).length >= 3;
        }
    },
    { 
        id: 'distance_marathon', 
        title: 'Marathoner', 
        description: 'Accumulate 42km total distance.', 
        iconName: 'Map', 
        condition: (runs) => runs.reduce((acc, r) => acc + r.distance, 0) >= 42 
    },
    { 
        id: 'speed_demon', 
        title: 'Speed Demon', 
        description: 'Log a Tempo or Interval run.', 
        iconName: 'Zap', 
        condition: (runs) => runs.some(r => r.type === RunType.TEMPO || r.type === RunType.INTERVAL) 
    },
    { 
        id: 'early_bird', 
        title: 'Early Bird', 
        description: 'Log 5 runs.', 
        iconName: 'Sunrise', 
        condition: (runs) => runs.length >= 5
    },
    { 
        id: 'century_club', 
        title: 'Century Club', 
        description: 'Accumulate 100km total distance.', 
        iconName: 'Trophy', 
        condition: (runs) => runs.reduce((acc, r) => acc + r.distance, 0) >= 100
    }
];
