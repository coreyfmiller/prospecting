/** Component-based SEO scoring */
import type { ComponentResult } from './types';
import { getPenaltyWeight } from './scoring-config-site-types';

export interface ScoreComponent {
  name: string; maxPoints: number;
  evaluate: (data: any) => ComponentResult;
}
export interface ComponentCategory { name: string; maxPoints: number; components: ScoreComponent[] }

// ── SEO Foundation (40 pts) ──────────────────────────────────────────────
const SEO_FOUNDATION: ScoreComponent[] = [
  { name: 'Title Tag', maxPoints: 10, evaluate: (d) => {
    const len = d.titleLength;
    if (len === 0) return { score: 0, maxScore: 10, status: 'critical', feedback: 'Missing title tag - critical SEO issue', issues: ['No title tag found'] };
    if (len < 30) return { score: 5, maxScore: 10, status: 'warning', feedback: 'Title tag too short - should be 30-60 characters', issues: [`Title is only ${len} characters`] };
    if (len > 60) return { score: 7, maxScore: 10, status: 'warning', feedback: 'Title tag too long - may be truncated in search results', issues: [`Title is ${len} characters (recommended: 30-60)`] };
    return { score: 10, maxScore: 10, status: 'excellent', feedback: 'Title tag is well-optimized' };
  }},
  { name: 'Meta Description', maxPoints: 8, evaluate: (d) => {
    const len = d.descriptionLength;
    if (len === 0) return { score: 0, maxScore: 8, status: 'critical', feedback: 'Missing meta description', issues: ['No meta description found'] };
    if (len < 50) return { score: 3, maxScore: 8, status: 'warning', feedback: 'Meta description too short', issues: [`Only ${len} characters (recommended: 120-160)`] };
    if (len > 160) return { score: 6, maxScore: 8, status: 'warning', feedback: 'Meta description too long - may be truncated', issues: [`${len} characters (recommended: 120-160)`] };
    return { score: 8, maxScore: 8, status: 'excellent', feedback: 'Meta description is well-optimized' };
  }},
  { name: 'H1 Heading', maxPoints: 8, evaluate: (d) => {
    const c = d.structuralData?.semanticTags?.h1Count || 0;
    if (c === 0) return { score: 0, maxScore: 8, status: 'critical', feedback: 'Missing H1 heading', issues: ['No H1 tag found on page'] };
    if (c > 1) return { score: 5, maxScore: 8, status: 'warning', feedback: 'Multiple H1 tags found', issues: [`${c} H1 tags found (should be exactly 1)`] };
    return { score: 8, maxScore: 8, status: 'excellent', feedback: 'H1 heading is properly implemented' };
  }},
  { name: 'HTTPS Security', maxPoints: 7, evaluate: (d) => {
    if (!d.url?.startsWith('https://')) return { score: 0, maxScore: 7, status: 'critical', feedback: 'Site not using HTTPS - major security and SEO issue', issues: ['HTTPS not enabled'] };
    return { score: 7, maxScore: 7, status: 'excellent', feedback: 'HTTPS properly configured' };
  }},
  { name: 'Mobile Responsiveness', maxPoints: 7, evaluate: (d) => {
    if (!d.structuralData?.hasViewport) return { score: 0, maxScore: 7, status: 'critical', feedback: 'Missing viewport meta tag - not mobile optimized', issues: ['No viewport meta tag found'] };
    return { score: 7, maxScore: 7, status: 'excellent', feedback: 'Mobile viewport configured' };
  }},
];

