import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes file metadata to provide AI-powered tips.
 * Initialized lazily to prevent app-level crashes if the API key is missing during boot.
 */
export const analyzeFileTransfer = async (fileName: string, fileSize: number, fileType: string) => {
  const apiKey = process.env.API_KEY;

  // Gracefully exit if no key is provided, preventing the "Blank Screen" crash
  if (!apiKey) {
    return "Ready to beam your file securely!";
  }

  const isAudio = /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(fileName) || fileType.includes('audio');

  try {
    // Initialize the client only when needed
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is sending a ${isAudio ? 'song/audio track' : 'file'} via Q-Beam. 
      Name: ${fileName}
      Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB
      Type: ${fileType}
      
      Provide a 1-sentence helpful tip about this format for high-quality sharing. 
      If audio, mention bitrate or fidelity. Keep it brief and professional.`,
    });
    
    return response.text || "Optimizing your beam for speed and security...";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Ready to beam your file securely!";
  }
};