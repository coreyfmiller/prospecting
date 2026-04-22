/**
 * Batch Scan API — crawls multiple sites, sends all data to Gemini in ONE prompt (x2 for averaging).
 * Same quality as individual scans, ~95% cheaper.
 */
import { NextRequest, NextResponse } from 'next/server';
import { crawlPage } from '@/lib/scoring/crawler';
import { calculateScoresFromScanResult } from '@/lib/scoring/grader-v2';
import { detectSiteType } from '@/lib/scoring/site-type-detector';
import { getMozMetrics } from '@/lib/scoring/moz';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 300;

interface BatchScanResult {
  url: string;
  seoScore: number;
  geoScore: number;
  domainAuthority: number;
  criticalIssues: string[];
  error?: string;
}

const PREFERRED_MODEL = 'gemini-2.5-flash';

function safeJsonParse(raw: string): any {
  try { return JSON.parse(raw); } catch {}
  try { return JSON.parse(raw.replace(/[\x00-\x1F]+/g, ' ')); } catch {}
  try { return JSON.parse(raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')); } catch {}
  throw new Error('Failed to parse batch AI response');
}

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
    }
    if (urls.length > 25) {
      return NextResponse.json({ error: 'Maximum 25 URLs per batch' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Step 1: Crawl all sites in parallel (batches of 5 to avoid overwhelming the worker)
    const crawlResults: { url: string; data: any; error?: string }[] = [];
    const batchSize = 5;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (url: string) => {
          const normalized = url.startsWith('http') ? url : `https://${url}`;
          const data = await crawlPage(normalized);
          if (data.botProtection?.detected) {
            return { url: normalized, data: null, error: `Bot protection (${data.botProtection.type})` };
          }
          const siteType = detectSiteType(data);
          data.siteType = siteType.primaryType;
          return { url: normalized, data };
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') crawlResults.push(r.value);
        else crawlResults.push({ url: 'unknown', data: null, error: r.reason?.message || 'Crawl failed' });
      }
    }

    // Step 2: Build batch Gemini prompt with all successfully crawled sites
    const validCrawls = crawlResults.filter(r => r.data && !r.error);
    const failedCrawls = crawlResults.filter(r => !r.data || r.error);

    if (validCrawls.length === 0) {
      return NextResponse.json({
        results: crawlResults.map(r => ({
          url: r.url, seoScore: 0, geoScore: 0, domainAuthority: 0,
          criticalIssues: [], error: r.error || 'Crawl failed',
        })),
      });
    }

    // Build the sites data for the prompt
    const sitesForPrompt = validCrawls.map((c, i) => `
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

    const batchPrompt = `
    You are a Search Intelligence Analyst evaluating MULTIPLE websites using MODERN CRAWLER STANDARDS (Google 2026, Bing 2026).
    
    MODERN SCHEMA EVALUATION STANDARDS:
    - JSON-LD arrays at root level are VALID and PREFERRED
    - @graph structures are VALID and should be parsed correctly
    - Only penalize: missing required properties, placeholder data, invalid JSON
    - DO NOT penalize: arrays, @graph, distributed schema patterns
    
    CRITICAL RULES:
    1. Rate each semantic flag as a SEVERITY SCORE from 0-100 (0 = not present, 100 = extremely severe). Be precise and consistent.
    2. Evaluate each site INDEPENDENTLY — do not let one site's quality influence another's scores.
    3. Apply the SAME standards you would if analyzing each site individually.
    
    Analyze these ${validCrawls.length} websites:
    ${sitesForPrompt}
    
    Return a JSON object with a "sites" array containing one entry per site, in the SAME ORDER as provided.
    Each entry must have this structure:
    {
      "url": string (the site URL),
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
        "issues": string[]
      },
      "detectedSiteType": string ("restaurant" | "local-business" | "e-commerce" | "saas" | "blog" | "contractor" | "professional-services" | "portfolio" | "news-media" | "educational" | "general")
    }
    
    Return format: { "sites": [ ... ] }
    
    IMPORTANT:
    - You MUST return exactly ${validCrawls.length} entries in the sites array.
    - Evaluate each site independently with the same rigor as a single-site analysis.
    - Use modern 2026 schema standards.
    `;

    // Step 3: Run 2 Gemini calls in parallel and average (same as single scan)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: PREFERRED_MODEL,
      generationConfig: { temperature: 0, topP: 0.1, responseMimeType: 'application/json' },
    });

    const [r1, r2] = await Promise.all([
      model.generateContent(batchPrompt),
      model.generateContent(batchPrompt),
    ]);

    const text1 = r1.response.text();
    const text2 = r2.response.text();
    const match1 = text1.match(/\{[\s\S]*\}/);
    const match2 = text2.match(/\{[\s\S]*\}/);

    if (!match1) throw new Error('Failed to parse batch Gemini response 1');
    const parsed1 = safeJsonParse(match1[0]);
    const sites1: any[] = parsed1.sites || [];

    let sites2: any[] = [];
    if (match2) {
      try {
        const parsed2 = safeJsonParse(match2[0]);
        sites2 = parsed2.sites || [];
      } catch { console.warn('[Batch] Second call parse failed, using single result'); }
    }

    // Step 4: Average semantic flags between the two calls (per site)
    const flagKeys = [
      'topicMisalignment', 'keywordStuffing', 'poorReadability',
      'noDirectQnAMatching', 'lowEntityDensity', 'poorFormattingConciseness',
      'lackOfDefinitionStatements', 'promotionalTone', 'lackOfExpertiseSignals',
      'lackOfHardData', 'heavyFirstPersonUsage', 'unsubstantiatedClaims',
    ];

    // Step 5: Grade each site and build results
    const mozPromises = validCrawls.map(c => getMozMetrics(c.url).catch(() => null));
    const mozResults = await Promise.allSettled(mozPromises);

    const results: BatchScanResult[] = [];

    for (let i = 0; i < validCrawls.length; i++) {
      const crawl = validCrawls[i];
      const ai1 = sites1[i] || {};
      const ai2 = sites2[i] || {};

      // Average flags
      const flags1 = ai1.semanticFlags || {};
      const flags2 = ai2.semanticFlags || {};
      const averaged: Record<string, number> = {};
      for (const key of flagKeys) {
        const v1 = typeof flags1[key] === 'number' ? flags1[key] : 0;
        const v2 = typeof flags2[key] === 'number' ? flags2[key] : v1;
        averaged[key] = Math.round((v1 + v2) / 2);
      }

      // Average schema quality
      const sq1 = ai1.schemaQuality?.score || 0;
      const sq2 = ai2.schemaQuality?.score || sq1;

      // Inject AI data into crawl result
      crawl.data.semanticFlags = averaged;
      crawl.data.schemaQuality = {
        ...(ai1.schemaQuality || {}),
        score: Math.round((sq1 + sq2) / 2),
      };
      if (ai1.detectedSiteType && ai1.detectedSiteType !== 'general') {
        crawl.data.siteType = ai1.detectedSiteType;
      }

      // Grade
      const graderResult = calculateScoresFromScanResult(crawl.data);

      // Critical issues
      const criticalIssues: string[] = [];
      for (const cat of [...(graderResult.breakdown.seo || []), ...(graderResult.breakdown.geo || [])]) {
        for (const comp of cat.components || []) {
          if (comp.status === 'critical' && comp.feedback) criticalIssues.push(comp.feedback);
        }
      }

      // Moz
      const mozResult = mozResults[i];
      const moz = mozResult?.status === 'fulfilled' ? mozResult.value : null;

      results.push({
        url: crawl.url,
        seoScore: graderResult.seoScore,
        geoScore: graderResult.geoScore,
        domainAuthority: moz?.domainAuthority ?? 0,
        criticalIssues,
      });
    }

    // Add failed crawls
    for (const failed of failedCrawls) {
      results.push({
        url: failed.url,
        seoScore: 0,
        geoScore: 0,
        domainAuthority: 0,
        criticalIssues: [],
        error: failed.error,
      });
    }

    return NextResponse.json({ results, scannedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Batch Scan] Error:', error);
    return NextResponse.json({ error: error.message || 'Batch scan failed' }, { status: 500 });
  }
}
