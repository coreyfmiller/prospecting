import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

// ─── Brand Colors ───────────────────────────────────────────────────────────
const BRAND = {
  primary: "#03556e",
  accent: "#06adc3",
  accentLight: "#e8f9fb",
  dark: "#0f172a",
  text: "#1e293b",
  muted: "#64748b",
  light: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  amber: "#d97706",
  amberBg: "#fffbeb",
  red: "#dc2626",
  redBg: "#fef2f2",
}

function getScoreColor(score: number, max: number = 100) {
  const pct = (score / max) * 100
  if (pct >= 60) return BRAND.green
  if (pct >= 30) return BRAND.amber
  return BRAND.red
}

function getScoreBg(score: number, max: number = 100) {
  const pct = (score / max) * 100
  if (pct >= 60) return BRAND.greenBg
  if (pct >= 30) return BRAND.amberBg
  return BRAND.redBg
}

function getGradeLabel(score: number, max: number = 100): string {
  const pct = (score / max) * 100
  if (pct >= 80) return "Excellent"
  if (pct >= 60) return "Good"
  if (pct >= 40) return "Fair"
  if (pct >= 20) return "Poor"
  return "Critical"
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page
  page: { padding: 0, fontFamily: "Helvetica", backgroundColor: BRAND.white, color: BRAND.text },
  pageInner: { padding: 40, paddingTop: 30 },

  // Cover page
  coverPage: { padding: 0, fontFamily: "Helvetica", backgroundColor: BRAND.primary, color: BRAND.white },
  coverContent: { flex: 1, padding: 50, justifyContent: "space-between" },
  coverTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  coverBrand: {},
  coverBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, padding: "6 12" },
  coverBadgeText: { fontSize: 9, color: "rgba(255,255,255,0.8)" },
  coverCenter: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  coverScoreCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  coverScoreInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  coverScoreValue: { fontSize: 48, fontWeight: "bold", color: BRAND.white },
  coverScoreMax: { fontSize: 16, color: "rgba(255,255,255,0.6)" },
  coverScoreLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  coverVerdict: { fontSize: 22, fontWeight: "bold", color: BRAND.white, textAlign: "center", marginTop: 16, maxWidth: 400 },
  coverSubverdict: { fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 8, maxWidth: 380 },
  coverBottom: {},
  coverBusinessName: { fontSize: 20, fontWeight: "bold", color: BRAND.white, marginBottom: 6 },
  coverBusinessMeta: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 3 },
  coverDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 16 },
  coverDate: { fontSize: 9, color: "rgba(255,255,255,0.5)" },

  // Header bar (inner pages)
  headerBar: { backgroundColor: BRAND.primary, padding: "12 40", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 10, fontWeight: "bold", color: BRAND.white },
  headerRight: { fontSize: 8, color: "rgba(255,255,255,0.7)" },

  // Section
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.accent },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: BRAND.primary },

  // Score cards row
  scoreRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  scoreCard: { flex: 1, padding: 14, borderRadius: 8, alignItems: "center", border: `1px solid ${BRAND.border}` },
  scoreCardValue: { fontSize: 28, fontWeight: "bold" },
  scoreCardLabel: { fontSize: 8, color: BRAND.muted, marginTop: 4, textAlign: "center" },
  scoreCardGrade: { fontSize: 8, marginTop: 2 },

  // Data rows
  dataRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottom: `1px solid ${BRAND.border}` },
  dataLabel: { fontSize: 9, color: BRAND.muted },
  dataValue: { fontSize: 9, fontWeight: "bold", color: BRAND.text },

  // Checklist
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  checkIcon: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  checkLabel: { fontSize: 9, color: BRAND.text },

  // Issues / Strengths / Weaknesses
  issueBox: { backgroundColor: BRAND.redBg, borderRadius: 6, padding: 12, marginBottom: 8 },
  issueTitle: { fontSize: 9, fontWeight: "bold", color: BRAND.red, marginBottom: 6 },
  issueItem: { fontSize: 9, color: BRAND.text, marginBottom: 3, paddingLeft: 8 },
  strengthBox: { backgroundColor: BRAND.greenBg, borderRadius: 6, padding: 12, marginBottom: 8 },
  strengthTitle: { fontSize: 9, fontWeight: "bold", color: BRAND.green, marginBottom: 6 },
  weaknessBox: { backgroundColor: BRAND.amberBg, borderRadius: 6, padding: 12, marginBottom: 8 },
  weaknessTitle: { fontSize: 9, fontWeight: "bold", color: BRAND.amber, marginBottom: 6 },

  // Assessment detail
  assessRow: { marginBottom: 8 },
  assessLabel: { fontSize: 9, fontWeight: "bold", color: BRAND.primary, marginBottom: 2 },
  assessValue: { fontSize: 9, color: BRAND.muted, lineHeight: 1.5 },

  // Recommendation card
  recCard: { padding: 12, borderRadius: 6, backgroundColor: BRAND.light, borderLeft: `3px solid ${BRAND.accent}`, marginBottom: 8 },
  recNumber: { fontSize: 8, fontWeight: "bold", color: BRAND.accent, marginBottom: 2 },
  recTitle: { fontSize: 10, fontWeight: "bold", color: BRAND.text, marginBottom: 3 },
  recDesc: { fontSize: 9, color: BRAND.muted, lineHeight: 1.5 },

  // Service pitch
  serviceCard: { padding: 12, borderRadius: 6, backgroundColor: BRAND.accentLight, borderLeft: `3px solid ${BRAND.primary}`, marginBottom: 8 },
  serviceTitle: { fontSize: 10, fontWeight: "bold", color: BRAND.primary, marginBottom: 3 },
  serviceDesc: { fontSize: 9, color: BRAND.muted, lineHeight: 1.5 },

  // Quote / recommendation callout
  quoteBox: { backgroundColor: BRAND.accentLight, borderRadius: 8, padding: 16, marginTop: 12, borderLeft: `4px solid ${BRAND.accent}` },
  quoteText: { fontSize: 10, color: BRAND.primary, fontStyle: "italic", lineHeight: 1.6 },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${BRAND.border}`, paddingTop: 8 },
  footerText: { fontSize: 7, color: BRAND.muted },

  // Two column layout
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },

  // Metric grid
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricItem: { width: "48%", flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: `1px solid ${BRAND.border}` },
  metricLabel: { fontSize: 8, color: BRAND.muted },
  metricValue: { fontSize: 8, fontWeight: "bold", color: BRAND.text },

  // CTA section
  ctaBox: { backgroundColor: BRAND.primary, borderRadius: 8, padding: 20, alignItems: "center", marginTop: 16 },
  ctaTitle: { fontSize: 14, fontWeight: "bold", color: BRAND.white, marginBottom: 6 },
  ctaSubtitle: { fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center" },
})

// ─── Helper Components ──────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionDot} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

function ScoreCard({ value, max, label }: { value: number; max: number; label: string }) {
  const color = getScoreColor(value, max)
  const bg = getScoreBg(value, max)
  const grade = getGradeLabel(value, max)
  return (
    <View style={[s.scoreCard, { backgroundColor: bg }]}>
      <Text style={[s.scoreCardValue, { color }]}>{value}<Text style={{ fontSize: 14, color: BRAND.muted }}>/{max}</Text></Text>
      <Text style={s.scoreCardLabel}>{label}</Text>
      <Text style={[s.scoreCardGrade, { color }]}>{grade}</Text>
    </View>
  )
}

function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={[s.dataValue, color ? { color } : {}]}>{value}</Text>
    </View>
  )
}

function CheckItem({ passed, label }: { passed: boolean; label: string }) {
  return (
    <View style={s.checkRow}>
      <View style={[s.checkIcon, { backgroundColor: passed ? BRAND.greenBg : BRAND.redBg }]}>
        <Text style={{ fontSize: 8, color: passed ? BRAND.green : BRAND.red }}>{passed ? "✓" : "✗"}</Text>
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </View>
  )
}

function PageFooter({ companyName, pageNum }: { companyName: string; pageNum: number }) {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  return (
    <View style={s.footer}>
      <Text style={s.footerText}>Generated by {companyName || "MarketMojo.ai"}</Text>
      <Text style={s.footerText}>{now}</Text>
      <Text style={s.footerText}>Page {pageNum}</Text>
    </View>
  )
}

function InnerPageHeader({ businessName, companyName }: { businessName: string; companyName: string }) {
  return (
    <View style={s.headerBar}>
      <Text style={s.headerTitle}>{companyName || "MarketMojo.ai"}</Text>
      <Text style={s.headerRight}>Digital Audit — {businessName}</Text>
    </View>
  )
}

// ─── Main Report Component ──────────────────────────────────────────────────

export function AuditReport({ data }: { data: any }) {
  const { business, companyName, logoUrl, recommendations, servicePitches } = data
  const analysis = business.analysis
  const gbpAudit = business.gbpAudit
  const duellyScan = business.duellyScan
  const aiAssessment = analysis?.aiAssessment
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  // Calculate overall score (weighted average of available scores)
  let overallScore = 0
  let scoreCount = 0
  if (aiAssessment?.score) { overallScore += aiAssessment.score * 10; scoreCount++ }
  if (duellyScan?.seoScore) { overallScore += duellyScan.seoScore; scoreCount++ }
  if (duellyScan?.geoScore) { overallScore += duellyScan.geoScore; scoreCount++ }
  if (gbpAudit?.completenessScore) { overallScore += gbpAudit.completenessScore; scoreCount++ }
  const avgScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : 0

  // Determine verdict
  const verdict = avgScore >= 70
    ? "Strong online presence with room for optimization"
    : avgScore >= 40
    ? "Significant opportunities to improve online visibility"
    : "Critical gaps in online presence — immediate action recommended"

  const brandName = companyName || "MarketMojo.ai"

  return (
    <Document>
      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 1: COVER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverContent}>
          {/* Top: Brand + Badge */}
          <View style={s.coverTop}>
            <View style={s.coverBrand}>
              {logoUrl ? (
                <Image src={logoUrl} style={{ height: 36, maxWidth: 160 }} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "bold", color: BRAND.white }}>{brandName}</Text>
              )}
            </View>
            <View style={s.coverBadge}>
              <Text style={s.coverBadgeText}>Digital Audit Report</Text>
            </View>
          </View>

          {/* Center: Score */}
          <View style={s.coverCenter}>
            <View style={s.coverScoreCircle}>
              <View style={s.coverScoreInner}>
                <Text style={s.coverScoreValue}>{avgScore}</Text>
                <Text style={s.coverScoreMax}>/100</Text>
              </View>
            </View>
            <Text style={s.coverScoreLabel}>Overall Digital Health Score</Text>
            <Text style={s.coverVerdict}>{verdict}</Text>
            {aiAssessment?.recommendation && (
              <Text style={s.coverSubverdict}>{aiAssessment.recommendation}</Text>
            )}
          </View>

          {/* Bottom: Business Info */}
          <View style={s.coverBottom}>
            <Text style={s.coverBusinessName}>{business.name}</Text>
            {business.category && <Text style={s.coverBusinessMeta}>{business.category}</Text>}
            <Text style={s.coverBusinessMeta}>{business.address}</Text>
            {business.phone && <Text style={s.coverBusinessMeta}>{business.phone}</Text>}
            {business.website && <Text style={s.coverBusinessMeta}>{business.website}</Text>}
            <View style={s.coverDivider} />
            <Text style={s.coverDate}>Report generated {now}</Text>
          </View>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 2: SCORES & ANALYSIS
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <InnerPageHeader businessName={business.name} companyName={brandName} />
        <View style={s.pageInner}>

          {/* Score Cards */}
          {(aiAssessment || duellyScan || gbpAudit) && (
            <View style={s.section}>
              <SectionHeader title="Performance Scores" />
              <View style={s.scoreRow}>
                {aiAssessment && <ScoreCard value={aiAssessment.score * 10} max={100} label="Website Quality" />}
                {duellyScan && <ScoreCard value={duellyScan.seoScore} max={100} label="SEO Score" />}
                {duellyScan && <ScoreCard value={duellyScan.geoScore} max={100} label="AI Visibility (GEO)" />}
                {duellyScan && <ScoreCard value={duellyScan.domainAuthority} max={100} label="Domain Authority" />}
                {gbpAudit && <ScoreCard value={gbpAudit.completenessScore} max={100} label="Google Business" />}
              </View>
            </View>
          )}

          {/* AI Assessment Details */}
          {aiAssessment && (
            <View style={s.section}>
              <SectionHeader title="Website Assessment" />
              <View style={s.twoCol}>
                <View style={s.col}>
                  {aiAssessment.designQuality && (
                    <View style={s.assessRow}>
                      <Text style={s.assessLabel}>Design Quality</Text>
                      <Text style={s.assessValue}>{aiAssessment.designQuality}</Text>
                    </View>
                  )}
                  {aiAssessment.contentQuality && (
                    <View style={s.assessRow}>
                      <Text style={s.assessLabel}>Content Quality</Text>
                      <Text style={s.assessValue}>{aiAssessment.contentQuality}</Text>
                    </View>
                  )}
                </View>
                <View style={s.col}>
                  {aiAssessment.seoReadiness && (
                    <View style={s.assessRow}>
                      <Text style={s.assessLabel}>SEO Readiness</Text>
                      <Text style={s.assessValue}>{aiAssessment.seoReadiness}</Text>
                    </View>
                  )}
                  {aiAssessment.conversionPotential && (
                    <View style={s.assessRow}>
                      <Text style={s.assessLabel}>Conversion Potential</Text>
                      <Text style={s.assessValue}>{aiAssessment.conversionPotential}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Strengths & Weaknesses side by side */}
              <View style={[s.twoCol, { marginTop: 10 }]}>
                {aiAssessment.topStrengths?.length > 0 && (
                  <View style={[s.col, s.strengthBox]}>
                    <Text style={s.strengthTitle}>Strengths</Text>
                    {aiAssessment.topStrengths.map((str: string, i: number) => (
                      <Text key={i} style={s.issueItem}>✓ {str}</Text>
                    ))}
                  </View>
                )}
                {aiAssessment.topWeaknesses?.length > 0 && (
                  <View style={[s.col, s.weaknessBox]}>
                    <Text style={s.weaknessTitle}>Areas for Improvement</Text>
                    {aiAssessment.topWeaknesses.map((w: string, i: number) => (
                      <Text key={i} style={s.issueItem}>• {w}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Technical Details */}
          {analysis && (
            <View style={s.section}>
              <SectionHeader title="Technical Overview" />
              <View style={s.twoCol}>
                <View style={s.col}>
                  {analysis.platform && <DataRow label="Platform" value={analysis.platform} />}
                  {analysis.estimatedAge && <DataRow label="Estimated Age" value={analysis.estimatedAge} />}
                  <DataRow label="SSL Certificate" value={analysis.hasSSL ? "Secure (HTTPS)" : "Not Secure"} color={analysis.hasSSL ? BRAND.green : BRAND.red} />
                  {analysis.responseTimeMs != null && (
                    <DataRow
                      label="Load Time"
                      value={`${(analysis.responseTimeMs / 1000).toFixed(1)}s`}
                      color={analysis.responseTimeMs < 2000 ? BRAND.green : analysis.responseTimeMs < 4000 ? BRAND.amber : BRAND.red}
                    />
                  )}
                </View>
                <View style={s.col}>
                  {analysis.wordCount != null && <DataRow label="Word Count" value={String(analysis.wordCount)} />}
                  {analysis.totalImages != null && <DataRow label="Images" value={`${analysis.imagesWithAlt || 0}/${analysis.totalImages} with alt text`} />}
                  {analysis.internalLinks != null && <DataRow label="Internal Links" value={String(analysis.internalLinks)} />}
                  {analysis.h1Count != null && (
                    <DataRow label="H1 Tags" value={String(analysis.h1Count)} color={analysis.h1Count === 1 ? BRAND.green : analysis.h1Count === 0 ? BRAND.red : BRAND.amber} />
                  )}
                </View>
              </View>

              {/* SEO Checks */}
              {(analysis.hasCanonical != null || analysis.hasOgTags != null || analysis.hasTwitterCard != null) && (
                <View style={[s.twoCol, { marginTop: 10 }]}>
                  <View style={s.col}>
                    {analysis.hasCanonical != null && <CheckItem passed={analysis.hasCanonical} label="Canonical URL" />}
                    {analysis.hasOgTags != null && <CheckItem passed={analysis.hasOgTags} label="Open Graph Tags" />}
                  </View>
                  <View style={s.col}>
                    {analysis.hasTwitterCard != null && <CheckItem passed={analysis.hasTwitterCard} label="Twitter Card" />}
                    {analysis.socialLinksCount != null && <CheckItem passed={analysis.socialLinksCount > 0} label={`Social Links (${analysis.socialLinksCount})`} />}
                  </View>
                </View>
              )}

              {/* Critical Issues from Duelly Scan */}
              {duellyScan?.criticalIssues?.length > 0 && (
                <View style={[s.issueBox, { marginTop: 12 }]}>
                  <Text style={s.issueTitle}>Critical Issues Detected</Text>
                  {duellyScan.criticalIssues.map((issue: string, i: number) => (
                    <Text key={i} style={s.issueItem}>• {issue}</Text>
                  ))}
                </View>
              )}

              {/* Flags from analysis */}
              {analysis.flags?.length > 0 && !duellyScan?.criticalIssues?.length && (
                <View style={[s.issueBox, { marginTop: 12 }]}>
                  <Text style={s.issueTitle}>Issues Found</Text>
                  {analysis.flags.map((flag: string, i: number) => (
                    <Text key={i} style={s.issueItem}>• {flag}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Google Business Profile */}
          {gbpAudit && (
            <View style={s.section}>
              <SectionHeader title="Google Business Profile" />
              <View style={s.twoCol}>
                <View style={s.col}>
                  <CheckItem passed={gbpAudit.hasHours} label="Business Hours Listed" />
                  <CheckItem passed={gbpAudit.hasPhone} label="Phone Number" />
                  <CheckItem passed={gbpAudit.hasWebsite} label="Website Link" />
                </View>
                <View style={s.col}>
                  <CheckItem passed={gbpAudit.hasDescription} label="Business Description" />
                  <CheckItem passed={gbpAudit.photoCount >= 5} label={`Photos (${gbpAudit.photoCount})`} />
                  <CheckItem passed={gbpAudit.reviewCount >= 5} label={`Reviews (${gbpAudit.reviewCount})`} />
                </View>
              </View>
              {gbpAudit.issues?.length > 0 && (
                <View style={[s.weaknessBox, { marginTop: 10 }]}>
                  <Text style={s.weaknessTitle}>GBP Recommendations</Text>
                  {gbpAudit.issues.map((issue: string, i: number) => (
                    <Text key={i} style={s.issueItem}>• {issue}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Business info (if no analysis data, show basic info) */}
          {!analysis && !gbpAudit && !duellyScan && (
            <View style={s.section}>
              <SectionHeader title="Business Overview" />
              <DataRow label="Business Name" value={business.name} />
              <DataRow label="Address" value={business.address} />
              {business.phone && <DataRow label="Phone" value={business.phone} />}
              <DataRow label="Online Presence" value={
                business.webPresence === "website" ? "Has Website" :
                business.webPresence === "facebook-only" ? "Facebook Only" :
                business.webPresence === "social-only" ? "Social Media Only" : "No Online Presence"
              } />
              {business.rating && <DataRow label="Google Rating" value={`${business.rating}/5 (${business.reviewCount || 0} reviews)`} />}
            </View>
          )}

        </View>
        <PageFooter companyName={brandName} pageNum={2} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 3: RECOMMENDATIONS & NEXT STEPS (only if data exists)
      ═══════════════════════════════════════════════════════════════════════ */}
      {((recommendations && recommendations.length > 0) || (servicePitches && servicePitches.length > 0)) && (
        <Page size="A4" style={s.page}>
          <InnerPageHeader businessName={business.name} companyName={brandName} />
          <View style={s.pageInner}>

            {/* Service Pitches */}
            {servicePitches && servicePitches.length > 0 && (
              <View style={s.section}>
                <SectionHeader title="How We Can Help" />
                {servicePitches.map((sp: any, i: number) => (
                  <View key={i} style={s.serviceCard}>
                    <Text style={s.serviceTitle}>{sp.service}</Text>
                    <Text style={s.serviceDesc}>{sp.pitch}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <View style={s.section}>
                <SectionHeader title="Recommended Next Steps" />
                {recommendations.map((rec: any, i: number) => (
                  <View key={i} style={s.recCard}>
                    <Text style={s.recNumber}>STEP {i + 1}</Text>
                    <Text style={s.recTitle}>{rec.title}</Text>
                    <Text style={s.recDesc}>{rec.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA */}
            <View style={s.ctaBox}>
              <Text style={s.ctaTitle}>Ready to Improve Your Online Presence?</Text>
              <Text style={s.ctaSubtitle}>
                Contact {brandName} to discuss how we can help {business.name} attract more customers online.
              </Text>
            </View>

          </View>
          <PageFooter companyName={brandName} pageNum={3} />
        </Page>
      )}
    </Document>
  )
}
