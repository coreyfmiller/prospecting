import { chromium, type Browser, type Page } from 'playwright';
import { thinHtml, extractSchema } from './utils/cleaner';
import { summarizeContent, formatSummaryForAI } from './utils/content-summarizer';
import { getCrawlerErrorMessage } from './utils/crawler-errors';
import { detectPlatform, type PlatformResult } from './platform-detector';

export interface ScanResult {
  url: string;
  title: string;
  description: string;
  thinnedText: string;
  summarizedContent: string;
  schemas: any[];
  structuralData: {
    semanticTags: { article: number; main: number; nav: number; aside: number; headers: number; h1Count: number; h2Count: number; h3Count: number };
    links: { internal: number; external: number; socialLinksCount: number };
    media: { totalImages: number; imagesWithAlt: number };
    wordCount: number;
  };
  technical: { responseTimeMs: number; isHttps: boolean; status: number };
  metaChecks: {
    titleLength: number; descriptionLength: number;
    hasCanonical: boolean; canonicalUrl: string; hasViewport: boolean;
    hasOgTitle: boolean; hasOgDescription: boolean; hasOgImage: boolean; hasTwitterCard: boolean;
  };
  platformDetection?: PlatformResult;
}

async function extractPageData(page: Page, targetUrl: string, startTime: number, statusCode: number, options?: { lightweight?: boolean }): Promise<ScanResult> {
  const html = await page.content();
  const title = await page.title();

  let description = '';
  try {
    description = await page.locator('meta[name="description"]').getAttribute('content', { timeout: 2000 }) || '';
  } catch { /* optional */ }

  const responseTimeMs = Date.now() - startTime;
  const isHttps = targetUrl.startsWith('https://');

  const structuralData = await page.evaluate(() => {
    const currentHostname = window.location.hostname;
    const links = Array.from(document.querySelectorAll('a'));
    let internalLinks = 0, externalLinks = 0, socialLinksCount = 0;
    const socialDomains = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'github.com', 'youtube.com'];
    links.forEach(link => {
      if (link.href.includes(currentHostname) || link.href.startsWith('/')) { internalLinks++; }
      else if (link.href?.startsWith('http')) {
        externalLinks++;
        if (socialDomains.some(d => link.href.toLowerCase().includes(d))) socialLinksCount++;
      }
    });
    const images = Array.from(document.querySelectorAll('img'));
    const imagesWithAlt = images.filter(img => img.hasAttribute('alt') && img.getAttribute('alt')!.trim().length > 0).length;
    const bodyText = document.body.innerText || '';
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
    return {
      semanticTags: {
        article: document.querySelectorAll('article').length, main: document.querySelectorAll('main').length,
        nav: document.querySelectorAll('nav').length, aside: document.querySelectorAll('aside').length,
        headers: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
        h1Count: document.querySelectorAll('h1').length, h2Count: document.querySelectorAll('h2').length, h3Count: document.querySelectorAll('h3').length,
      },
      links: { internal: internalLinks, external: externalLinks, socialLinksCount },
      media: { totalImages: images.length, imagesWithAlt },
      wordCount,
    };
  });

  const metaChecks = await page.evaluate(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const viewport = document.querySelector('meta[name="viewport"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterCard = document.querySelector('meta[name="twitter:card"]') || document.querySelector('meta[property="twitter:card"]');
    return {
      hasCanonical: !!canonical, canonicalUrl: canonical?.getAttribute('href') || '',
      hasViewport: !!viewport,
      hasOgTitle: !!ogTitle && !!(ogTitle as HTMLMetaElement).content,
      hasOgDescription: !!ogDesc && !!(ogDesc as HTMLMetaElement).content,
      hasOgImage: !!ogImage && !!(ogImage as HTMLMetaElement).content,
      hasTwitterCard: !!twitterCard,
    };
  });

  const contentSummary = options?.lightweight ? null : summarizeContent(html);
  const summarizedContent = contentSummary ? formatSummaryForAI(contentSummary) : '';
  const platformDetection = detectPlatform(html);

  return {
    url: targetUrl, title, description,
    thinnedText: thinHtml(html), summarizedContent,
    schemas: extractSchema(html), structuralData,
    technical: { responseTimeMs, isHttps, status: statusCode },
    metaChecks: { titleLength: title.length, descriptionLength: description.length, ...metaChecks },
    platformDetection,
  };
}

export async function performScan(targetUrl: string, options?: { lightweight?: boolean }): Promise<ScanResult> {
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  let browser: Browser | null = null;
  const startTime = Date.now();

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page: Page = await browser.newPage();
    console.log(`[Crawler] Navigating to: ${targetUrl}`);

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response) throw new Error(`Failed to retrieve response for ${targetUrl}`);

    console.log(`[Crawler] Loaded ${targetUrl} (Status: ${response.status()})`);
    return await extractPageData(page, targetUrl, startTime, response.status(), options);
  } catch (error: any) {
    console.error(`Crawler failed for ${targetUrl}:`, error.message);
    const crawlerError = getCrawlerErrorMessage(error);
    const enhanced = new Error(crawlerError.userMessage);
    (enhanced as any).technicalMessage = crawlerError.technicalMessage;
    (enhanced as any).suggestion = crawlerError.suggestion;
    (enhanced as any).category = crawlerError.category;
    (enhanced as any).originalError = error.message;
    throw enhanced;
  } finally {
    if (browser) await browser.close();
  }
}
