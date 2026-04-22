/** Site-type penalty weights */
import type { SiteType } from './types';

export interface SiteTypePenaltyWeights {
  thinContent: number;
  missingH1: number;
  missingMetaDescription: number;
  poorImageAltCoverage: number;
  weakInternalLinking: number;
  noExternalLinks: number;
  missingSemanticTags: number;
  poorQuestionAnswering: number;
}

const W: Record<SiteType, SiteTypePenaltyWeights> = {
  'local-business':        { thinContent: 0.7, missingH1: 1.0, missingMetaDescription: 1.2, poorImageAltCoverage: 1.5, weakInternalLinking: 0.8, noExternalLinks: 0.3, missingSemanticTags: 0.7, poorQuestionAnswering: 1.3 },
  'e-commerce':            { thinContent: 1.2, missingH1: 1.3, missingMetaDescription: 1.5, poorImageAltCoverage: 1.8, weakInternalLinking: 1.3, noExternalLinks: 0.2, missingSemanticTags: 0.8, poorQuestionAnswering: 1.0 },
  'blog':                  { thinContent: 1.8, missingH1: 1.5, missingMetaDescription: 1.5, poorImageAltCoverage: 1.2, weakInternalLinking: 1.5, noExternalLinks: 1.3, missingSemanticTags: 1.2, poorQuestionAnswering: 1.7 },
  'saas':                  { thinContent: 1.0, missingH1: 1.2, missingMetaDescription: 1.3, poorImageAltCoverage: 1.0, weakInternalLinking: 1.2, noExternalLinks: 0.5, missingSemanticTags: 0.8, poorQuestionAnswering: 1.8 },
  'restaurant':            { thinContent: 0.5, missingH1: 1.0, missingMetaDescription: 1.2, poorImageAltCoverage: 1.7, weakInternalLinking: 0.7, noExternalLinks: 0.2, missingSemanticTags: 0.6, poorQuestionAnswering: 0.8 },
  'contractor':            { thinContent: 0.8, missingH1: 1.0, missingMetaDescription: 1.2, poorImageAltCoverage: 1.5, weakInternalLinking: 0.8, noExternalLinks: 0.3, missingSemanticTags: 0.7, poorQuestionAnswering: 1.5 },
  'professional-services': { thinContent: 1.2, missingH1: 1.2, missingMetaDescription: 1.3, poorImageAltCoverage: 1.0, weakInternalLinking: 1.0, noExternalLinks: 0.8, missingSemanticTags: 0.9, poorQuestionAnswering: 1.5 },
  'portfolio':             { thinContent: 0.5, missingH1: 1.0, missingMetaDescription: 1.0, poorImageAltCoverage: 2.0, weakInternalLinking: 1.0, noExternalLinks: 0.5, missingSemanticTags: 0.8, poorQuestionAnswering: 0.5 },
  'news-media':            { thinContent: 1.5, missingH1: 1.5, missingMetaDescription: 1.5, poorImageAltCoverage: 1.5, weakInternalLinking: 1.3, noExternalLinks: 1.5, missingSemanticTags: 1.2, poorQuestionAnswering: 1.3 },
  'educational':           { thinContent: 1.5, missingH1: 1.3, missingMetaDescription: 1.3, poorImageAltCoverage: 1.2, weakInternalLinking: 1.3, noExternalLinks: 1.2, missingSemanticTags: 1.0, poorQuestionAnswering: 1.8 },
  'general':               { thinContent: 1.0, missingH1: 1.0, missingMetaDescription: 1.0, poorImageAltCoverage: 1.0, weakInternalLinking: 1.0, noExternalLinks: 1.0, missingSemanticTags: 1.0, poorQuestionAnswering: 1.0 },
};

export function getPenaltyWeight(siteType: SiteType, key: keyof SiteTypePenaltyWeights): number {
  return W[siteType]?.[key] ?? 1.0;
}
