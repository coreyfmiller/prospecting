/** Platform/CMS detector — ported from Duelly */

export type Platform =
  | 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'webflow'
  | 'drupal' | 'joomla' | 'magento' | 'nextjs' | 'gatsby'
  | 'ghost' | 'hubspot' | 'custom';

export interface PlatformResult {
  platform: Platform;
  confidence: 'high' | 'medium' | 'low';
  label: string;
}

interface Sig { platform: Platform; label: string; patterns: RegExp[]; high: number; med: number }

const sigs: Sig[] = [
  { platform: 'wordpress', label: 'WordPress', patterns: [/wp-content\//i, /wp-includes\//i, /<meta\s+name="generator"\s+content="WordPress/i, /\/wp-json\//i, /wp-emoji/i, /class=".*?wp-/i], high: 3, med: 1 },
  { platform: 'shopify', label: 'Shopify', patterns: [/cdn\.shopify\.com/i, /Shopify\.theme/i, /shopify-section/i, /myshopify\.com/i, /<meta\s+name="generator"\s+content="Shopify/i], high: 2, med: 1 },
  { platform: 'wix', label: 'Wix', patterns: [/static\.wixstatic\.com/i, /wix-code-sdk/i, /_wix_browser_sess/i, /wixsite\.com/i], high: 2, med: 1 },
  { platform: 'squarespace', label: 'Squarespace', patterns: [/static1\.squarespace\.com/i, /<!-- This is Squarespace/i, /squarespace-cdn/i, /sqsp-/i, /<meta\s+name="generator"\s+content="Squarespace/i], high: 2, med: 1 },
  { platform: 'webflow', label: 'Webflow', patterns: [/assets\.website-files\.com/i, /data-wf-/i, /webflow\.com/i, /w-nav/i], high: 2, med: 1 },
  { platform: 'drupal', label: 'Drupal', patterns: [/Drupal\.settings/i, /\/sites\/default\/files\//i, /<meta\s+name="generator"\s+content="Drupal/i], high: 2, med: 1 },
  { platform: 'joomla', label: 'Joomla', patterns: [/<meta\s+name="generator"\s+content="Joomla/i, /\/media\/jui\//i, /\/components\/com_/i], high: 2, med: 1 },
  { platform: 'magento', label: 'Magento', patterns: [/\/static\/version/i, /Magento_/i, /mage\/cookies/i], high: 2, med: 1 },
  { platform: 'nextjs', label: 'Next.js', patterns: [/id="__next"/i, /\/_next\//i, /__NEXT_DATA__/i], high: 2, med: 1 },
  { platform: 'gatsby', label: 'Gatsby', patterns: [/id="___gatsby"/i, /gatsby-/i, /\/page-data\//i], high: 2, med: 1 },
  { platform: 'ghost', label: 'Ghost', patterns: [/<meta\s+name="generator"\s+content="Ghost/i, /ghost-/i, /\/ghost\/api\//i], high: 2, med: 1 },
  { platform: 'hubspot', label: 'HubSpot', patterns: [/hs-scripts\.com/i, /hubspot/i, /hbspt\./i], high: 2, med: 1 },
];

export function detectPlatform(html: string): PlatformResult {
  let best: { platform: Platform; label: string; count: number } | null = null;

  for (const sig of sigs) {
    const count = sig.patterns.filter(p => p.test(html)).length;
    if (count > 0 && (!best || count > best.count)) {
      best = { platform: sig.platform, label: sig.label, count };
    }
  }

  if (!best) return { platform: 'custom', confidence: 'low', label: 'Custom / Unknown' };

  const sig = sigs.find(s => s.platform === best!.platform)!;
  const confidence = best.count >= sig.high ? 'high' : best.count >= sig.med ? 'medium' : 'low';
  return { platform: best.platform, confidence, label: best.label };
}
