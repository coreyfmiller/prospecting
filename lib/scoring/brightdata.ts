/**
 * Shared utility for Bright Data Unlocker API
 */

const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY || '';
const BRIGHTDATA_ZONE = process.env.BRIGHTDATA_ZONE || '';

export async function fetchWithBrightData(url: string, timeout = 60000): Promise<string> {
  if (!BRIGHTDATA_API_KEY || !BRIGHTDATA_ZONE || BRIGHTDATA_API_KEY === 'your_brightdata_api_key_here') {
    throw new Error('Bright Data credentials not configured');
  }

  const res = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
    },
    body: JSON.stringify({
      zone: BRIGHTDATA_ZONE,
      url: url,
      format: 'raw',
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Bright Data request failed with status ${res.status}`);
  }

  return res.text();
}

export function isBrightDataConfigured(): boolean {
  return !!(BRIGHTDATA_API_KEY && BRIGHTDATA_ZONE && BRIGHTDATA_API_KEY !== 'your_brightdata_api_key_here');
}
