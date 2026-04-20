/** Gemini AI analysis — ported from Duelly. 2-call averaged for score stability. */
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
    // Discover fallback
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
  throw new Error('Failed to parse AI response as JSON');
}

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

  const prompt = `
You are a Search Intelligence Analyst evaluating a website using MODERN CRAWLER STANDARDS (Google 2026, Bing 2026).

MODERN SCHEMA EVALUATION STANDARDS:
- JSON-LD arrays at root level are VALID and PREFERRED
- @graph structures are VALID and should be parsed correctly
- Multiple schema blocks per page are VALID
- Only penalize: missing required properties, placeholder data (000-0000, example@example.com), invalid JSON
- DO NOT penalize: arrays, @graph, distributed schema patterns

CRITICAL EXTRACTION RULES:
1. You are a Semantic Data Extractor providing objective analysis
2. Rate each semantic flag as a SEVERITY SCORE from 0-100 (0 = not present at all, 100 = extremely severe). Be precise and consistent.
3. Evaluate schema quality using modern standards (not legacy parser rules)

Analyze the following extracted data:

WEBSITE TITLE: ${context.title}
METADATA: ${context.description}
LD+JSON SCHEMAS (Normalized): ${JSON.stringify(context.schemas, null, 2)}

STRUCTURAL DATA (Extracted from DOM):
${context.structuralData ? JSON.stringify(context.structuralData, null, 2) : 'Not available'}

CONTENT SUMMARY (Optimized Extract):
---
${context.thinnedText}
---
${context.platform ? `\nDETECTED PLATFORM: ${context.platform}` : ''}

Return a JSON object exactly matching this structure:
{
  "semanticFlags": {
    "topicMisalignment": number (0-100),
    "keywordStuffing": number (0-100),
    "poorReadability": number (0-100),
    "noDirectQnAMatching": number (0-100),
    "lowEntityDensity": number (0-100),
    "poorFormattingConciseness": number (0-100),
    "lackOfDefinitionStatements": number (0-100),
    "promotionalTone": number (0-100),
    "lackOfExpertiseSignals": number (0-100),
    "lackOfHardData": number (0-100),
    "heavyFirstPersonUsage": number (0-100),
    "unsubstantiatedClaims": number (0-100)
  },
  "schemaQuality": {
    "score": number (0-100),
    "hasSchema": boolean,
    "schemaTypes": string[],
    "issues": string[],
    "strengths": string[]
  },
  "detectedSiteType": string (classify into ONE of: "restaurant" | "local-business" | "e-commerce" | "saas" | "blog" | "contractor" | "professional-services" | "portfolio" | "news-media" | "educational" | "general". Be specific.)
}

IMPORTANT:
- Evaluate schema using modern 2026 standards (arrays and @graph are valid)
- Only flag real problems, not implementation style choices
- Return ONLY semanticFlags, schemaQuality, and detectedSiteType.
`;

  // Run 2 parallel Gemini calls and average semanticFlags for scoring stability
  const [result1, result2] = await Promise.all([
    model.generateContent(prompt),
    model.generateContent(prompt),
  ]);

  const text1 = result1.response.text();
  const text2 = result2.response.text();

  const match1 = text1.match(/\{[\s\S]*\}/);
  const match2 = text2.match(/\{[\s\S]*\}/);
  if (!match1) throw new Error('Could not parse AI response 1 as JSON');

  const parsed1 = safeJsonParse(match1[0]);
  if (!match2) {
    console.warn('[Gemini] Second call failed to parse, using single result');
    return parsed1;
  }
  const parsed2 = safeJsonParse(match2[0]);

  // Average the semanticFlags severity scores
  const flags1 = parsed1.semanticFlags || {};
  const flags2 = parsed2.semanticFlags || {};
  const flagKeys = [
    'topicMisalignment', 'keywordStuffing', 'poorReadability',
    'noDirectQnAMatching', 'lowEntityDensity', 'poorFormattingConciseness',
    'lackOfDefinitionStatements', 'promotionalTone', 'lackOfExpertiseSignals',
    'lackOfHardData', 'heavyFirstPersonUsage', 'unsubstantiatedClaims',
  ];

  const averagedFlags: Record<string, number> = {};
  for (const key of flagKeys) {
    const v1 = typeof flags1[key] === 'number' ? flags1[key] : (flags1[key] ? 100 : 0);
    const v2 = typeof flags2[key] === 'number' ? flags2[key] : (flags2[key] ? 100 : 0);
    averagedFlags[key] = Math.round((v1 + v2) / 2);
  }

  // Average schemaQuality score
  const sq1 = parsed1.schemaQuality?.score || 0;
  const sq2 = parsed2.schemaQuality?.score || 0;

  const merged = {
    ...parsed1,
    semanticFlags: averagedFlags,
    schemaQuality: { ...parsed1.schemaQuality, score: Math.round((sq1 + sq2) / 2) },
  };

  console.log('[Gemini] Averaged semanticFlags from 2 calls:', JSON.stringify(averagedFlags));
  return merged;
}