// ── SEO Content Quality (42 pts) ─────────────────────────────────────────
const SEO_CONTENT: ScoreComponent[] = [
  { name: 'Content Depth', maxPoints: 15, evaluate: (d) => {
    const wc = d.structuralData?.wordCount || 0;
    const pw = getPenaltyWeight(d.siteType || 'general', 'thinContent');
    if (wc < 300) { const p = Math.round(15 * pw); return { score: Math.max(0, 15 - p), maxScore: 15, status: p >= 12 ? 'critical' : 'warning', feedback: 'Thin content - needs substantial expansion', issues: [`Only ${wc} words (recommended: 800+)`] }; }
    if (wc < 500) { const p = Math.round(9 * pw); return { score: Math.max(0, 15 - p), maxScore: 15, status: 'warning', feedback: 'Content is minimal - consider expanding', issues: [`${wc} words (recommended: 800+)`] }; }
    if (wc < 800) { const p = Math.round(4 * pw); return { score: Math.max(0, 15 - p), maxScore: 15, status: 'good', feedback: 'Decent content length', issues: [`${wc} words (optimal: 800+)`] }; }
    return { score: 15, maxScore: 15, status: 'excellent', feedback: `Strong content depth (${wc} words)` };
  }},
  { name: 'Readability', maxPoints: 7, evaluate: (d) => {
    const wc = d.structuralData?.wordCount || 0;
    if (wc < 300) return { score: 0, maxScore: 7, status: 'critical', feedback: 'Insufficient content to evaluate readability', issues: ['Need at least 300 words for meaningful content'] };
    const sev = typeof d.semanticFlags?.poorReadability === 'number' ? Math.max(0, Math.min(100, d.semanticFlags.poorReadability)) : 0;
    const pen = Math.round((sev / 100) * 7);
    if (pen === 0) return { score: 7, maxScore: 7, status: 'excellent', feedback: 'Content is clear and readable' };
    return { score: 7 - pen, maxScore: 7, status: pen >= 5 ? 'warning' : 'good', feedback: 'Content readability needs improvement', issues: [`Readability concerns detected (severity: ${sev}/100)`] };
  }},
  { name: 'Internal Linking', maxPoints: 10, evaluate: (d) => {
    const il = d.structuralData?.links?.internal || 0;
    const wc = d.structuralData?.wordCount || 0;
    if (il === 0) return { score: 0, maxScore: 10, status: 'critical', feedback: 'No internal links found', issues: ['Add internal links to improve site structure'] };
    if (wc > 0 && (il / wc) > 0.05) return { score: 2, maxScore: 10, status: 'warning', feedback: 'Excessive internal linking - appears spammy', issues: [`${il} links in ${wc} words`] };
    if (il < 5) return { score: 3, maxScore: 10, status: 'warning', feedback: 'Minimal internal linking - poor site architecture', issues: [`Only ${il} internal links (recommended: 10+)`] };
    if (il < 10) return { score: 6, maxScore: 10, status: 'good', feedback: 'Decent internal linking', issues: [`${il} internal links (optimal: 10+)`] };
    if (il < 20) return { score: 8, maxScore: 10, status: 'excellent', feedback: `Good internal linking (${il} links)` };
    return { score: 10, maxScore: 10, status: 'excellent', feedback: `Strong internal linking architecture (${il} links)` };
  }},
  { name: 'Image Optimization', maxPoints: 10, evaluate: (d) => {
    const { totalImages = 0, imagesWithAlt = 0 } = d.structuralData?.media || {};
    if (totalImages === 0) return { score: 10, maxScore: 10, status: 'excellent', feedback: 'No images to optimize' };
    const cov = (imagesWithAlt / totalImages) * 100;
    const miss = totalImages - imagesWithAlt;
    if (cov === 0) return { score: 0, maxScore: 10, status: 'critical', feedback: 'No images have alt text - major accessibility issue', issues: [`All ${totalImages} images missing alt text`] };
    if (cov < 50) return { score: 2, maxScore: 10, status: 'critical', feedback: 'Most images missing alt text', issues: [`${miss} of ${totalImages} images missing alt text (${Math.round(cov)}% coverage)`] };
    if (cov < 80) return { score: 5, maxScore: 10, status: 'warning', feedback: 'Many images missing alt text', issues: [`${miss} of ${totalImages} images missing alt text (${Math.round(cov)}% coverage)`] };
    if (cov < 100) return { score: 8, maxScore: 10, status: 'good', feedback: 'Most images have alt text', issues: [`${miss} image${miss > 1 ? 's' : ''} still need alt text`] };
    return { score: 10, maxScore: 10, status: 'excellent', feedback: 'All images have alt text - excellent accessibility' };
  }},
];

