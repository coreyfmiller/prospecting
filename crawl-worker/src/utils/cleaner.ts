import * as cheerio from 'cheerio';

export function thinHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, svg, iframe, nav, footer, noscript, link, head').remove();
  $('*').each((_, el) => {
    const attributes = $(el).attr();
    if (attributes) {
      Object.keys(attributes).forEach((attr) => {
        if (!['href', 'src', 'alt', 'id', 'class'].includes(attr)) {
          $(el).removeAttr(attr);
        }
      });
    }
  });
  return $('body').text().replace(/\s\s+/g, ' ').trim();
}

export function normalizeSchema(schemas: any[]): any[] {
  const normalized: any[] = [];
  schemas.forEach(schema => {
    if (Array.isArray(schema)) normalized.push(...schema);
    else if (schema['@graph']) normalized.push(...schema['@graph']);
    else normalized.push(schema);
  });
  return normalized;
}

export function extractSchema(html: string): any[] {
  const $ = cheerio.load(html);
  const schemas: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try { schemas.push(JSON.parse($(el).html() || '{}')); } catch { /* skip */ }
  });
  return normalizeSchema(schemas);
}
