import { SYSTEM_INSTRUCTIONS } from "./system_instructions.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ── Correct model name ────────────────────────────────────────────────────────
// "gemini-2.5-flash" is the current fast, capable model.
// "gemini-3.1-flash-lite-preview" does not exist and will throw an API error.
const MODEL = "gemini-2.5-flash";

// ── Model factory ─────────────────────────────────────────────────────────────
// SYSTEM_INSTRUCTIONS is always the base — it's never overwritten.
// Extra per-call context is appended after it so the PITCH persona persists
// across every single function call.
const getCoachModel = (extraSystemContext = "") => {
  const systemInstruction = extraSystemContext
    ? `${SYSTEM_INSTRUCTIONS}\n\n${extraSystemContext}`
    : SYSTEM_INSTRUCTIONS;

  return genAI.getGenerativeModel({ model: MODEL, systemInstruction });
};

// ══════════════════════════════════════════════════════════════════════════════
//  CONTEXT BUILDERS
//  These format profile and sections into readable blocks injected into the
//  system instruction of every AI call that needs them.
//  This is why the model can give advice like "your Premise is vague — it
//  contradicts the specific numbers you used in Clarify" rather than generic
//  coaching that ignores what the founder has actually written.
// ══════════════════════════════════════════════════════════════════════════════

function buildProfileContext(profile) {
  if (!profile) return "";
  return `FOUNDER PROFILE:
- Name:     ${profile.name     || "unknown"}
- Company:  ${profile.company  || "unknown"}
- Industry: ${profile.industry || "unknown"}
- Stage:    ${profile.stage    || "unknown"}
- Ask:      ${profile.ask      || "unknown"}
- Problem:  ${profile.problem  || "unknown"}
- Solution: ${profile.solution || "unknown"}
- Traction: ${profile.traction || "none stated"}
- Audience: ${profile.audience || "unknown"}`;
}

function buildSectionsContext(sections) {
  if (!sections || !Object.values(sections).some((v) => v?.trim())) {
    return "CURRENT PITCH SECTIONS: (none written yet)";
  }

  const KEYS   = ["premise", "idea", "tell", "clarify", "help"];
  const LABELS = {
    premise: "Premise [P] — Problem / Hook",
    idea:    "Idea    [I] — Solution / Importance",
    tell:    "Tell    [T] — Transformation / Proof",
    clarify: "Clarify [C] — Connection / Quantified Value",
    help:    "Help    [H] — Call to Action / Ask",
    heart:   "Heart   [<3] - Purpose / Why / Emotional Attachment"
  };

  const lines = KEYS.map((k) => {
    const content = sections[k]?.trim();
    return content
      ? `[${LABELS[k]}]\n${content}`
      : `[${LABELS[k]}]\n(empty)`;
  }).join("\n\n");

  return `CURRENT PITCH SECTIONS:\n${lines}`;
}

// Strips markdown code fences and parses JSON safely
function extractJSON(raw) {
  return JSON.parse(raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim());
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. MAIN CHAT
//  Handles the conversational coaching loop.
//  sections is injected into the system instruction so the AI always knows
//  what is written in the right panel before responding. It can then say
//  "your Tell section already mentions X — let's build on that" rather than
//  giving advice that contradicts or ignores existing content.
// ══════════════════════════════════════════════════════════════════════════════
export async function ai_chat(userText, profile, sections, history = []) {
  const extraCtx = `
${buildProfileContext(profile)}

${buildSectionsContext(sections)}

You are coaching this founder in real time. Reference their actual sections
when giving advice — quote specific phrases, point to concrete gaps, suggest
exact edits. Never give generic pitch advice when you can be specific to
what they have already written above.`;

  const model = getCoachModel(extraCtx);

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 1000 },
  });

  const result = await chat.sendMessage(userText);
  return { type: "message", text: result.response.text() };
}

