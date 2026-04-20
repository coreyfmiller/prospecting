export interface CrawlerError {
  userMessage: string;
  technicalMessage: string;
  suggestion: string;
  category: 'bot-protection' | 'network' | 'ssl' | 'server' | 'auth' | 'timeout' | 'unknown';
}

export function getCrawlerErrorMessage(error: any): CrawlerError {
  const msg = error?.message || String(error);

  if (msg.includes('ERR_HTTP2_PROTOCOL_ERROR')) return { userMessage: 'This site has advanced bot protection that blocks automated analysis.', technicalMessage: 'HTTP/2 protocol error', suggestion: 'Try a smaller site without enterprise-level protection.', category: 'bot-protection' };
  if (msg.includes('ERR_NAME_NOT_RESOLVED') || msg.includes('ENOTFOUND')) return { userMessage: 'Unable to reach this website. The domain may not exist.', technicalMessage: 'DNS resolution failed', suggestion: 'Check the URL is correct.', category: 'network' };
  if (msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('ECONNREFUSED')) return { userMessage: 'The website refused the connection.', technicalMessage: 'Connection refused', suggestion: 'Verify the site is online.', category: 'network' };
  if (msg.includes('ERR_SSL') || msg.includes('CERT_')) return { userMessage: 'This site has SSL certificate problems.', technicalMessage: 'SSL validation failed', suggestion: 'Check the SSL certificate.', category: 'ssl' };
  if (msg.includes('ERR_TOO_MANY_REDIRECTS')) return { userMessage: 'This site has a redirect loop.', technicalMessage: 'Too many redirects', suggestion: 'Check redirect configuration.', category: 'server' };
  if (msg.includes('Timeout') || msg.includes('timeout') || msg.includes('ERR_TIMED_OUT')) return { userMessage: 'This site took too long to respond.', technicalMessage: 'Request timeout', suggestion: 'Try again later.', category: 'timeout' };
  if (msg.includes('403')) return { userMessage: 'This site blocks automated tools.', technicalMessage: 'HTTP 403', suggestion: 'Try a different site.', category: 'bot-protection' };
  if (msg.includes('404')) return { userMessage: "This page doesn't exist.", technicalMessage: 'HTTP 404', suggestion: 'Check the URL.', category: 'server' };
  if (msg.includes('500')) return { userMessage: 'This site is experiencing server problems.', technicalMessage: 'HTTP 500', suggestion: 'Try again later.', category: 'server' };
  if (msg.includes('502')) return { userMessage: 'Server gateway issues.', technicalMessage: 'HTTP 502', suggestion: 'Try again later.', category: 'server' };
  if (msg.includes('503')) return { userMessage: 'Site temporarily unavailable.', technicalMessage: 'HTTP 503', suggestion: 'Try again later.', category: 'server' };
  if (msg.includes('Cloudflare')) return { userMessage: 'Cloudflare is blocking our crawler.', technicalMessage: 'Cloudflare protection', suggestion: 'Try a smaller site.', category: 'bot-protection' };

  return { userMessage: 'Unable to analyze this website.', technicalMessage: msg, suggestion: 'Try a different URL.', category: 'unknown' };
}
