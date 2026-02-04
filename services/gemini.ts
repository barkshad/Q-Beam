import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || 'temporary-placeholder' });
};

const ai = getAiClient();

export const analyzeFileTransfer = async (fileName: string, fileSize: number, fileType: string) => {
  if (!process.env.API_KEY) {
    return "Ready to beam your file securely!";
  }

  const isAudio = /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(fileName) || fileType.includes('audio');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is about to send a ${isAudio ? 'song or audio track' : 'file'} via Q-Beam. 
      File Name: ${fileName}
      File Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB
      File Type: ${fileType}
      
      Provide a 1-sentence helpful tip or interesting fact about this ${isAudio ? 'audio format' : 'file type'} in the context of digital sharing or fidelity. 
      If it's audio, mention something about bitrate or high-fidelity sharing.
      Keep it professional, encouraging, and very brief.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Ready to beam your file securely!";
  }
};