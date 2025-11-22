
import { Run, RunType, Goal, Achievement, Shoe } from './types';

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

// --- Demo Data Generators ---

export const DEMO_SHOES: Shoe[] = [
    {
        id: 'demo_shoe_1',
        brand: 'Adidas',
        model: 'Evo SL',
        distance: 0, // Will be calculated dynamically
        maxDistance: 800,
        isRetired: false,
        isDefault: true
    },
    {
        id: 'demo_shoe_2',
        brand: 'Nike',
        model: 'Alphafly 3',
        distance: 0, // Will be calculated dynamically
        maxDistance: 400,
        isRetired: false,
        isDefault: false
    }
];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateDemoRuns = (): Run[] => {
    const runs: Run[] = [];
    const types = [
        RunType.EASY, RunType.EASY, RunType.EASY, // Higher weight for easy
        RunType.TEMPO, RunType.INTERVAL, 
        RunType.LONG, RunType.RECOVERY, 
        RunType.RACE
    ];

    const notesLibrary = [
        "Felt great today!", "Legs a bit heavy.", "Windy conditions.", "Testing the new shoes.",
        "Great weather for a run.", "Intervals were tough.", "Morning shakeout.", "Pushed the pace at the end."
    ];

    // Generate 18 runs to ensure good chart data
    for (let i = 0; i < 18; i++) {
        const daysAgo = i * 2 + getRandomInt(0, 1); // Spread out over ~36 days
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        // Ensure we get at least one of every type by forcing the first 6
        const type = i < RUN_TYPE_ORDER.length 
            ? RUN_TYPE_ORDER[i] 
            : types[getRandomInt(0, types.length - 1)];

        // Assign Shoe based on type logic
        // Speed/Race -> Alphafly (id: demo_shoe_2)
        // Daily/Easy/Long -> Evo SL (id: demo_shoe_1)
        const isSpeed = type === RunType.RACE || type === RunType.INTERVAL || type === RunType.TEMPO;
        const shoeId = isSpeed ? 'demo_shoe_2' : 'demo_shoe_1';

        // Stats based on type
        let distance = 5;
        let pace = 5.0; // min/km
        let hr = 145;

        switch(type) {
            case RunType.LONG:
                distance = getRandomInt(12, 22);
                pace = 5.5 + (Math.random() * 0.5);
                hr = getRandomInt(135, 150);
                break;
            case RunType.EASY:
            case RunType.RECOVERY:
                distance = getRandomInt(4, 10);
                pace = 5.5 + (Math.random() * 0.8);
                hr = getRandomInt(125, 140);
                break;
            case RunType.TEMPO:
                distance = getRandomInt(6, 12);
                pace = 4.5 + (Math.random() * 0.3);
                hr = getRandomInt(155, 170);
                break;
            case RunType.INTERVAL:
                distance = getRandomInt(5, 10);
                pace = 4.0 + (Math.random() * 0.5); // Include rest periods in avg
                hr = getRandomInt(150, 175);
                break;
            case RunType.RACE:
                distance = Math.random() > 0.5 ? 5 : 10;
                pace = 4.0 + (Math.random() * 0.2);
                hr = getRandomInt(170, 190);
                break;
        }

        const duration = distance * pace;

        runs.push({
            id: `demo_run_${i}`,
            date: date.toISOString().split('T')[0],
            type: type,
            distance: Number(distance.toFixed(2)),
            duration: Math.round(duration),
            avgHr: hr,
            rpe: getRandomInt(3, 9),
            cadence: getRandomInt(160, 185),
            source: 'Manual',
            notes: Math.random() > 0.5 ? notesLibrary[getRandomInt(0, notesLibrary.length - 1)] : '',
            shoeId: shoeId
        });
    }

    // Sort by date descending
    return runs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Deprecated but kept for backwards compatibility if needed
export const SAMPLE_RUNS: Run[] = generateDemoRuns();
