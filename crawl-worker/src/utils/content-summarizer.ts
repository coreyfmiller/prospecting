import * as cheerio from 'cheerio';

export interface SummarizedContent {
  headings: { h1: string[]; h2: string[]; h3: string[] };
  mainContent: string;
  lists: string[];
  emphasis: string[];
  metaKeywords: string[];
  paragraphs: string[];
}

export function summarizeContent(html: string): SummarizedContent {
  const $ = cheerio.load(html);
  $('script, style, svg, iframe, nav, footer, noscript, link, head, header, aside').remove();

  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().slice(0, 3);
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 5);
  const h3 = $('h3').map((_, el) => $(el).text().trim()).get().slice(0, 5);

  let mainText = '';
  const mainEl = $('main, article, [role="main"]').first();
  mainText = mainEl.length > 0 ? mainEl.text() : $('body').text();

  const words = mainText.replace(/\s\s+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).slice(0, 500);
  const mainContent = words.join(' ');

  const lists: string[] = [];
  $('ul li, ol li').each((i, el) => {
    if (i < 10) { const t = $(el).text().trim(); if (t.length > 10 && t.length < 150) lists.push(t); }
  });

  const emphasis: string[] = [];
  $('strong, b, em').each((i, el) => {
    if (i < 15) { const t = $(el).text().trim(); if (t.length > 5 && t.length < 100) emphasis.push(t); }
  });

  const metaKeywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];

  const paragraphs: string[] = [];
  $('p').each((i, el) => {
    if (i < 3) { const t = $(el).text().trim(); if (t.length > 50) paragraphs.push(t); }
  });

  return {
    headings: { h1, h2, h3 }, mainContent,
    lists: lists.slice(0, 10), emphasis: emphasis.slice(0, 15),
    metaKeywords: metaKeywords.slice(0, 10), paragraphs: paragraphs.slice(0, 3),
  };
}

export function formatSummaryForAI(summary: SummarizedContent): string {
  const parts: string[] = [];
  if (summary.headings.h1.length > 0) parts.push(`H1: ${summary.headings.h1.join(' | ')}`);
  if (summary.headings.h2.length > 0) parts.push(`H2: ${summary.headings.h2.join(' | ')}`);
  if (summary.headings.h3.length > 0) parts.push(`H3: ${summary.headings.h3.join(' | ')}`);
  parts.push(`\nCONTENT: ${summary.mainContent}`);
  if (summary.paragraphs && summary.paragraphs.length > 0) parts.push(`\nSAMPLE PARAGRAPHS (for tone/style analysis):\n${summary.paragraphs.join('\n\n')}`);
  if (summary.lists.length > 0) parts.push(`\nKEY POINTS:\n- ${summary.lists.join('\n- ')}`);
  if (summary.emphasis.length > 0) parts.push(`\nEMPHASIS: ${summary.emphasis.join(' • ')}`);
  if (summary.metaKeywords.length > 0) parts.push(`\nKEYWORDS: ${summary.metaKeywords.join(', ')}`);
  return parts.join('\n');
}
