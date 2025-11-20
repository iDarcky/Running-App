import { Run, RunType, Goal } from './types';

export const SAMPLE_RUNS: Run[] = [
  {
    id: '1',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().split('T')[0],
    distance: 5.2,
    duration: 32,
    type: RunType.EASY,
    avgHr: 145,
    rpe: 4,
    cadence: 165,
    strideLength: 0.98,
    groundContactTime: 260,
    source: 'Garmin',
    notes: 'Felt fresh, easy legs.'
  },
  {
    id: '2',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString().split('T')[0],
    distance: 8.0,
    duration: 45,
    type: RunType.TEMPO,
    avgHr: 168,
    rpe: 8,
    cadence: 172,
    strideLength: 1.05,
    groundContactTime: 240,
    source: 'Strava',
    notes: 'Hard effort in the middle 20 mins.'
  },
  {
    id: '3',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString().split('T')[0],
    distance: 6.0,
    duration: 40,
    type: RunType.RECOVERY,
    avgHr: 135,
    rpe: 3,
    cadence: 160,
    strideLength: 0.92,
    source: 'Manual',
    notes: 'Taking it easy after tempo.'
  },
  {
    id: '4',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    distance: 15.0,
    duration: 95,
    type: RunType.LONG,
    avgHr: 152,
    rpe: 6,
    cadence: 168,
    strideLength: 0.95,
    source: 'Garmin',
    notes: 'Long slow distance. Hydration was good.'
  },
  {
    id: '5',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString().split('T')[0],
    distance: 5.0,
    duration: 31,
    type: RunType.EASY,
    avgHr: 142,
    rpe: 4,
    cadence: 166,
    strideLength: 0.99,
    source: 'Apple Health',
    notes: 'Just cruising.'
  },
  {
    id: '6',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString().split('T')[0],
    distance: 7.5,
    duration: 42,
    type: RunType.INTERVAL,
    avgHr: 175,
    rpe: 9,
    cadence: 180,
    strideLength: 1.15,
    groundContactTime: 210,
    source: 'Strava',
    notes: '400m repeats x 8. Dying at the end.'
  },
  {
    id: '7',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
    distance: 18.0,
    duration: 110,
    type: RunType.LONG,
    avgHr: 155,
    rpe: 7,
    cadence: 164,
    strideLength: 0.94,
    source: 'Health Connect',
    notes: 'Knee felt a bit twingy at km 14.'
  },
  {
    id: '8',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0],
    distance: 5.0,
    duration: 35,
    type: RunType.RECOVERY,
    avgHr: 130,
    rpe: 2,
    cadence: 158,
    strideLength: 0.90,
    source: 'Health Connect',
    notes: 'Super slow shakeout.'
  },
  {
    id: '9',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0],
    distance: 10.0,
    duration: 58,
    type: RunType.TEMPO,
    avgHr: 165,
    rpe: 8,
    cadence: 174,
    strideLength: 1.02,
    groundContactTime: 235,
    source: 'Strava',
    notes: 'Solid sustained effort.'
  },
  {
    id: '10',
    date: new Date().toISOString().split('T')[0],
    distance: 12.0,
    duration: 70,
    type: RunType.EASY,
    avgHr: 148,
    rpe: 5,
    cadence: 168,
    strideLength: 0.96,
    source: 'Health Connect',
    notes: 'Imported via Health Connect. Felt strong.'
  }
];

export const SAMPLE_GOALS: Goal[] = [
    { id: '1', type: 'distance', targetValue: 40, period: 'weekly' },
    { id: '2', type: 'frequency', targetValue: 4, period: 'weekly' }
];