// ══════════════════════════════════════════════════════════════════════════════
//  2. DRAFT A SECTION
//  Generates a single PITCH section from scratch or improves an existing one.
//  sections is passed so the AI reads the other 4 sections before writing —
//  it won't repeat claims, will match the tone, and will keep the narrative
//  arc coherent across the whole deck.
// ══════════════════════════════════════════════════════════════════════════════
export async function ai_draftSection(key, profile, sections = {}) {
  const sectionGuides = {
    premise: `Open with a vivid scenario or sharp statistic that makes the reader
instantly feel the problem. End with why today's solutions fall short.
3-5 sentences. Do not mention the solution yet.`,

    idea: `Lead with ONE powerful positioning sentence:
"[Company] is the [category] that [does X] for [audience] without [pain]."
Follow with 1-2 sentences on the core mechanism. Be specific — no vague adjectives.`,

    tell: `Walk through the customer experience as a vivid before/after story
OR a clear 3-step numbered flow. Make the reader visualize using it.
Weave in traction as social proof at the end if available.`,

    clarify: `Write exactly 3 quantified differentiators.
Format: "(1) [Benefit] — [specific number vs status quo]. (2) [Benefit] — [number]. (3) [Benefit] — [number]."
Numbers over adjectives, always. No generic claims.`,

    help: `State the raise amount in the first sentence. Give 2-3 use-of-funds
buckets with percentages or dollar amounts. Name the exact 18-month milestone
this capital unlocks. Close with one sentence on why now is the right moment.`,
  };

  const extraCtx = `
${buildProfileContext(profile)}

${buildSectionsContext(sections)}

You are drafting the ${key.toUpperCase()} section of this founder's PITCH deck.

IMPORTANT: Read the other sections above before writing. Your draft must be
consistent in tone and narrative — do not repeat claims already made in other
sections. Build on what exists, don't contradict it.

Section writing guide: ${sectionGuides[key] || "Write a compelling, specific, investor-ready paragraph."}

Return ONLY the section text — no headers, no labels, no code fences. Plain prose only.`;

  const model = getCoachModel(extraCtx);
  const result = await model.generateContent(
    `Write the ${key.toUpperCase()} section now. Keep it under 80 words. No conversational filler.`
  );
  return result.response.text();
}

