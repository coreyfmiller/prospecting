/** Grader V2 — component-based scoring. Identical scoring logic. */
import { SEO_CATEGORIES } from './scoring-components';
import type { CategoryScore, ComponentResult, GraderResult } from './types';

function norm(v: any): number {
  if (typeof v === 'boolean') return v ? 100 : 0;
  if (typeof v === 'number') return Math.max(0, Math.min(100, v));
  return 0;
}
function grad(severity: number, max: number): number { return Math.round((severity / 100) * max); }

export function calculateScoresFromScanResult(scan: any): GraderResult {
  const d = {
    url: scan.url, title: scan.title || '', description: scan.description || '',
    titleLength: scan.title?.length || 0, descriptionLength: scan.description?.length || 0,
    structuralData: scan.structuralData, schemas: scan.schemas || [],
    semanticFlags: scan.semanticFlags || {}, schemaQuality: scan.schemaQuality,
    responseTimeMs: scan.technical?.responseTimeMs, siteType: scan.siteType,
  };

  const seo = calculateSEO(d);
  const aeo = calculateAEO(d);
  const geo = calculateGEO(d);

  const criticalIssues: string[] = [];
  for (const cat of seo.breakdown) for (const c of cat.components) if (c.status === 'critical' && c.issues) criticalIssues.push(...c.issues);

  return { seoScore: seo.score, aeoScore: aeo.score, geoScore: geo.score, breakdown: { seo: seo.breakdown, aeo: aeo.breakdown, geo: geo.breakdown }, criticalIssues };
}

function calculateSEO(d: any): { score: number; breakdown: CategoryScore[] } {
  const cats: CategoryScore[] = [];
  let total = 0;
  for (const cat of SEO_CATEGORIES) {
    const results: ComponentResult[] = [];
    let cs = 0;
    for (const comp of cat.components) { const r = comp.evaluate(d); results.push(r); cs += r.score; }
    const pct = cat.maxPoints > 0 ? Math.round((cs / cat.maxPoints) * 100) : 0;
    cats.push({ name: cat.name, score: Math.round(cs), maxScore: cat.maxPoints, percentage: pct, components: results });
    total += cs;
  }
  return { score: Math.min(Math.round(total), 100), breakdown: cats };
}

function calculateAEO(d: any): { score: number; breakdown: CategoryScore[] } {
  let score = 100;
  const comps: ComponentResult[] = [];

  // Content depth (20 pts)
  const wc = d.structuralData?.wordCount || 0;
  if (wc < 300) { score -= 20; comps.push({ score: 0, maxScore: 20, status: 'critical', feedback: 'Content Depth', issues: [`Only ${wc} words - thin content is invisible to AI (need 800+ words)`] }); }
  else if (wc < 800) { const ps = Math.round((wc / 800) * 20); score -= (20 - ps); comps.push({ score: ps, maxScore: 20, status: 'warning', feedback: 'Content Depth', issues: [`${wc} words - aim for 800+ for comprehensive coverage`] }); }
  else comps.push({ score: 20, maxScore: 20, status: 'good', feedback: 'Content Depth' });

  // Schema (30 pts)
  if (d.schemaQuality) {
    if (!d.schemaQuality.hasSchema) { score -= 30; comps.push({ score: 0, maxScore: 30, status: 'critical', feedback: 'Schema Markup', issues: ['No structured data found - critical for AI understanding'] }); }
    else { const ss = Math.round((d.schemaQuality.score / 100) * 30); score -= (30 - ss); comps.push({ score: ss, maxScore: 30, status: ss >= 22 ? 'good' : ss >= 15 ? 'warning' : 'critical', feedback: 'Schema Quality', issues: d.schemaQuality.issues || [] }); }
  } else if (!d.schemas?.length) { score -= 30; comps.push({ score: 0, maxScore: 30, status: 'critical', feedback: 'Schema Markup', issues: ['No structured data found'] }); }

  // Q&A (20 pts)
  const qna = norm(d.semanticFlags?.noDirectQnAMatching); const qp = grad(qna, 20); score -= qp;
  comps.push({ score: 20 - qp, maxScore: 20, status: qp >= 15 ? 'warning' : qp >= 8 ? 'warning' : 'good', feedback: 'Question Answering', issues: qp > 0 ? [`Q&A coverage needs improvement (severity: ${qna}/100)`] : undefined });

  // Entity density (15 pts)
  const ent = norm(d.semanticFlags?.lowEntityDensity); const ep = grad(ent, 15); score -= ep;
  comps.push({ score: 15 - ep, maxScore: 15, status: ep >= 10 ? 'warning' : 'good', feedback: 'Entity Density', issues: ep > 0 ? [`Low density of named entities (severity: ${ent}/100)`] : undefined });

  // Formatting (15 pts)
  const fmt = norm(d.semanticFlags?.poorFormattingConciseness); const fp = grad(fmt, 15); score -= fp;
  comps.push({ score: 15 - fp, maxScore: 15, status: fp >= 10 ? 'warning' : 'good', feedback: 'Formatting', issues: fp > 0 ? [`Formatting needs improvement (severity: ${fmt}/100)`] : undefined });

  // Definitions (10 pts)
  const def = norm(d.semanticFlags?.lackOfDefinitionStatements); const dp = grad(def, 10); score -= dp;
  comps.push({ score: 10 - dp, maxScore: 10, status: dp >= 7 ? 'warning' : 'good', feedback: 'Definitions', issues: dp > 0 ? [`Missing clear definition statements (severity: ${def}/100)`] : undefined });

  let final = Math.min(Math.max(0, score), 100);
  if (final < 50) final = Math.max(final, 10);

  return { score: final, breakdown: [{ name: 'AEO Readiness', score: final, maxScore: 100, percentage: final, components: comps }] };
}

