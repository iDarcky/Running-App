import { Run, RunType, Goal, Shoe } from './types';

export const RUN_TYPE_ORDER: RunType[] = [
  'Easy',
  'Recovery',
  'Tempo',
  'Intervals',
  'Long Run',
  'Race'
];

export const RUN_TYPE_COLORS: Record<RunType, string> = {
  'Easy': '#3B82F6',
  'Recovery': '#10B981',
  'Tempo': '#F59E0B',
  'Intervals': '#EF4444',
  'Long Run': '#6366F1',
  'Race': '#7C3AED',
};

export const SAMPLE_GOALS: Goal[] = [
    { id: 'g1', type: 'distance', target: 30, current: 0, deadline: '' },
    { id: 'g2', type: 'runs', target: 4, current: 0, deadline: '' }
];

export const DEMO_SHOES: Shoe[] = [
    {
        id: 'demo_shoe_1',
        brand: 'Nike',
        model: 'Pegasus 40',
        distance: 0,
        maxDistance: 800,
        isRetired: false,
        isDefault: true
    },
    {
        id: 'demo_shoe_2',
        brand: 'Hoka',
        model: 'Mach 5',
        distance: 0,
        maxDistance: 600,
        isRetired: false,
        isDefault: false
    }
];

export const generateDemoRuns = (): Run[] => {
    return [
        {
            id: 'r1',
            date: new Date().toISOString().split('T')[0],
            distance: 12.5,
            duration: 65,
            pace: '5:12',
            type: 'Easy',
            avgHr: 142,
            rpe: 4,
            effort: 4,
            cadence: 172,
            elevation: 120,
            location: 'Riverside Park',
            shoeId: 'demo_shoe_1'
        },
        {
            id: 'r2',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            distance: 8.2,
            duration: 38,
            pace: '4:38',
            type: 'Tempo',
            avgHr: 165,
            rpe: 7,
            effort: 7,
            cadence: 180,
            elevation: 45,
            location: 'Track Session',
            shoeId: 'demo_shoe_2'
        }
    ];
};

export const SAMPLE_RUNS: Run[] = generateDemoRuns();
