import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes file metadata to provide AI-powered tips.
 * This service is initialized lazily to prevent top-level crashes 
 * that result in "Blank Black Screens" during app deployment.
 */
export const analyzeFileTransfer = async (fileName: string, fileSize: number, fileType: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // Gracefully handle missing or empty API keys without crashing the whole app
    if (!apiKey || apiKey.trim() === "") {
      console.warn("Q-Beam: API_KEY is not configured. AI tips will be disabled.");
      return "Ready to beam your file securely!";
    }

    const isAudio = /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(fileName) || fileType.includes('audio');

    // Create instance right before use as per Gemini guidelines
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
    // Return fallback text instead of propagating error to UI components
    console.error("Q-Beam: Gemini analysis failed:", error);
    return "Ready to beam your file securely!";
  }
};