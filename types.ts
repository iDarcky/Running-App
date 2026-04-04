export type RunType = 'Easy' | 'Intervals' | 'Long Run' | 'Tempo' | 'Race' | 'Recovery';

export const RunType = {
  EASY: 'Easy' as RunType,
  INTERVALS: 'Intervals' as RunType,
  LONG: 'Long Run' as RunType,
  TEMPO: 'Tempo' as RunType,
  RACE: 'Race' as RunType,
  RECOVERY: 'Recovery' as RunType
};

export type RunSource = 'Manual' | 'Garmin' | 'Strava' | 'Apple Health' | 'Health Connect' | 'Google Fit';

export interface Shoe {
  id: string;
  brand: string;
  model: string;
  nickname?: string;
  distance: number;
  maxDistance: number;
  isRetired: boolean;
  isDefault?: boolean;
}

export interface Run {
  id: string;
  date: string;
  distance: number;
  duration: number;
  type: RunType;
  avgHr: number;
  pace: string;
  rpe: number;
  effort?: number;
  cadence?: number;
  strideLength?: number;
  groundContactTime?: number;
  elevation?: number;
  source?: RunSource;
  notes?: string;
  shoeId?: string;
}

export interface UserProfile {
  name: string;
  height: number;
  weight: number;
  age: number;
  sex: string;
  shoeModel: string;
  shoes: Shoe[];
}

export interface CoachInsights {
  fitnessSummary: string;
  formScore: number;
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

export type GoalType = 'distance' | 'duration' | 'frequency' | 'runs' | 'elevation';
export type GoalPeriod = 'weekly' | 'monthly';

export interface Goal {
  id: string;
  type: GoalType;
  target: number;
  current: number;
  deadline: string;
  targetValue?: number;
  period?: GoalPeriod;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  targetTime?: string;
  aiPlan?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  condition: (runs: Run[]) => boolean;
}

export interface StravaToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: any;
}

export interface GoogleToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope?: string;
}
