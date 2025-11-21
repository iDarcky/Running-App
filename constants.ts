
import { Run, RunType, Goal } from './types';

export const SAMPLE_RUNS: Run[] = [];

export const SAMPLE_GOALS: Goal[] = [];

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
