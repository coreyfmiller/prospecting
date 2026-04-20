export type Platform = 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'webflow' | 'drupal' | 'joomla' | 'magento' | 'nextjs' | 'gatsby' | 'ghost' | 'hubspot' | 'custom';

export interface PlatformResult {
  platform: Platform;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  label: string;
}

interface PlatformSignature {
  platform: Platform;
  label: string;
  htmlPatterns: RegExp[];
  highThreshold: number;
  mediumThreshold: number;
}

const signatures: PlatformSignature[] = [
  { platform: 'wordpress', label: 'WordPress', htmlPatterns: [/wp-content\//i, /wp-includes\//i, /<meta\s+name="generator"\s+content="WordPress/i, /\/wp-json\//i, /wp-emoji/i, /class=".*?wp-/i], highThreshold: 3, mediumThreshold: 1 },
  { platform: 'shopify', label: 'Shopify', htmlPatterns: [/cdn\.shopify\.com/i, /Shopify\.theme/i, /shopify-section/i, /myshopify\.com/i, /<meta\s+name="generator"\s+content="Shopify/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'wix', label: 'Wix', htmlPatterns: [/static\.wixstatic\.com/i, /wix-code-sdk/i, /_wix_browser_sess/i, /X-Wix-/i, /wixsite\.com/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'squarespace', label: 'Squarespace', htmlPatterns: [/static1\.squarespace\.com/i, /<!-- This is Squarespace/i, /squarespace-cdn/i, /sqsp-/i, /<meta\s+name="generator"\s+content="Squarespace/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'webflow', label: 'Webflow', htmlPatterns: [/assets\.website-files\.com/i, /data-wf-/i, /webflow\.com/i, /w-nav/i, /wf-section/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'drupal', label: 'Drupal', htmlPatterns: [/Drupal\.settings/i, /\/sites\/default\/files\//i, /<meta\s+name="generator"\s+content="Drupal/i, /drupal\.js/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'joomla', label: 'Joomla', htmlPatterns: [/<meta\s+name="generator"\s+content="Joomla/i, /\/media\/jui\//i, /\/components\/com_/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'magento', label: 'Magento', htmlPatterns: [/\/static\/version/i, /Magento_/i, /mage\/cookies/i, /\/pub\/static\//i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'nextjs', label: 'Next.js', htmlPatterns: [/id="__next"/i, /\/_next\//i, /__NEXT_DATA__/i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'gatsby', label: 'Gatsby', htmlPatterns: [/id="___gatsby"/i, /gatsby-/i, /\/page-data\//i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'ghost', label: 'Ghost', htmlPatterns: [/<meta\s+name="generator"\s+content="Ghost/i, /ghost-/i, /\/ghost\/api\//i], highThreshold: 2, mediumThreshold: 1 },
  { platform: 'hubspot', label: 'HubSpot', htmlPatterns: [/hs-scripts\.com/i, /hubspot/i, /hbspt\./i, /hs-banner/i], highThreshold: 2, mediumThreshold: 1 },
];

export function detectPlatform(html: string): PlatformResult {
  let bestMatch: { platform: Platform; label: string; matchCount: number; signals: string[] } | null = null;

  for (const sig of signatures) {
    const matched: string[] = [];
    for (const pattern of sig.htmlPatterns) {
      if (pattern.test(html)) matched.push(pattern.source);
    }
    if (matched.length > 0 && (!bestMatch || matched.length > bestMatch.matchCount)) {
      bestMatch = { platform: sig.platform, label: sig.label, matchCount: matched.length, signals: matched };
    }
  }

  if (!bestMatch) return { platform: 'custom', confidence: 'low', signals: [], label: 'Custom / Unknown' };

  const sig = signatures.find(s => s.platform === bestMatch!.platform)!;
  const confidence: 'high' | 'medium' | 'low' =
    bestMatch.matchCount >= sig.highThreshold ? 'high' :
    bestMatch.matchCount >= sig.mediumThreshold ? 'medium' : 'low';

  return { platform: bestMatch.platform, confidence, signals: bestMatch.signals, label: bestMatch.label };
}
