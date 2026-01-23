
import { GoogleGenAI, Type } from "@google/genai";

export interface PromoScript {
  title: string;
  script: string;
  hashtags: string[];
  viralFactor: string;
}

/**
 * Generates a structured promotional script using Gemini 3 Pro.
 */
export const generatePromoDescription = async (topic: string): Promise<PromoScript | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a world-class creative director and social media strategist for Waan Keenya Bingo. 
Your goal is to create high-energy, viral promotional content for the Ethiopian market.
Waan Keenya Bingo is a high-stakes Telegram Bingo Mini App.
Brand Colors: #2563EB (Primary Blue), #F97316 (Action Gold).
Target: Young adults in Ethiopia interested in gaming and social platforms.
Tone: Energetic, trustworthy, slightly luxurious, and fast-paced.`;

  const prompt = `Create a viral social media post based on this context: "${topic}". 
The post should drive excitement for the weekly 10,000 ETB prize pool.
Mention that Waan Keenya Bingo is secure and payouts are instant.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Catchy headline."
            },
            script: {
              type: Type.STRING,
              description: "The main body of the social media post."
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Trending hashtags."
            },
            viralFactor: {
              type: Type.STRING,
              description: "Reasoning behind why this post will go viral."
            }
          },
          required: ["title", "script", "hashtags", "viralFactor"]
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as PromoScript;
    }
    return null;
  } catch (error) {
    console.error("Gemini Promo Generation Error:", error);
    return null;
  }
};
