export type ActivityType = 'run' | 'bike' | 'hike' | 'swim';
export type GoalPeriod = 'weekly' | 'monthly' | 'yearly';
export type GoalMetric = 'distance' | 'time' | 'elevation';
export type Visibility = 'public' | 'followers' | 'private';

export interface Profile {
  id: string; // UUID from auth.users
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Gear {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  brand: string | null;
  model: string | null;
  initial_mileage: number;
  total_mileage: number;
  retired: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  activity_type: ActivityType;
  distance_km: number;
  moving_time: number; // in seconds
  elapsed_time: number | null;
  elevation_gain: number | null;
  start_time: string; // Timestamp
  gear_id: string | null;
  visibility: Visibility;
  route_path: any | null; // PostGIS LineString, usually handled as GeoJSON
  splits: any | null;
  created_at: string;

  // Virtual properties often joined in UI
  profile?: Profile;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  target_value: number;
  metric: GoalMetric;
  period: GoalPeriod;
  activity_type: ActivityType | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Like {
  user_id: string;
  activity_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  activity_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Keep legacy types temporarily to avoid breaking components during refactor
export interface Run {
  id: string;
  date: string;
  distance: number;
  time: string;
  pace: string;
  notes?: string;
  shoeId?: string;
  type?: 'run' | 'bike' | 'hike' | 'swim';
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

export interface Shoe {
  id: string;
  name: string;
  brand: string;
  model: string;
  distance: number;
  isRetired: boolean;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  targetTime: string;
}

export type RunType = 'recovery' | 'base' | 'long' | 'speed' | 'race' | 'workout';
