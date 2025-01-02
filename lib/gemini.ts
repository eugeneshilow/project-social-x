"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function fetchFromGemini(prompt: string): Promise<string> {
  console.log("[fetchFromGemini] Starting with prompt length:", prompt.length);
  console.log("[fetchFromGemini] First 100 chars of prompt:", prompt.slice(0, 100));
  
  try {
    console.log("[fetchFromGemini] Initializing model with config...");
    // Use the most capable model with specific generation config
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    console.log("[fetchFromGemini] Model initialized successfully");

    // Generate content
    console.log("[fetchFromGemini] Generating content...");
    const result = await model.generateContent(prompt);
    console.log("[fetchFromGemini] Content generated, getting response...");
    
    const response = await result.response;
    const text = response.text();
    console.log("[fetchFromGemini] Response received, length:", text.length);
    console.log("[fetchFromGemini] First 100 chars of response:", text.slice(0, 100));
    
    return text;
  } catch (error) {
    console.error("[fetchFromGemini] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      prompt: prompt.slice(0, 100) + "..."
    });
    throw error;
  }
} 