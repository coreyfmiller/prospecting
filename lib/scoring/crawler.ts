/**
 * Crawler — calls the Playwright crawl worker to get JS-rendered page data.
 * Falls back to fetch+cheerio if the worker isn't configured.
 * This ensures identical page data to the scoring pipeline.
 */
import * as cheerio from 'cheerio';
import { detectPlatform } from './platform-detector';
import type { CrawlResult } from './types';

const CRAWL_WORKER_URL = process.env.CRAWL_WORKER_URL || '';
const CRAWL_WORKER_SECRET = process.env.CRAWL_WORKER_SECRET || '';

export async function crawlPage(url: string): Promise<CrawlResult> {
  if (!url.startsWith('http')) url = `https://${url}`;

  // Use Playwright crawl worker when configured
  if (CRAWL_WORKER_URL && CRAWL_WORKER_SECRET) {
    return crawlViaWorker(url);
  }

  // Fallback: fetch + cheerio (no JS rendering)
  return crawlViaFetch(url);
}

/**
 * Crawl via the Playwright worker — identical page data to the scoring pipeline.
 */
async function crawlViaWorker(url: string): Promise<CrawlResult> {
  const start = Date.now();
  console.log(`[Crawler] Remote scan via worker: ${url}`);

  try {
    const res = await fetch(`${CRAWL_WORKER_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRAWL_WORKER_SECRET}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[Crawler] Worker failed (${res.status}):`, body.error);
      throw new Error(body.error || 'Remote crawl failed');
    }

    const { data } = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Crawler] Worker done: ${url} (${elapsed}s)`);

    // Map worker ScanResult to our CrawlResult type
    return {
      url: data.url,
      title: data.title || '',
      description: data.description || '',
      thinnedText: data.thinnedText || '',
      schemas: data.schemas || [],
      structuralData: data.structuralData || {
        semanticTags: { article: 0, main: 0, nav: 0, aside: 0, headers: 0, h1Count: 0, h2Count: 0, h3Count: 0 },
        links: { internal: 0, external: 0, socialLinksCount: 0 },
        media: { totalImages: 0, imagesWithAlt: 0 },
        wordCount: 0,
      },
      technical: {
        responseTimeMs: data.technical?.responseTimeMs || (Date.now() - start),
        isHttps: data.technical?.isHttps ?? url.startsWith('https'),
      },
      platformDetection: data.platformDetection ? {
        platform: data.platformDetection.platform,
        label: data.platformDetection.label,
        confidence: data.platformDetection.confidence,
      } : undefined,
      botProtection: detectBotProtectionFromWorkerData(data),
    };
  } catch (err: any) {
    console.error(`[Crawler] Worker error for ${url}:`, err.message);
    throw err;
  }
}

function detectBotProtectionFromWorkerData(data: any): { detected: boolean; type: string } | undefined {
  const title = (data.title || '').toLowerCase();
  if (title.includes('just a moment') || title.includes('attention required') || title === 'robot or human?') {
    return { detected: true, type: 'Cloudflare' };
  }
  return undefined;
}

/**
 * Fallback crawler using fetch + cheerio (no JS rendering).
 */
async function crawlViaFetch(url: string): Promise<CrawlResult> {
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

  const botProtection = detectBotProtection(html);
  if (botProtection) return { ...emptyResult(url, responseTimeMs), botProtection };

  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() || '';
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const article = $('article').length;
  const main = $('main').length;
  const nav = $('nav').length;
  const aside = $('aside').length;
  const headers = $('h1, h2, h3, h4, h5, h6').length;

  $('script, style, svg, iframe, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;

  $('nav, footer, head, link').remove();
  const thinnedText = $('body').text().replace(/\s\s+/g, ' ').trim();

  const domain = new URL(finalUrl).hostname;
  let internalLinks = 0, externalLinks = 0, socialLinksCount = 0;
  const socialDomains = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'github.com', 'youtube.com', 'tiktok.com'];
  const $fresh = cheerio.load(html);

  $fresh('a[href]').each((_, el) => {
    const href = $fresh(el).attr('href') || '';
    if (href.startsWith('/') || href.includes(domain)) internalLinks++;
    else if (href.startsWith('http')) {
      externalLinks++;
      if (socialDomains.some(d => href.toLowerCase().includes(d))) socialLinksCount++;
    }
  });

  const imgs = $fresh('img');
  const totalImages = imgs.length;
  let imagesWithAlt = 0;
  imgs.each((_, el) => { if ($fresh(el).attr('alt')?.trim()) imagesWithAlt++; });

  const schemas: any[] = [];
  $fresh('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($fresh(el).html() || '{}');
      if (Array.isArray(data)) schemas.push(...data);
      else if (data['@graph']) schemas.push(...data['@graph']);
      else schemas.push(data);
    } catch {}
  });

  const platformDetection = detectPlatform(html);

  return {
    url: finalUrl, title, description, thinnedText, schemas,
    structuralData: {
      semanticTags: { article, main, nav, aside, headers, h1Count, h2Count, h3Count },
      links: { internal: internalLinks, external: externalLinks, socialLinksCount },
      media: { totalImages, imagesWithAlt },
      wordCount,
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
      wordCount: 0,
    },
    technical: { responseTimeMs, isHttps: false },
  };
}
