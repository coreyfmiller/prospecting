/**
 * Batch Scan API v2 — crawls all sites in parallel, then runs INDIVIDUAL Gemini calls per site.
 * Same prompt, same isolation, same scores as the main page scan.
 * Speed comes from parallel crawling + parallel Gemini calls (not batched prompts).
 */
import { NextRequest, NextResponse } from 'next/server';
import { crawlPage } from '@/lib/scoring/crawler';
import { calculateScoresFromScanResult } from '@/lib/scoring/grader-v2';
import { analyzeWithGemini } from '@/lib/scoring/gemini-analyzer';
import { detectSiteType } from '@/lib/scoring/site-type-detector';
import { getMozMetrics } from '@/lib/scoring/moz';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0)
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 });

    // Step 1: Crawl all sites in parallel (batches of 5)
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

    // Step 2: Run individual Gemini + Moz calls per site in parallel (batches of 3 to respect rate limits)
    const allResults: any[] = [];
    for (let i = 0; i < validCrawls.length; i += 3) {
      const batch = validCrawls.slice(i, i + 3);
      const batchResults = await Promise.allSettled(
        batch.map(async (crawl) => {
          const [aiResult, mozResult] = await Promise.allSettled([
            analyzeWithGemini({
              title: crawl.data.title,
              description: crawl.data.description,
              thinnedText: crawl.data.thinnedText,
              schemas: crawl.data.schemas,
              structuralData: crawl.data.structuralData,
              platform: crawl.data.platformDetection?.label,
            }),
            getMozMetrics(crawl.url),
          ]);

          if (aiResult.status === 'fulfilled') {
            const ai = aiResult.value;
            crawl.data.semanticFlags = ai.semanticFlags;
            crawl.data.schemaQuality = ai.schemaQuality;
            if (ai.detectedSiteType && ai.detectedSiteType !== 'general') {
              crawl.data.siteType = ai.detectedSiteType;
            }
          }

          const graded = calculateScoresFromScanResult(crawl.data);
          const criticalIssues: string[] = [];
          for (const cat of [...(graded.breakdown.seo || []), ...(graded.breakdown.geo || [])]) {
            for (const comp of cat.components || []) {
              if (comp.status === 'critical' && comp.feedback) criticalIssues.push(comp.feedback);
            }
          }

          const moz = mozResult.status === 'fulfilled' ? mozResult.value : null;
          return { url: crawl.url, seoScore: graded.seoScore, geoScore: graded.geoScore, domainAuthority: moz?.domainAuthority ?? 0, criticalIssues };
        })
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') allResults.push(r.value);
        else allResults.push({ url: 'unknown', seoScore: 0, geoScore: 0, domainAuthority: 0, criticalIssues: [], error: 'Scan failed' });
      }
    }

    for (const f of failedCrawls) {
      allResults.push({ url: f.url, seoScore: 0, geoScore: 0, domainAuthority: 0, criticalIssues: [], error: f.error });
    }

    return NextResponse.json({ results: allResults, scannedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Batch Scan] Error:', error);
    return NextResponse.json({ error: error.message || 'Batch scan failed' }, { status: 500 });
  }
}
