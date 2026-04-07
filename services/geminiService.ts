import { Run, UserProfile, CoachInsights } from '../types';
import { supabase } from './supabaseClient';

export const generateCoachInsights = async (runs: Run[], profile?: UserProfile): Promise<CoachInsights> => {
  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  try {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: {
        type: 'insights',
        runs: sortedRuns,
        profile
      }
    });

    if (error) {
      console.error("Supabase Edge Function error:", error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }

    // Validate that the response has the required properties
    if (!data || !data.report_title || !data.suggested_next_workout) {
         console.error("Invalid response format from AI:", data);
         throw new Error("AI returned an invalid format");
    }

    return data as CoachInsights;
  } catch (error: any) {
    console.error("Error calling AI coach:", error);
    throw error;
  }
};

export const getCoachChatResponse = async (message: string, runs: Run[], profile?: UserProfile): Promise<string> => {
  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  try {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: {
        type: 'chat',
        message,
        runs: sortedRuns,
        profile
      }
    });

    if (error) {
      console.error("Supabase Edge Function error:", error);
      throw new Error(`Failed to get chat response: ${error.message}`);
    }

    return data.text;
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    throw error;
  }
};

export const generateRaceStrategy = async (race: any, runs: Run[], profile?: UserProfile): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: {
        type: 'chat', // Use chat type for raw string generation
        message: `Race Strategy Request: Race: ${race.name} on ${race.date}, Distance: ${race.distance}km, Goal Time: ${race.targetTime || 'Finish strong'}. Create a personalized high-level training strategy based on recent volume. Include specific key workouts.`,
        runs: runs,
        profile
      }
    });

    if (error) {
      console.error("Supabase Edge Function error:", error);
      throw new Error(`Failed to generate strategy: ${error.message}`);
    }

    return data.text;
  } catch (error: any) {
    console.error("Error calling AI coach for strategy:", error);
    throw error;
  }
};