// ══════════════════════════════════════════════════════════════════════════════
//  3. FULL ANALYSIS
//  Scores all 5 sections using the PITCH framework.
//  sections is the primary subject of analysis — profile provides company
//  context so comments can reference the founder by name and industry.
// ══════════════════════════════════════════════════════════════════════════════
export async function ai_fullAnalysis(sections, profile) {
  const extraCtx = `
${buildProfileContext(profile)}

${buildSectionsContext(sections)}

You are in REVIEWER MODE performing a full PITCH scorecard on the sections above.

Score each section against its specific PITCH criterion:
[P] Premise  — Is the problem vivid, specific, and emotionally felt?
[I] Idea     — Is the differentiation real? Is the solution crystal-clear?
[T] Tell     — Is there proof? Is the transformation story compelling?
[C] Clarify  — Are there ≥3 quantified differentiators with real numbers?
[H] Help     — Is the ask specific with use-of-funds and a milestone?
[H] Heart    - How much does this mean to the creator? Emotional investiment?

Scoring rubric:
90-100 Exceptional, investor-ready  |  75-89 Strong, minor gaps
60-74  Solid but needs sharpening   |  45-59 Developing, elements vague
0-44   Needs significant work       |  Empty sections score 5-15

Respond with valid JSON only — no markdown fences, no text outside the object.`;

  const model = getCoachModel(extraCtx);

  const prompt = `Analyze the pitch sections ${JSON.stringify(sections)} and return this exact JSON:
{
  "score": <overall 0-100 integer>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
  "verdict": "<2-3 honest sentences on investor-readiness referencing actual content>",
  "breakdown": {
    "premise": { "score": <0-100>, "comment": "<one specific actionable sentence>" },
    "idea":    { "score": <0-100>, "comment": "<one specific actionable sentence>" },
    "tell":    { "score": <0-100>, "comment": "<one specific actionable sentence>" },
    "clarify": { "score": <0-100>, "comment": "<one specific actionable sentence>" },
    "help":    { "score": <0-100>, "comment": "<one specific actionable sentence>" },
    "heart":   { "score": <0-100>, "comment": "<one specific actionable sentence>" },
  },
  "strengths":    ["<strength quoting actual section content>", "<strength>"],
  "improvements": ["<improvement with concrete example of what good looks like>", "<improvement>", "<improvement>"]
}`;

  try {
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch {
    return {
      score: 0, grade: "N/A",
      verdict: "Analysis failed — please try again.",
      breakdown: Object.fromEntries(
        ["premise", "idea", "tell", "clarify", "help", "heart"].map((k) => [
          k, { score: 0, comment: "Could not analyze." },
        ])
      ),
      strengths: [],
      improvements: ["Analysis failed — please try again."],
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  4. REFINE
//  Rewrites a single section per a specific instruction.
//  sections is passed so the AI reads sibling sections first and keeps the
//  refined version tonally consistent with the rest of the deck.
//  e.g. If the founder asks to "make it punchier", the AI won't introduce
//  a tone that clashes with the calm, data-driven Clarify section next to it.
// ══════════════════════════════════════════════════════════════════════════════
export async function ai_refine(key, content, instruction, sections = {}) {
  const extraCtx = `
${buildSectionsContext(sections)}

You are refining the ${key.toUpperCase()} section of this pitch deck.
Read the other sections above so your revision stays consistent with the
overall narrative. Apply the instruction precisely without changing the core
message or introducing claims the founder hasn't provided.
Return ONLY the revised section text — no preamble, no labels, no code fences.`;

  const model = getCoachModel(extraCtx);
  const result = await model.generateContent(
    `Instruction: "${instruction}"\n\nOriginal ${key} section:\n"${content}"`
  );
  return result.response.text();
}

// ══════════════════════════════════════════════════════════════════════════════
//  5. DELIVERY ANALYSIS
//  Coaches a practice recording transcript.
//  sections is passed so the AI can tell which part of the pitch the founder
//  was delivering and give section-specific tips like "You rushed past the
//  problem in your Premise — slow down after the opening stat."
// ══════════════════════════════════════════════════════════════════════════════
export async function ai_deliveryAnalysis(transcript, durationSec, sections = {}) {
  const words = (transcript || "").trim().split(/\s+/).filter(Boolean).length;
  const wpm   = durationSec > 0 ? Math.round((words / durationSec) * 60) : 0;

  if (!transcript?.trim()) {
    return {
      overallScore: 0, pace: wpm, clarity: 0, confidence: 0,
      fillerWords: { um: 0, uh: 0, like: 0, so: 0 },
      suggestions: ["No transcript captured — check your microphone and try again."],
    };
  }

  const extraCtx = `
${buildSectionsContext(sections)}

You are coaching this founder's verbal delivery. The pitch sections above are
what they were supposed to be delivering — reference them by name when giving
tips (e.g. "In your Premise, you rushed past the problem statement — pause
after the opening stat to let it land").
Respond with valid JSON only — no markdown fences, no text outside the object.`;

  const model = getCoachModel(extraCtx);

  const prompt = `Analyze this pitch delivery.

Transcript: "${transcript}"
Duration: ${durationSec}s | Calculated pace: ${wpm} WPM (ideal range: 120-150 WPM)

Count filler words precisely by scanning the exact transcript text.

Return EXACTLY this JSON:
{
  "overallScore": <0-100 integer>,
  "clarity":      <0-100 integer>,
  "confidence":   <0-100 integer>,
  "fillerWords":  { "um": <count>, "uh": <count>, "like": <count>, "so": <count> },
  "suggestions":  ["<tip referencing actual transcript and pitch sections>", "<tip 2>", "<tip 3>"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = extractJSON(result.response.text());
    return {
      overallScore: Number(parsed.overallScore) || 0,
      pace: wpm,
      clarity:    Number(parsed.clarity)    || 0,
      confidence: Number(parsed.confidence) || 0,
      fillerWords: {
        um:   Number(parsed.fillerWords?.um)   || 0,
        uh:   Number(parsed.fillerWords?.uh)   || 0,
        like: Number(parsed.fillerWords?.like) || 0,
        so:   Number(parsed.fillerWords?.so)   || 0,
      },
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return {
      overallScore: 0, pace: wpm, clarity: 0, confidence: 0,
      fillerWords: { um: 0, uh: 0, like: 0, so: 0 },
      suggestions: ["Analysis failed — please try again."],
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  6. SCORE COMPARE
//  Grades a pitch for the Reviewer studio.
//  Stateless by design — no sections context needed here because the full
//  pitch content is passed directly as the `content` argument.
// ══════════════════════════════════════════════════════════════════════════════
export async function ai_scoreCompare(content) {
  if (!content?.trim()) {
    return { score: 0, grade: "N/A", verdict: "No content provided." };
  }

  const extraCtx = `You are in REVIEWER MODE evaluating a submitted pitch.
Score it against all five PITCH criteria:
[P] Problem clarity and urgency
[I] Importance of the stakes / cost of inaction
[T] Transformation — is there proof and a clear solution bridge?
[C] Connection — is it tailored to a specific audience?
[H] Help — is there a clear, specific, low-friction ask?
[H] Heart - what is the emotional investiment towards their idea?
Respond with valid JSON only — no markdown fences.`;

  const model = getCoachModel(extraCtx);

  const prompt = `Score this pitch content honestly.

"${content.slice(0, 2000)}"

Return EXACTLY this JSON:
{
  "score":   <0-100 integer>,
  "grade":   "<F|D|C|C+|B-|B|B+|A-|A|A+>",
  "verdict": "<one honest sentence citing the weakest PITCH element by name>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = extractJSON(result.response.text());
    return {
      score:   Number(parsed.score) || 0,
      grade:   parsed.grade         || "N/A",
      verdict: parsed.verdict       || "No verdict returned.",
    };
  } catch {
    return { score: 0, grade: "N/A", verdict: "Evaluation failed — please try again." };
  }
}