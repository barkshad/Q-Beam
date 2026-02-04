import { GoogleGenAI, Type } from "@google/genai";

// Initialization with a fallback check to prevent total app failure if the key isn't provided yet
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || 'temporary-placeholder' });
};

const ai = getAiClient();

export const analyzeFileTransfer = async (fileName: string, fileSize: number, fileType: string) => {
  if (!process.env.API_KEY) {
    return "Ready to beam your file securely!";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is about to send a file via a P2P tool. 
      File Name: ${fileName}
      File Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB
      File Type: ${fileType}
      
      Provide a 1-sentence helpful tip or interesting fact about this file type or size in the context of digital sharing. 
      Keep it professional, encouraging, and very brief.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Ready to beam your file securely!";
  }
};