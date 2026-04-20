/**
 * Crawler — extracts the same structural data shape as Duelly's Playwright crawler
 * but using fetch + cheerio (no headless browser needed).
 */
import * as cheerio from 'cheerio';
import { detectPlatform } from './platform-detector';
import type { CrawlResult } from './types';

export async function crawlPage(url: string): Promise<CrawlResult> {
  if (!url.startsWith('http')) url = `https://${url}`;

  const start = Date.now();
  let html = '';
  let finalUrl = url;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    html = await res.text();
    finalUrl = res.url;
  } catch {
    return emptyResult(url, Date.now() - start);
  }

  const responseTimeMs = Date.now() - start;
  const isHttps = finalUrl.startsWith('https');

  // Bot protection check
  const botProtection = detectBotProtection(html);
  if (botProtection) return { ...emptyResult(url, responseTimeMs), botProtection };

  const $ = cheerio.load(html);

  // Title & description
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() || '';

  // Viewport
  const hasViewport = $('meta[name="viewport"]').length > 0;

  // Headings
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  // Semantic tags
  const article = $('article').length;
  const main = $('main').length;
  const nav = $('nav').length;
  const aside = $('aside').length;
  const headers = $('h1, h2, h3, h4, h5, h6').length;

  // Word count — strip scripts/styles, get text
  $('script, style, svg, iframe, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;

  // Thinned text for AI (same as Duelly's cleaner.ts)
  $('nav, footer, head, link').remove();
  const thinnedText = $('body').text().replace(/\s\s+/g, ' ').trim();

  // Links
  const domain = new URL(finalUrl).hostname;
  let internalLinks = 0, externalLinks = 0, socialLinksCount = 0;
  const socialDomains = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'github.com', 'youtube.com', 'tiktok.com'];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('/') || href.includes(domain)) {
      internalLinks++;
    } else if (href.startsWith('http')) {
      externalLinks++;
      if (socialDomains.some(d => href.toLowerCase().includes(d))) socialLinksCount++;
    }
  });

  // Images
  const imgs = $('img');
  const totalImages = imgs.length;
  let imagesWithAlt = 0;
  imgs.each((_, el) => { if ($(el).attr('alt')?.trim()) imagesWithAlt++; });

  // Schemas (JSON-LD) — normalize @graph and arrays like Duelly
  const schemas: any[] = [];
  // Re-load fresh HTML for schema extraction (we removed tags above)
  const $fresh = cheerio.load(html);
  $fresh('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($fresh(el).html() || '{}');
      if (Array.isArray(data)) schemas.push(...data);
      else if (data['@graph']) schemas.push(...data['@graph']);
      else schemas.push(data);
    } catch {}
  });

  // Platform detection
  const platformDetection = detectPlatform(html);

  return {
    url: finalUrl, title, description, thinnedText, schemas,
    structuralData: {
      semanticTags: { article, main, nav, aside, headers, h1Count, h2Count, h3Count },
      links: { internal: internalLinks, external: externalLinks, socialLinksCount },
      media: { totalImages, imagesWithAlt },
      wordCount, hasViewport,
    },
    technical: { responseTimeMs, isHttps },
    platformDetection: { platform: platformDetection.platform, label: platformDetection.label, confidence: platformDetection.confidence },
  };
}

function detectBotProtection(html: string): { detected: boolean; type: string } | undefined {
  const h = html.toLowerCase();
  if (h.includes('just a moment') || h.includes('cf-browser-verification') || h.includes('cf_chl_opt') || (h.includes('challenge-platform') && h.includes('cloudflare')))
    return { detected: true, type: 'Cloudflare' };
  if (h.includes('sucuri-firewall') || h.includes('sucuri website firewall'))
    return { detected: true, type: 'Sucuri' };
  if (h.includes('akamai') && (h.includes('bot manager') || h.includes('access denied')))
    return { detected: true, type: 'Akamai' };
  if ((h.includes('access denied') && h.includes('captcha')) || h.includes('robot or human?') || h.includes('are you a robot'))
    return { detected: true, type: 'Bot Protection' };
  return undefined;
}

function emptyResult(url: string, responseTimeMs: number): CrawlResult {
  return {
    url, title: '', description: '', thinnedText: '', schemas: [],
    structuralData: {
      semanticTags: { article: 0, main: 0, nav: 0, aside: 0, headers: 0, h1Count: 0, h2Count: 0, h3Count: 0 },
      links: { internal: 0, external: 0, socialLinksCount: 0 },
      media: { totalImages: 0, imagesWithAlt: 0 },
      wordCount: 0, hasViewport: false,
    },
    technical: { responseTimeMs, isHttps: false },
  };
}
