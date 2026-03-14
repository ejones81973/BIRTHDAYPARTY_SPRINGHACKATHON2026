//import 'dotenv/config';
import {SYSTEM_INSTRUCTIONS} from "./system_instructions.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API (Ensure your .env has GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const getCoachModel = (dynamicInstructions) => {
  return genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview", 
    // Use the dynamic instructions if provided, otherwise fallback to base
    systemInstruction: dynamicInstructions || SYSTEM_INSTRUCTIONS,
  });
};

/**
 * 1. MAIN CHAT: Handles the conversational logic
 */
export async function ai_chat(userText, profile, sections, history = []) {
  const identityHeader = `
    USER PROFILE:
    - Name: ${profile.name}
    - Company: ${profile.company}
    - Industry: ${profile.industry}
    - Problem: ${profile.problem}
    - Solution: ${profile.solution}
    - Ask: ${profile.ask}
    
    INSTRUCTIONS:
    ${SYSTEM_INSTRUCTIONS}
  `;
  
  const model = getCoachModel(identityHeader); // Your existing helper

  // 1. Initialize a chat session with the previous history
  const chat = model.startChat({
    history: history, // This is the crucial part!
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  // 2. Use sendMessage instead of generateContent
  const result = await chat.sendMessage(userText);
  const response = await result.response;
  
  return { type: "message", text: response.text() };
}

/**
 * 2. DRAFTING: Generates a specific section based on profile
 */
export async function ai_draftSection(key, profile) {
  const model = getCoachModel(`You are a world-class venture architect. 
  Draft the "${key}" section of a pitch for ${profile.company} in the ${profile.industry} space. 
  Keep it under 60 words. Focus on: ${profile.problem}. 
  The ask is ${profile.ask}.`);

  const result = await model.generateContent("Generate only the pitch text, no conversational filler.");
  return (await result.response).text();
}

/**
 * 3. ANALYSIS: The "Auditor" role
 */
export async function ai_fullAnalysis(sections, profile) {
  const model = getCoachModel(`Analyze this pitch for ${profile.company}. 
  Return your response strictly as a JSON object with this structure: 
  { "score": number, "breakdown": { "premise": { "score": number, "comment": string }, ... }, "strengths": [string], "improvements": [string] }`);

  const prompt = `Pitch Sections: ${JSON.stringify(sections)}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Strip markdown code blocks if the AI includes them
  const cleanedJson = text.replace(/```json|```/g, "");
  return JSON.parse(cleanedJson);
}

/**
 * 4. REFINE: Polishes existing text
 */
export async function ai_refine(key, content, instruction) {
  const model = getCoachModel(`Refine the following pitch text for the ${key} section. 
  User Instruction: ${instruction}`);
  
  const result = await model.generateContent(content);
  return (await result.response).text();
}

/**
 * 5. DELIVERY: Analyzes practice transcripts
 */
export async function ai_deliveryAnalysis(transcript, durationSec) {
  const model = getCoachModel(`Analyze this verbal pitch transcript for clarity and confidence. 
  Return a JSON object: { "overallScore": number, "pace": number, "clarity": number, "confidence": number, "suggestions": [string] }`);

  const result = await model.generateContent(`Transcript: ${transcript}. Duration: ${durationSec} seconds.`);
  const cleanedJson = result.response.text().replace(/```json|```/g, "");
  return JSON.parse(cleanedJson);
}

export async function ai_scoreCompare(content) {
  const model = getCoachModel("Score this pitch segment on a scale of 1-100. Return a JSON object: { \"score\": number, \"grade\": string, \"verdict\": string }");
  const result = await model.generateContent(content);
  const cleanedJson = result.response.text().replace(/```json|```/g, "");
  return JSON.parse(cleanedJson);
}