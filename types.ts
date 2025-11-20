
export enum RunType {
  EASY = 'Easy Run',
  TEMPO = 'Tempo Run',
  INTERVAL = 'Intervals',
  LONG = 'Long Run',
  RACE = 'Race',
  RECOVERY = 'Recovery'
}

export type RunSource = 'Manual' | 'Garmin' | 'Strava' | 'Apple Health' | 'Health Connect';

export interface Run {
  id: string;
  date: string; // ISO date string
  distance: number; // in km
  duration: number; // in minutes
  type: RunType;
  avgHr: number; // bpm
  rpe: number; // 1-10
  cadence?: number; // spm
  strideLength?: number; // meters
  groundContactTime?: number; // ms
  source?: RunSource;
  notes?: string;
}

export interface UserProfile {
  name: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  sex: 'Male' | 'Female' | 'Other' | '';
  shoeModel: string;
}

export interface InsightResponse {
  fitnessSummary: string;
  formAnalysis: string;
  injuryRiskAssessment: string;
  trends: {
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  trainingFocus: string;
  actionableTips: string[];
}

export type GoalType = 'distance' | 'duration' | 'frequency';
export type GoalPeriod = 'weekly' | 'monthly';

export interface Goal {
  id: string;
  type: GoalType;
  targetValue: number;
  period: GoalPeriod;
}
