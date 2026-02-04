import { GoogleGenAI } from "@google/genai";

// Strictly follow the required initialization pattern
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeFileTransfer = async (fileName: string, fileSize: number, fileType: string) => {
  // If API_KEY is missing, the environment provides a safe fallback
  if (!process.env.API_KEY) {
    return "Ready to beam your file securely!";
  }

  const isAudio = /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(fileName) || fileType.includes('audio');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is sending a ${isAudio ? 'song/audio track' : 'file'} via Q-Beam. 
      Name: ${fileName}
      Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB
      Type: ${fileType}
      
      Provide a 1-sentence helpful tip about this format for high-quality sharing. 
      If audio, mention bitrate or fidelity. Keep it brief and professional.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Optimizing your beam for speed and security...";
  }
};