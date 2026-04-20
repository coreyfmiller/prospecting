export type SiteType =
  | 'e-commerce'
  | 'local-business'
  | 'blog'
  | 'saas'
  | 'portfolio'
  | 'restaurant'
  | 'contractor'
  | 'professional-services'
  | 'news-media'
  | 'educational'
  | 'general';

export interface ClassificationSignal {
  type: SiteType;
  score: number;
  evidence: string;
}

export interface SiteTypeResult {
  primaryType: SiteType;
  secondaryTypes: SiteType[];
  confidence: number;
  signals: ClassificationSignal[];
}

export interface ComponentResult {
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  feedback: string;
  issues?: string[];
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  components: ComponentResult[];
}

export interface GraderResult {
  seoScore: number;
  aeoScore: number;
  geoScore: number;
  breakdown: {
    seo: CategoryScore[];
    aeo: CategoryScore[];
    geo: CategoryScore[];
  };
  criticalIssues: string[];
}

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  thinnedText: string;
  schemas: any[];
  structuralData: {
    semanticTags: {
      article: number; main: number; nav: number; aside: number;
      headers: number; h1Count: number; h2Count: number; h3Count: number;
    };
    links: { internal: number; external: number; socialLinksCount: number };
    media: { totalImages: number; imagesWithAlt: number };
    wordCount: number;
    hasViewport: boolean;
  };
  technical: { responseTimeMs: number; isHttps: boolean };
  platformDetection?: { platform: string; label: string; confidence: string };
  botProtection?: { detected: boolean; type: string };
  siteType?: SiteType;
  semanticFlags?: Record<string, number>;
  schemaQuality?: { hasSchema: boolean; score: number; issues: string[] };
}
