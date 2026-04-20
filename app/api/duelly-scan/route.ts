/**
 * Duelly Scan — full scoring engine built into MarketMojo.
 * Same pipeline as Duelly's /api/prospect-scan:
 *   1. Crawl page (fetch + cheerio)
 *   2. Detect site type
 *   3. Run Gemini AI (2 calls averaged) + Moz DA in parallel
 *   4. Inject AI results into scan data
 *   5. Grade with grader-v2 (identical component scoring)
 *   6. Extract critical issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { crawlPage } from '@/lib/scoring/crawler';
import { calculateScoresFromScanResult } from '@/lib/scoring/grader-v2';
import { analyzeWithGemini } from '@/lib/scoring/gemini-analyzer';
import { detectSiteType } from '@/lib/scoring/site-type-detector';
import { getMozMetrics } from '@/lib/scoring/moz';

export const maxDuration = 120;

export interface DuellyScanResult {
  url: string;
  seoScore: number;
  geoScore: number;
  domainAuthority: number;
  criticalIssues: string[];
  scannedAt?: string;
}

// Simple in-memory rate limiter
const lastScanTime = new Map<string, number>();
const COOLDOWN_MS = 30000;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    // Rate limit
    const now = Date.now();
    const last = lastScanTime.get(url) || 0;
    if (now - last < COOLDOWN_MS) {
      return NextResponse.json({ error: `Please wait ${Math.ceil((COOLDOWN_MS - (now - last)) / 1000)}s before scanning again` }, { status: 429 });
    }
    lastScanTime.set(url, now);

    // 1. Crawl
    const pageData = await crawlPage(url);

    if (pageData.botProtection?.detected) {
      return NextResponse.json({ error: `Bot protection detected (${pageData.botProtection.type}) — unable to scan` }, { status: 422 });
    }

    // 2. Site type detection (heuristic)
    const siteTypeResult = detectSiteType(pageData);
    pageData.siteType = siteTypeResult.primaryType;

    // 3. Run Gemini AI + Moz DA in parallel
    const [aiResult, mozResult] = await Promise.allSettled([
      analyzeWithGemini({
        title: pageData.title,
        description: pageData.description,
        thinnedText: pageData.thinnedText,
        schemas: pageData.schemas,
        structuralData: pageData.structuralData,
        platform: pageData.platformDetection?.label,
      }),
      getMozMetrics(url),
    ]);

    // 4. Inject AI results
    if (aiResult.status === 'fulfilled') {
      const ai = aiResult.value;
      pageData.semanticFlags = ai.semanticFlags;
      pageData.schemaQuality = ai.schemaQuality;

      // Override heuristic site type with AI-detected type if available
      if (ai.detectedSiteType && ai.detectedSiteType !== 'general') {
        pageData.siteType = ai.detectedSiteType;
      }
    } else {
      console.error('[Duelly Scan] Gemini failed, using heuristic fallback:', aiResult.reason);
      // Heuristic fallback — same as Duelly's scan-preparation.ts
      applyHeuristicFlags(pageData);
    }

    // 5. Grade with grader-v2
    const graderResult = calculateScoresFromScanResult(pageData);

    // 6. Extract critical issues
    const criticalIssues: string[] = [];
    if (graderResult.breakdown) {
      for (const category of [...(graderResult.breakdown.seo || []), ...(graderResult.breakdown.geo || [])]) {
        for (const component of category.components || []) {
          if (component.status === 'critical' && component.feedback) {
            criticalIssues.push(component.feedback);
          }
        }
      }
    }

    // 7. Moz DA
    const moz = mozResult.status === 'fulfilled' ? mozResult.value : null;

    return NextResponse.json({
      url: pageData.url,
      seoScore: graderResult.seoScore,
      geoScore: graderResult.geoScore,
      domainAuthority: moz?.domainAuthority ?? 0,
      criticalIssues,
      scannedAt: new Date().toISOString(),
    } as DuellyScanResult);
  } catch (error: any) {
    console.error('Duelly scan error:', error);
    return NextResponse.json({ error: error.message || 'Scan failed' }, { status: 500 });
  }
}

/**
 * Heuristic fallback when Gemini is unavailable.
 * Same logic as Duelly's scan-preparation.ts — graduated 0-100 severities.
 */
function applyHeuristicFlags(scan: any) {
  const sd = scan.structuralData || {};
  const wc = sd.wordCount || 0;
  const h2 = sd.semanticTags?.h2Count || 0;
  const h3 = sd.semanticTags?.h3Count || 0;
  const hc = h2 + h3;
  const ext = sd.links?.external || 0;

  // Schema quality
  if (scan.schemas?.length > 0) {
    const types = scan.schemas.map((s: any) => s['@type']).filter(Boolean);
    const hasReq = scan.schemas.some((s: any) => s.name || s.headline || s['@type']);
    const multi = new Set(types).size > 1;
    scan.schemaQuality = { hasSchema: true, score: hasReq ? (multi ? 80 : 70) : 40, issues: hasReq ? [] : ['Missing required properties'] };
  } else {
    scan.schemaQuality = { hasSchema: false, score: 0, issues: ['No structured data found'] };
  }

  scan.semanticFlags = {
    noDirectQnAMatching: wc >= 800 ? (hc >= 3 ? 10 : 25) : wc >= 500 ? (hc >= 2 ? 30 : 50) : wc >= 300 ? 65 : 80,
    lowEntityDensity: wc >= 800 ? (ext >= 2 ? 10 : 20) : wc >= 500 ? (ext >= 1 ? 30 : 45) : wc >= 300 ? 60 : 80,
    poorFormattingConciseness: hc >= 4 ? 5 : hc >= 2 ? 15 : hc >= 1 ? 35 : wc < 300 ? 75 : 55,
    lackOfDefinitionStatements: wc >= 800 ? (hc >= 3 ? 10 : 25) : wc >= 500 ? 35 : wc >= 300 ? 55 : 75,
    promotionalTone: wc < 200 ? 40 : (ext === 0 && wc < 500) ? 30 : ext === 0 ? 15 : 5,
    lackOfExpertiseSignals: wc >= 800 ? (scan.schemas?.length > 0 ? 5 : 20) : wc >= 500 ? (scan.schemas?.length > 0 ? 20 : 40) : wc >= 300 ? 55 : 75,
    lackOfHardData: wc >= 800 ? (ext >= 3 ? 5 : 20) : wc >= 500 ? (ext >= 1 ? 25 : 45) : wc >= 300 ? 55 : 75,
    heavyFirstPersonUsage: wc < 300 ? 20 : 10,
    unsubstantiatedClaims: wc < 300 ? 30 : (ext === 0 && wc < 500) ? 20 : 5,
  };
}
