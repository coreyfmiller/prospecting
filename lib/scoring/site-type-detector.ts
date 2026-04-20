/** Site type detector — ported from Duelly */
import type { SiteType, SiteTypeResult, CrawlResult } from './types';

export function detectSiteType(page: CrawlResult): SiteTypeResult {
  const scores = new Map<SiteType, number>();

  // Signal 1: Schema types (40% weight)
  const schemaTypes = new Set(page.schemas.map(s => s['@type']).flat().filter(Boolean));
  if (schemaTypes.has('LocalBusiness') || schemaTypes.has('Place')) scores.set('local-business', (scores.get('local-business') || 0) + 40);
  if (schemaTypes.has('Restaurant') || schemaTypes.has('FoodEstablishment')) scores.set('restaurant', (scores.get('restaurant') || 0) + 40);
  if (schemaTypes.has('Product') || schemaTypes.has('Offer') || schemaTypes.has('Store')) scores.set('e-commerce', (scores.get('e-commerce') || 0) + 40);
  if (schemaTypes.has('SoftwareApplication') || schemaTypes.has('WebApplication')) scores.set('saas', (scores.get('saas') || 0) + 40);
  if (schemaTypes.has('Article') || schemaTypes.has('BlogPosting') || schemaTypes.has('NewsArticle')) scores.set('blog', (scores.get('blog') || 0) + 40);
  if (schemaTypes.has('ProfessionalService') || schemaTypes.has('Attorney') || schemaTypes.has('Dentist')) scores.set('professional-services', (scores.get('professional-services') || 0) + 40);
  if (schemaTypes.has('EducationalOrganization') || schemaTypes.has('Course')) scores.set('educational', (scores.get('educational') || 0) + 40);

  // Signal 2: Content patterns (30% weight)
  const t = page.thinnedText;
  const patterns: Record<SiteType, RegExp> = {
    'e-commerce': /add to cart|shopping cart|checkout|buy now|price|\$\d+|shop|store/i,
    'local-business': /hours|location|directions|call us|visit us|address|phone|contact/i,
    'saas': /pricing|plans|free trial|demo|sign up|subscribe|features|api/i,
    'blog': /posted on|by author|read more|comments|categories|tags|archive/i,
    'restaurant': /menu|reservations|order online|delivery|takeout|dine in/i,
    'contractor': /free estimate|licensed|insured|years of experience|service area|emergency/i,
    'professional-services': /consultation|expertise|certified|professional|practice|clients/i,
    'portfolio': /portfolio|projects|work|case studies|gallery|showcase/i,
    'news-media': /breaking|latest news|headlines|reporter|journalist|press/i,
    'educational': /courses|learning|students|education|training|curriculum/i,
    'general': /about|services|contact|home/i,
  };
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(t)) scores.set(type as SiteType, (scores.get(type as SiteType) || 0) + 30);
  }

  // Signal 3: URL patterns (10% weight)
  const url = page.url.toLowerCase();
  if (/\/products?\/|\/shop\/|\/store\//i.test(url)) scores.set('e-commerce', (scores.get('e-commerce') || 0) + 10);
  if (/\/blog\/|\/articles?\/|\/posts?\//i.test(url)) scores.set('blog', (scores.get('blog') || 0) + 10);
  if (/\/menu\/|\/food\//i.test(url)) scores.set('restaurant', (scores.get('restaurant') || 0) + 10);

  const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  const primaryType = sorted[0]?.[0] || 'general';
  const confidence = sorted[0]?.[1] || 0;
  const secondaryTypes = sorted.slice(1).filter(([, s]) => s >= 50).map(([t]) => t);

  return {
    primaryType,
    secondaryTypes,
    confidence,
    signals: Array.from(scores.entries()).map(([type, score]) => ({ type, score, evidence: 'auto-detected' })),
  };
}
