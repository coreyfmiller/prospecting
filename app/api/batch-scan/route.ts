/**
 * Batch Scan API — crawls multiple sites, sends to Gemini in batches of 10 with FULL prompt.
 * Uses the same deep analysis prompt as individual scans for score parity.
 */
import { NextRequest, NextResponse } from 'next/server';
import { crawlPage } from '@/lib/scoring/crawler';
import { calculateScoresFromScanResult } from '@/lib/scoring/grader-v2';
import { detectSiteType } from '@/lib/scoring/site-type-detector';
import { getMozMetrics } from '@/lib/scoring/moz';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 300;

const PREFERRED_MODEL = 'gemini-2.5-flash';
const GEMINI_BATCH_SIZE = 10;

function safeJsonParse(raw: string): any {
  try { return JSON.parse(raw); } catch {}
  try { return JSON.parse(raw.replace(/[\x00-\x1F]+/g, ' ')); } catch {}
  try { return JSON.parse(raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')); } catch {}
  throw new Error('Failed to parse batch AI response');
}

function buildBatchPrompt(crawls: { url: string; data: any }[]): string {
  const sitesBlock = crawls.map((c, i) => `
--- SITE ${i + 1}: ${c.data.title || c.url} ---
URL: ${c.url}
TITLE: ${c.data.title || ''}
METADATA: ${c.data.description || ''}
LD+JSON SCHEMAS: ${JSON.stringify(c.data.schemas || [], null, 2)}
STRUCTURAL DATA: ${JSON.stringify(c.data.structuralData || {}, null, 2)}
PLATFORM: ${c.data.platformDetection?.label || 'Unknown'}
CONTENT:
${(c.data.thinnedText || '').slice(0, 3000)}
--- END SITE ${i + 1} ---`).join('\n');

  return `
    You are a Search Intelligence Analyst evaluating MULTIPLE websites using MODERN CRAWLER STANDARDS (Google 2026, Bing 2026).
    
    MODERN SCHEMA EVALUATION STANDARDS:
    - JSON-LD arrays at root level are VALID and PREFERRED
    - @graph structures are VALID and should be parsed correctly
    - Multiple schema blocks per page are VALID
    - Only penalize: missing required properties, placeholder data (000-0000, example@example.com), invalid JSON
    - DO NOT penalize: arrays, @graph, distributed schema patterns
    
    CRITICAL RULES:
    1. You are a Semantic Data Extractor providing objective analysis
    2. Rate each semantic flag as a SEVERITY SCORE from 0-100 (0 = not present at all, 100 = extremely severe). Be precise and consistent.
    3. Evaluate schema quality using modern standards (not legacy parser rules)
    4. Evaluate each site INDEPENDENTLY — do not let one site's quality influence another's scores.
    5. Apply the SAME standards you would if analyzing each site individually in isolation.
    6. Generate qualitative analysis for each site
    
    Analyze these ${crawls.length} websites:
    ${sitesBlock}
    
    Return a JSON object with a "sites" array containing one entry per site, in the SAME ORDER as provided.
    Each entry must have this EXACT structure:
    {
      "url": string,
      "semanticFlags": {
        "topicMisalignment": number (0-100 severity, 0=perfectly aligned, 100=completely off-topic),
        "keywordStuffing": number (0-100 severity, 0=natural keyword usage, 100=extreme stuffing),
        "poorReadability": number (0-100 severity, 0=crystal clear, 100=incomprehensible),
        "noDirectQnAMatching": number (0-100 severity, 0=excellent Q&A coverage, 100=no questions answered),
        "lowEntityDensity": number (0-100 severity, 0=rich in entities, 100=no specific entities),
        "poorFormattingConciseness": number (0-100 severity, 0=well formatted, 100=wall of text),
        "lackOfDefinitionStatements": number (0-100 severity, 0=clear definitions present, 100=no definitions),
        "promotionalTone": number (0-100 severity, 0=neutral/informative, 100=pure advertisement),
        "lackOfExpertiseSignals": number (0-100 severity, 0=strong expertise shown, 100=no expertise signals),
        "lackOfHardData": number (0-100 severity, 0=data-rich content, 100=no facts or data),
        "heavyFirstPersonUsage": number (0-100 severity, 0=objective third-person, 100=entirely first-person),
        "unsubstantiatedClaims": number (0-100 severity, 0=all claims backed, 100=all claims unsubstantiated)
      },
      "schemaQuality": {
        "score": number (0-100, quality of schema implementation using modern standards),
        "hasSchema": boolean,
        "schemaTypes": string[],
        "issues": string[],
        "strengths": string[]
      },
      "detectedSiteType": string ("restaurant" | "local-business" | "e-commerce" | "saas" | "blog" | "contractor" | "professional-services" | "portfolio" | "news-media" | "educational" | "general"),
      "seoAnalysis": {
        "onPageIssues": string[],
        "keywordOpportunities": string[],
        "contentQuality": "excellent" | "good" | "fair" | "poor" | "unacceptable",
        "metaAnalysis": string
      },
      "aeoAnalysis": {
        "questionsAnswered": { "who": number, "what": number, "where": number, "why": number, "how": number },
        "missingSchemas": string[],
        "snippetEligibilityScore": number,
        "topOpportunities": string[]
      },
      "geoAnalysis": {
        "sentimentScore": number (-100 to 100),
        "brandPerception": "positive" | "neutral" | "negative",
        "citationLikelihood": number (0-100),
        "llmContextClarity": number (0-100),
        "visibilityGaps": string[]
      },
      "recommendations": Array of up to 5 objects per site: {
        "rank": number,
        "title": string,
        "description": string,
        "priority": "CRITICAL" | "HIGH" | "MEDIUM",
        "domain": "SEO" | "AEO" | "GEO"
      }
    }
    
    Return format: { "sites": [ ... ] }
    
    IMPORTANT:
    - You MUST return exactly ${crawls.length} entries in the sites array.
    - Evaluate each site with the SAME depth and rigor as if it were the only site being analyzed.
    - Evaluate schema using modern 2026 standards (arrays and @graph are valid).
    - Only flag real problems, not implementation style choices.
    - Generate recommendations for each site — at least 1 CRITICAL if warranted.
  `;
}

const FLAG_KEYS = [
  'topicMisalignment', 'keywordStuffing', 'poorReadability',
  'noDirectQnAMatching', 'lowEntityDensity', 'poorFormattingConciseness',
  'lackOfDefinitionStatements', 'promotionalTone', 'lackOfExpertiseSignals',
  'lackOfHardData', 'heavyFirstPersonUsage', 'unsubstantiatedClaims',
];

async function analyzeGeminiBatch(crawls: { url: string; data: any }[], apiKey: string): Promise<any[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: PREFERRED_MODEL,
    generationConfig: { temperature: 0, topP: 0.1, responseMimeType: 'application/json' },
  });

  const prompt = buildBatchPrompt(crawls);

  // 2 parallel calls, average results
  const [r1, r2] = await Promise.all([
    model.generateContent(prompt),
    model.generateContent(prompt),
  ]);

  const match1 = r1.response.text().match(/\{[\s\S]*\}/);
  const match2 = r2.response.text().match(/\{[\s\S]*\}/);
  if (!match1) throw new Error('Failed to parse batch Gemini response');

  const sites1: any[] = safeJsonParse(match1[0]).sites || [];
  let sites2: any[] = [];
  if (match2) { try { sites2 = safeJsonParse(match2[0]).sites || []; } catch {} }

  // Average per site
  const averaged: any[] = [];
  for (let i = 0; i < crawls.length; i++) {
    const ai1 = sites1[i] || {};
    const ai2 = sites2[i] || {};
    const f1 = ai1.semanticFlags || {}, f2 = ai2.semanticFlags || {};
    const flags: Record<string, number> = {};
    for (const k of FLAG_KEYS) {
      const v1 = typeof f1[k] === 'number' ? f1[k] : 0;
      const v2 = typeof f2[k] === 'number' ? f2[k] : v1;
      flags[k] = Math.round((v1 + v2) / 2);
    }
    const sq1 = ai1.schemaQuality?.score || 0;
    const sq2 = ai2.schemaQuality?.score || sq1;
    averaged.push({
      semanticFlags: flags,
      schemaQuality: { ...(ai1.schemaQuality || {}), score: Math.round((sq1 + sq2) / 2) },
      detectedSiteType: ai1.detectedSiteType,
    });
  }
  return averaged;
}

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0)
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Step 1: Crawl all sites (batches of 5 for crawling)
    const crawlResults: { url: string; data: any; error?: string }[] = [];
    for (let i = 0; i < urls.length; i += 5) {
      const batch = urls.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (url: string) => {
          const norm = url.startsWith('http') ? url : `https://${url}`;
          const data = await crawlPage(norm);
          if (data.botProtection?.detected) return { url: norm, data: null, error: `Bot protection (${data.botProtection.type})` };
          data.siteType = detectSiteType(data).primaryType;
          return { url: norm, data };
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') crawlResults.push(r.value);
        else crawlResults.push({ url: 'unknown', data: null, error: r.reason?.message || 'Crawl failed' });
      }
    }

    const validCrawls = crawlResults.filter(r => r.data && !r.error);
    const failedCrawls = crawlResults.filter(r => !r.data || r.error);

    if (validCrawls.length === 0) {
      return NextResponse.json({ results: failedCrawls.map(r => ({ url: r.url, seoScore: 0, geoScore: 0, domainAuthority: 0, criticalIssues: [], error: r.error })) });
    }

    // Step 2: Gemini analysis in batches of 10
    const allAiResults: any[] = [];
    for (let i = 0; i < validCrawls.length; i += GEMINI_BATCH_SIZE) {
      const batch = validCrawls.slice(i, i + GEMINI_BATCH_SIZE);
      const batchResults = await analyzeGeminiBatch(batch, apiKey);
      allAiResults.push(...batchResults);
    }

    // Step 3: Moz in parallel
    const mozResults = await Promise.allSettled(validCrawls.map(c => getMozMetrics(c.url).catch(() => null)));

    // Step 4: Grade each site
    const results: any[] = [];
    for (let i = 0; i < validCrawls.length; i++) {
      const crawl = validCrawls[i];
      const ai = allAiResults[i] || {};

      crawl.data.semanticFlags = ai.semanticFlags || {};
      crawl.data.schemaQuality = ai.schemaQuality || { hasSchema: false, score: 0, issues: [] };
      if (ai.detectedSiteType && ai.detectedSiteType !== 'general') crawl.data.siteType = ai.detectedSiteType;

      const graded = calculateScoresFromScanResult(crawl.data);
      const issues: string[] = [];
      for (const cat of [...(graded.breakdown.seo || []), ...(graded.breakdown.geo || [])]) {
        for (const comp of cat.components || []) { if (comp.status === 'critical' && comp.feedback) issues.push(comp.feedback); }
      }
      const moz = mozResults[i]?.status === 'fulfilled' ? (mozResults[i] as any).value : null;
      results.push({ url: crawl.url, seoScore: graded.seoScore, geoScore: graded.geoScore, domainAuthority: moz?.domainAuthority ?? 0, criticalIssues: issues });
    }

    for (const f of failedCrawls) results.push({ url: f.url, seoScore: 0, geoScore: 0, domainAuthority: 0, criticalIssues: [], error: f.error });

    return NextResponse.json({ results, scannedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Batch Scan] Error:', error);
    return NextResponse.json({ error: error.message || 'Batch scan failed' }, { status: 500 });
  }
}
