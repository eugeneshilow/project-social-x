"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function fetchFromGemini(prompt: string): Promise<string> {
  try {
    // Use gemini-1.0-pro for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("[fetchFromGemini] Error:", error);
    throw error;
  }
} 