function calculateGEO(d: any): { score: number; breakdown: CategoryScore[] } {
  let score = 100;
  const comps: ComponentResult[] = [];

  // Image alt (25 pts)
  if (d.structuralData?.media?.totalImages > 0) {
    const cov = d.structuralData.media.imagesWithAlt / d.structuralData.media.totalImages;
    if (cov < 0.5) { score -= 25; comps.push({ score: 0, maxScore: 25, status: 'critical', feedback: 'Image Accessibility', issues: [`Only ${Math.round(cov * 100)}% of images have alt text - AI cannot understand images`] }); }
    else if (cov < 0.9) { const ps = Math.round(cov * 25); score -= (25 - ps); comps.push({ score: ps, maxScore: 25, status: 'warning', feedback: 'Image Accessibility', issues: [`${Math.round(cov * 100)}% alt text coverage - aim for 100%`] }); }
    else comps.push({ score: 25, maxScore: 25, status: 'good', feedback: 'Image Accessibility' });
  } else comps.push({ score: 25, maxScore: 25, status: 'good', feedback: 'Image Accessibility' });

  // Promotional tone (20 pts)
  const promo = norm(d.semanticFlags?.promotionalTone); const pp = grad(promo, 20); score -= pp;
  comps.push({ score: 20 - pp, maxScore: 20, status: pp >= 14 ? 'warning' : 'good', feedback: 'Tone', issues: pp > 0 ? [`Promotional tone detected (severity: ${promo}/100)`] : undefined });

  // Expertise (20 pts)
  const exp = norm(d.semanticFlags?.lackOfExpertiseSignals); const xp = grad(exp, 20); score -= xp;
  comps.push({ score: 20 - xp, maxScore: 20, status: xp >= 14 ? 'warning' : 'good', feedback: 'Expertise', issues: xp > 0 ? [`Missing expertise signals (severity: ${exp}/100)`] : undefined });

  // Hard data (15 pts)
  const dat = norm(d.semanticFlags?.lackOfHardData); const dtp = grad(dat, 15); score -= dtp;
  comps.push({ score: 15 - dtp, maxScore: 15, status: dtp >= 10 ? 'warning' : 'good', feedback: 'Data & Facts', issues: dtp > 0 ? [`Lacks specific data and statistics (severity: ${dat}/100)`] : undefined });

  // First person (10 pts)
  const fp = norm(d.semanticFlags?.heavyFirstPersonUsage); const fpp = grad(fp, 10); score -= fpp;
  comps.push({ score: 10 - fpp, maxScore: 10, status: fpp >= 7 ? 'warning' : 'good', feedback: 'Objectivity', issues: fpp > 0 ? [`First-person usage detected (severity: ${fp}/100)`] : undefined });

  // Claims (10 pts)
  const cl = norm(d.semanticFlags?.unsubstantiatedClaims); const cp = grad(cl, 10); score -= cp;
  comps.push({ score: 10 - cp, maxScore: 10, status: cp >= 7 ? 'warning' : 'good', feedback: 'Claims', issues: cp > 0 ? [`Unsubstantiated claims detected (severity: ${cl}/100)`] : undefined });

  return { score: Math.max(0, score), breakdown: [{ name: 'GEO Visibility', score: Math.max(0, score), maxScore: 100, percentage: Math.max(0, score), components: comps }] };
}
