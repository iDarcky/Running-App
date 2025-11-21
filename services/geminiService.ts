import { GoogleGenAI, Type } from "@google/genai";
import { Run, InsightResponse, UserProfile, Race } from '../types';

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const apiKey = process.env.API_KEY;
// Initialize only if key exists, but throw specific errors in functions if it's missing.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeRunningData = async (runs: Run[], profile?: UserProfile): Promise<InsightResponse> => {
  if (!ai) throw new Error("Gemini API Key is missing. Please check your configuration.");

  // Sort runs by date desc
  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // Take last 15 runs to avoid token limits if user has thousands
  const recentRuns = sortedRuns.slice(0, 15);

  const profileContext = profile ? `
    User Profile:
    - Name: ${profile.name || 'Runner'}
    - Age: ${profile.age}
    - Sex: ${profile.sex}
    - Weight: ${profile.weight}kg
    - Height: ${profile.height}cm
    - Current Shoe: ${profile.shoeModel}
  ` : 'User Profile: Not provided';

  const systemInstruction = `
    You are an elite running coach and biomechanics expert.
    Your goal is to analyze running data to prevent injury, improve form, and suggest training focus.
    ${profileContext}
    Take the user's biomechanical profile into account when analyzing form (cadence, stride) and injury risks.
    Address the user by name if available.
  `;

  const prompt = `
    Analyze the following running data from my recent training history. 
    Note that some runs include advanced metrics like Cadence (spm), Stride Length (m), and Ground Contact Time (ms).
    
    Data:
    ${JSON.stringify(recentRuns)}
    
    Provide a comprehensive analysis including:
    1. A summary of my current fitness level.
    2. A numerical Form Score from 0 to 100 based on cadence, consistency, and efficiency (0 is poor, 100 is elite).
    3. An analysis of my RUNNING FORM based on cadence and stride length data.
    4. An INJURY RISK assessment based on training load, intensity changes, and biomechanics.
    5. 3 distinct trends you observe (e.g., pace progression, heart rate drift, consistency issues). Label them as positive, negative, or neutral.
    6. A specific primary training focus for the next 4 weeks.
    7. 3 concrete, actionable tips to improve performance or prevent injury.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fitnessSummary: { type: Type.STRING },
            formScore: { type: Type.INTEGER },
            formAnalysis: { type: Type.STRING },
            injuryRiskAssessment: { type: Type.STRING },
            trends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
                }
              }
            },
            trainingFocus: { type: Type.STRING },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Received empty response from AI");
    return JSON.parse(jsonText) as InsightResponse;
  } catch (error) {
    console.error("Error analyzing runs:", error);
    throw error;
  }
};

export const generateRacePlan = async (race: Race, runs: Run[], profile?: UserProfile): Promise<string | null> => {
  if (!ai) throw new Error("Gemini API Key is missing. Please check your configuration.");

  const profileContext = profile ? `User: ${profile.name}, Age ${profile.age}, ${profile.weight}kg` : '';

  const systemInstruction = `
    You are an expert running coach specializing in race preparation.
    Create personalized, high-level training strategies for specific races.
    Format your response using strict Markdown for readability:
    - Use "## " for main sections (e.g. "Current Status", "The Plan", "Key Workouts").
    - Use "### " for subsections or specific weeks.
    - Use "- " for bullet points.
    - Use "**bold**" for emphasis on key workouts or paces.
    Keep the tone encouraging but realistic.
  `;

  const prompt = `
    Race: ${race.name} on ${race.date}.
    Distance: ${race.distance}km.
    Goal Time: ${race.targetTime || 'Finish strong'}.
    
    ${profileContext}
    
    Recent runs: ${JSON.stringify(runs.slice(0, 10))}

    Create a personalized training strategy for this race.
    Analyze my recent volume and pace compared to the race distance and goal.
    Provide a high-level weekly structure (e.g. "Focus on long runs for 2 weeks, then taper").
    Include specific key workouts.
  `;

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              systemInstruction: systemInstruction
          }
      });
      return response.text;
  } catch (e) {
      console.error(e);
      throw e;
  }
};

export const chatWithRunCoach = async (history: {role: 'user'|'model', text: string}[], newMessage: string, runs: Run[], profile?: UserProfile) => {
    if (!ai) throw new Error("Gemini API Key is missing.");

    const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    
    const profileStr = profile ? `User Profile: Name: ${profile.name || 'Runner'}, Age ${profile.age}, ${profile.sex}, ${profile.weight}kg, ${profile.height}cm.` : '';

    const systemInstruction = `
      You are "RedLine", an AI running coach. 
      You have access to the user's recent running data including advanced metrics like cadence and stride length: ${JSON.stringify(sortedRuns)}.
      ${profileStr}
      Refer to specific runs (dates, distances, paces, cadence) to support your answers.
      Be encouraging but realistic. Focus on longevity, form, and performance.
      Keep answers concise (under 150 words) unless asked for a detailed plan.
    `;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        },
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
};