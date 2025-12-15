import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// NOTE: In a real app, this should be proxied through a backend to protect the key.
// For this demo, we assume the environment variable is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAIResponse = async (
  prompt: string,
  context: string = "You are Nexus AI, a helpful collaboration assistant."
): Promise<string> => {
  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `System Context: ${context}` },
            { text: prompt }
          ]
        }
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently experiencing connection issues. Please try again later.";
  }
};

export const summarizeConversation = async (messages: string[]): Promise<string> => {
  try {
    const conversationText = messages.join("\n");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following conversation in 3 bullet points:\n\n${conversationText}`,
    });
    return response.text || "No summary available.";
  } catch (error) {
    return "Could not generate summary.";
  }
};