// ── SEO Technical (22 pts) ───────────────────────────────────────────────
const SEO_TECHNICAL: ScoreComponent[] = [
  { name: 'Page Performance', maxPoints: 10, evaluate: (d) => {
    const ms = d.responseTimeMs;
    if (!ms) return { score: 10, maxScore: 10, status: 'excellent', feedback: 'Performance measurement unavailable' };
    if (ms > 3000) return { score: 0, maxScore: 10, status: 'critical', feedback: 'Very slow page load time - critical performance issue', issues: [`${ms}ms response time (target: <1500ms)`] };
    if (ms > 2000) return { score: 3, maxScore: 10, status: 'warning', feedback: 'Slow page load time', issues: [`${ms}ms response time (target: <1500ms)`] };
    if (ms > 1500) return { score: 7, maxScore: 10, status: 'good', feedback: 'Acceptable page load time', issues: [`${ms}ms response time (optimal: <1500ms)`] };
    return { score: 10, maxScore: 10, status: 'excellent', feedback: `Fast page load (${ms}ms)` };
  }},
  { name: 'Semantic HTML', maxPoints: 6, evaluate: (d) => {
    const wc = d.structuralData?.wordCount || 0;
    if (wc < 300) return { score: 6, maxScore: 6, status: 'excellent', feedback: 'Semantic structure not critical for short pages' };
    const st = d.structuralData?.semanticTags || {};
    const s = (st.main ? 2 : 0) + (st.nav ? 1 : 0) + (st.article ? 1 : 0);
    if (s === 0) return { score: 0, maxScore: 6, status: 'warning', feedback: 'No semantic HTML5 tags found', issues: ['Consider using <main>, <nav>, <article>'] };
    if (s < 3) return { score: 3, maxScore: 6, status: 'warning', feedback: 'Limited semantic structure', issues: ['Add more HTML5 semantic tags'] };
    return { score: 6, maxScore: 6, status: 'excellent', feedback: 'Good semantic HTML structure' };
  }},
  { name: 'URL Structure', maxPoints: 6, evaluate: (d) => {
    const u = d.url || '';
    if (/sessionid|sid=|jsessionid/i.test(u)) return { score: 2, maxScore: 6, status: 'warning', feedback: 'URL contains session IDs', issues: ['Remove session IDs from URLs'] };
    if ((u.match(/&/g) || []).length > 3) return { score: 3, maxScore: 6, status: 'warning', feedback: 'URL has many parameters' };
    if (u.includes('?')) return { score: 5, maxScore: 6, status: 'good', feedback: 'URL structure is acceptable' };
    return { score: 6, maxScore: 6, status: 'excellent', feedback: 'Clean URL structure' };
  }},
];

// ── SEO Advanced (8 pts) ─────────────────────────────────────────────────
const SEO_ADVANCED: ScoreComponent[] = [
  { name: 'Schema Markup Quality', maxPoints: 5, evaluate: (d) => {
    if (!d.schemas || d.schemas.length === 0) return { score: 0, maxScore: 5, status: 'warning', feedback: 'No schema markup found', issues: ['Add schema.org structured data'] };
    if (d.schemaQuality?.score) {
      const ns = Math.round((d.schemaQuality.score / 100) * 5);
      return { score: ns, maxScore: 5, status: ns >= 4 ? 'excellent' : ns >= 3 ? 'good' : 'warning', feedback: d.schemaQuality.score >= 80 ? 'High-quality schema implementation' : 'Schema present but needs improvement', issues: d.schemaQuality.issues };
    }
    return { score: 3, maxScore: 5, status: 'good', feedback: `Schema markup present (${d.schemas.length} types)` };
  }},
  { name: 'External Authority Links', maxPoints: 3, evaluate: (d) => {
    const wc = d.structuralData?.wordCount || 0;
    if (wc < 500) return { score: 3, maxScore: 3, status: 'excellent', feedback: 'External links not critical for short pages' };
    if ((d.structuralData?.links?.external || 0) === 0) return { score: 0, maxScore: 3, status: 'warning', feedback: 'No external links found', issues: ['Consider linking to authoritative sources'] };
    return { score: 3, maxScore: 3, status: 'excellent', feedback: `External links present (${d.structuralData.links.external})` };
  }},
];

// ── Category exports ─────────────────────────────────────────────────────
export const SEO_CATEGORIES: ComponentCategory[] = [
  { name: 'Foundation', maxPoints: 40, components: SEO_FOUNDATION },
  { name: 'Content Quality', maxPoints: 42, components: SEO_CONTENT },
  { name: 'Technical Excellence', maxPoints: 22, components: SEO_TECHNICAL },
  { name: 'Advanced Optimization', maxPoints: 8, components: SEO_ADVANCED },
];
