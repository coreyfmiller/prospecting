import express from 'express';
import { performScan } from './crawler';

const app = express();
app.use(express.json());

const API_SECRET = process.env.CRAWL_WORKER_SECRET || '';

// Auth middleware
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!API_SECRET || token !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/crawl', async (req, res) => {
  const { url, lightweight } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const start = Date.now();
  console.log(`[Crawl] Starting: ${url}`);

  try {
    const result = await performScan(url, { lightweight });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Crawl] Done: ${url} (${elapsed}s)`);
    res.json({ success: true, data: result });
  } catch (err: any) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[Crawl] Failed: ${url} (${elapsed}s):`, err.message);
    res.status(502).json({
      success: false,
      error: err.message,
      technicalMessage: err.technicalMessage,
      category: err.category,
      suggestion: err.suggestion,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Crawl worker running on port ${PORT}`));
