/**
 * Gemini AI analysis — lean prompt, only asks for what we use.
 * Volatile GEO flags (promotionalTone, lackOfHardData, heavyFirstPersonUsage, unsubstantiatedClaims)
 * are calculated deterministically from crawled text — not by Gemini.
 * 2-call averaged for the remaining stable AI flags.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

const PREFERRED_MODEL = 'gemini-2.5-flash';
let cachedModel: string | null = null;
let cacheExpiry = 0;

async function getModel(): Promise<string> {
  if (cachedModel && Date.now() < cacheExpiry) return cachedModel;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return PREFERRED_MODEL;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${PREFERRED_MODEL}?key=${key}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) { cachedModel = PREFERRED_MODEL; cacheExpiry = Date.now() + 6 * 3600_000; return PREFERRED_MODEL; }
    const lr = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { signal: AbortSignal.timeout(10000) });
    if (!lr.ok) return PREFERRED_MODEL;
    const data = await lr.json();
    const flash = (data.models || [])
      .filter((m: any) => m.name.includes('flash') && !m.name.includes('lite') && m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''));
    const stable = flash.filter((n: string) => !n.includes('preview') && !n.includes('exp'));
    const chosen = (stable.length > 0 ? stable : flash).sort((a: string, b: string) => b.localeCompare(a))[0] || PREFERRED_MODEL;
    cachedModel = chosen; cacheExpiry = Date.now() + 6 * 3600_000;
    return chosen;
  } catch { return cachedModel || PREFERRED_MODEL; }
}

function safeJsonParse(raw: string): any {
  try { return JSON.parse(raw); } catch {}
  try { return JSON.parse(raw.replace(/[\x00-\x1F]+/g, ' ')); } catch {}
  try { return JSON.parse(raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')); } catch {}
  try { return JSON.parse(raw.replace(/[\x00-\x1F]+/g, ' ')); } catch {}
  throw new Error('Failed to parse AI response as JSON');
}

// ── Deterministic GEO flag calculations ──────────────────────────────────

const SALES_WORDS = new Set(['best', 'amazing', 'guaranteed', 'free', 'exclusive', 'limited', 'act now', 'hurry', 'incredible', 'unbeatable', 'revolutionary', 'breakthrough', 'stunning', 'perfect', 'ultimate', 'premium', 'superior', 'exceptional', 'outstanding', 'remarkable', 'extraordinary', 'world-class', 'top-rated', 'award-winning', 'trusted', 'proven', 'leading', 'number one', '#1', 'no obligation', 'risk-free', 'money-back', 'special offer', 'discount', 'save', 'deal', 'bargain', 'lowest price']);
const FIRST_PERSON = new Set(['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']);
const CLAIM_WORDS = ['best', 'fastest', 'cheapest', 'most reliable', 'guaranteed', 'proven', 'always', 'never', 'every', '100%', 'all customers', 'everyone'];

export function computeDeterministicGeoFlags(text: string): {
  promotionalTone: number;
  lackOfHardData: number;
  heavyFirstPersonUsage: number;
  unsubstantiatedClaims: number;
} {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  if (totalWords < 10) return { promotionalTone: 60, lackOfHardData: 85, heavyFirstPersonUsage: 25, unsubstantiatedClaims: 50 };

  // Promotional tone: % of sales words + baseline penalty for short/thin content
  let salesCount = 0;
  for (const w of words) { if (SALES_WORDS.has(w)) salesCount++; }
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = words[i] + ' ' + words[i + 1];
    if (SALES_WORDS.has(phrase)) salesCount++;
  }
  const salesRatio = salesCount / totalWords;
  // Harsher: 5% sales words = 100, plus baseline of 15 for any commercial page
  const promotionalTone = Math.min(100, 15 + Math.round(salesRatio * 1700));

  // Hard data: count numbers, percentages, dates, dollar amounts
  const dataPatterns = text.match(/\d+%|\$[\d,.]+|\d{4}|\d+\.\d+|\d{1,3}(,\d{3})+|\d+ (years?|months?|days?|hours?|percent|million|billion|thousand)/gi) || [];
  const dataRatio = dataPatterns.length / Math.max(1, totalWords / 100);
  // Harsher: need 6+ data points per 100 words to score 0, baseline of 20
  const lackOfHardData = Math.max(0, Math.min(100, 20 + Math.round(80 - dataRatio * 14)));

  // First person usage — harsher multiplier
  let fpCount = 0;
  for (const w of words) { if (FIRST_PERSON.has(w)) fpCount++; }
  const fpRatio = fpCount / totalWords;
  // Harsher: 7% first person = 100, baseline of 10
  const heavyFirstPersonUsage = Math.min(100, 10 + Math.round(fpRatio * 1300));

  // Unsubstantiated claims — harsher baseline
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let claimCount = 0;
  let substantiatedCount = 0;
  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();
    const hasClaim = CLAIM_WORDS.some(c => sLower.includes(c));
    if (hasClaim) {
      claimCount++;
      const hasData = /\d/.test(sentence) || /https?:\/\//.test(sentence) || /according to|source|study|research|report/i.test(sentence);
      if (hasData) substantiatedCount++;
    }
  }
  // Harsher: baseline of 20 even with no claims (most small business sites make implicit claims)
  const unsubstantiatedClaims = claimCount === 0 ? 20 : Math.min(100, Math.round(((claimCount - substantiatedCount) / claimCount) * 100));

  return { promotionalTone, lackOfHardData, heavyFirstPersonUsage, unsubstantiatedClaims };
}

// ── Gemini analysis ──────────────────────────────────────────────────────

export async function analyzeWithGemini(context: {
  title: string; description: string; thinnedText: string;
  schemas: any[]; structuralData?: any; platform?: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = await getModel();
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0, topP: 0.1, responseMimeType: 'application/json' },
  });

  // Lean prompt — only flags Gemini is stable on + schema + site type
  const prompt = `
    You are a Search Intelligence Analyst evaluating a website using MODERN CRAWLER STANDARDS (Google 2026, Bing 2026).
    
    SCHEMA STANDARDS:
    - JSON-LD arrays and @graph structures are VALID
    - Only penalize: missing required properties, placeholder data, invalid JSON
    
    RULES:
    1. Rate each semantic flag as a SEVERITY SCORE from 0-100. Be precise and consistent.
    2. Evaluate schema quality using modern standards.
    
    WEBSITE TITLE: ${context.title}
    METADATA: ${context.description}
    LD+JSON SCHEMAS: ${JSON.stringify(context.schemas, null, 2)}
    STRUCTURAL DATA: ${context.structuralData ? JSON.stringify(context.structuralData, null, 2) : "Not available"}
${context.platform ? `    PLATFORM: ${context.platform}\n` : ''}
    CONTENT:
    ---
    ${context.thinnedText}
    ---
    
    Return JSON:
    {
      "semanticFlags": {
        "topicMisalignment": number (0-100, 0=perfectly aligned, 100=completely off-topic),
        "keywordStuffing": number (0-100, 0=natural, 100=extreme stuffing),
        "poorReadability": number (0-100, 0=crystal clear, 100=incomprehensible),
        "lackOfExpertiseSignals": number (0-100, 0=strong expertise, 100=no expertise signals),
        "noDirectQnAMatching": number (0-100, 0=excellent Q&A, 100=no questions answered),
        "lowEntityDensity": number (0-100, 0=rich entities, 100=no specific entities),
        "poorFormattingConciseness": number (0-100, 0=well formatted, 100=wall of text),
        "lackOfDefinitionStatements": number (0-100, 0=clear definitions, 100=no definitions)
      },
      "schemaQuality": {
        "score": number (0-100),
        "hasSchema": boolean,
        "schemaTypes": string[],
        "issues": string[],
        "strengths": string[]
      },
      "detectedSiteType": string ("restaurant"|"local-business"|"e-commerce"|"saas"|"blog"|"contractor"|"professional-services"|"portfolio"|"news-media"|"educational"|"general")
    }
  `;

  // 2 parallel Gemini calls, average the stable flags
  const [result1, result2] = await Promise.all([
    model.generateContent(prompt),
    model.generateContent(prompt),
  ]);

  const text1 = result1.response.text();
  const text2 = result2.response.text();
  const match1 = text1.match(/\{[\s\S]*\}/);
  const match2 = text2.match(/\{[\s\S]*\}/);
  if (!match1) throw new Error('Could not parse AI response as JSON');

  const parsed1 = safeJsonParse(match1[0]);
  let parsed2: any = null;
  if (match2) { try { parsed2 = safeJsonParse(match2[0]); } catch {} }

  // Average the AI flags (only the stable ones)
  const aiFlagKeys = [
    'topicMisalignment', 'keywordStuffing', 'poorReadability',
    'lackOfExpertiseSignals', 'noDirectQnAMatching', 'lowEntityDensity',
    'poorFormattingConciseness', 'lackOfDefinitionStatements',
  ];

  const aiFlags: Record<string, number> = {};
  for (const key of aiFlagKeys) {
    const v1 = typeof parsed1.semanticFlags?.[key] === 'number' ? parsed1.semanticFlags[key] : 0;
    const v2 = parsed2 && typeof parsed2.semanticFlags?.[key] === 'number' ? parsed2.semanticFlags[key] : v1;
    aiFlags[key] = Math.round((v1 + v2) / 2);
  }

  // Compute deterministic GEO flags from crawled text
  const deterministicFlags = computeDeterministicGeoFlags(context.thinnedText);

  // Average schema quality
  const sq1 = parsed1.schemaQuality?.score || 0;
  const sq2 = parsed2?.schemaQuality?.score || sq1;

  return {
    semanticFlags: {
      ...aiFlags,
      ...deterministicFlags,
    },
    schemaQuality: {
      ...parsed1.schemaQuality,
      score: Math.round((sq1 + sq2) / 2),
    },
    detectedSiteType: parsed1.detectedSiteType,
  };
}
