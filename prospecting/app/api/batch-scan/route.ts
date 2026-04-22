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
    if (!urls || !Array.isArray(urls) || urls.length === 0)
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
    if (urls.length > 25)
      return NextResponse.json({ error: 'Maximum 25 URLs per batch' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Step 1: Crawl all sites (batches of 5)
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
      return NextResponse.json({ results: crawlResults.map(r => ({ url: r.url, seoScore: 0, geoScore: 0, domainAuthority: 0, criticalIssues: [], error: r.error || 'Crawl failed' })) });
    }

    // Step 2: Build batch Gemini prompt
    const sitesBlock = validCrawls.map((c, i) => `
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

    const prompt = `
    You are a Search Intelligence Analyst evaluating MULTIPLE websites using MODERN CRAWLER STANDARDS (Google 2026, Bing 2026).

    SCHEMA STANDARDS: JSON-LD arrays and @graph are VALID. Only penalize missing required properties, placeholder data, invalid JSON.

    CRITICAL RULES:
    1. Rate each semantic flag 0-100 (0=not present, 100=extremely severe). Be precise and consistent.
    2. Evaluate each site INDEPENDENTLY — do not let one site influence another.
    3. Apply the SAME standards as a single-site analysis.

    Analyze these ${validCrawls.length} websites:
    ${sitesBlock}

    Return JSON: { "sites": [ ... ] } with exactly ${validCrawls.length} entries in order.
    Each entry:
    {
      "url": string,
      "semanticFlags": {
        "topicMisalignment": number, "keywordStuffing": number, "poorReadability": number,
        "noDirectQnAMatching": number, "lowEntityDensity": number, "poorFormattingConciseness": number,
        "lackOfDefinitionStatements": number, "promotionalTone": number, "lackOfExpertiseSignals": number,
        "lackOfHardData": number, "heavyFirstPersonUsage": number, "unsubstantiatedClaims": number
      },
      "schemaQuality": { "score": number, "hasSchema": boolean, "issues": string[] },
      "detectedSiteType": string
    }
    `;

    // Step 3: 2 Gemini calls, average results
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: PREFERRED_MODEL,
      generationConfig: { temperature: 0, topP: 0.1, responseMimeType: 'application/json' },
    });

    const [r1, r2] = await Promise.all([model.generateContent(prompt), model.generateContent(prompt)]);
    const match1 = r1.response.text().match(/\{[\s\S]*\}/);
    const match2 = r2.response.text().match(/\{[\s\S]*\}/);
    if (!match1) throw new Error('Failed to parse batch Gemini response');

    const sites1: any[] = safeJsonParse(match1[0]).sites || [];
    let sites2: any[] = [];
    if (match2) { try { sites2 = safeJsonParse(match2[0]).sites || []; } catch {} }

    // Step 4: Grade each site
    const flagKeys = ['topicMisalignment','keywordStuffing','poorReadability','noDirectQnAMatching','lowEntityDensity','poorFormattingConciseness','lackOfDefinitionStatements','promotionalTone','lackOfExpertiseSignals','lackOfHardData','heavyFirstPersonUsage','unsubstantiatedClaims'];
    const mozResults = await Promise.allSettled(validCrawls.map(c => getMozMetrics(c.url).catch(() => null)));

    const results: any[] = [];
    for (let i = 0; i < validCrawls.length; i++) {
      const crawl = validCrawls[i];
      const ai1 = sites1[i] || {}, ai2 = sites2[i] || {};

      // Average flags
      const f1 = ai1.semanticFlags || {}, f2 = ai2.semanticFlags || {};
      const avg: Record<string, number> = {};
      for (const k of flagKeys) { const v1 = typeof f1[k] === 'number' ? f1[k] : 0; avg[k] = Math.round((v1 + (typeof f2[k] === 'number' ? f2[k] : v1)) / 2); }

      const sq1 = ai1.schemaQuality?.score || 0, sq2 = ai2.schemaQuality?.score || sq1;
      crawl.data.semanticFlags = avg;
      crawl.data.schemaQuality = { ...(ai1.schemaQuality || {}), score: Math.round((sq1 + sq2) / 2) };
      if (ai1.detectedSiteType && ai1.detectedSiteType !== 'general') crawl.data.siteType = ai1.detectedSiteType;

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
