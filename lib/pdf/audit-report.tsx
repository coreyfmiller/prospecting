import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#ffffff", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, borderBottom: "2px solid #0d9488", paddingBottom: 15 },
  logo: { height: 40, maxWidth: 180 },
  headerRight: { textAlign: "right" },
  title: { fontSize: 22, fontWeight: "bold", color: "#0d9488", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666666" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8, borderBottom: "1px solid #e5e5e5", paddingBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "1px solid #f0f0f0" },
  label: { fontSize: 10, color: "#666666" },
  value: { fontSize: 10, fontWeight: "bold", color: "#1a1a1a" },
  scoreBox: { flexDirection: "row", gap: 15, marginBottom: 15 },
  score: { flex: 1, padding: 12, borderRadius: 6, textAlign: "center" },
  scoreValue: { fontSize: 24, fontWeight: "bold" },
  scoreLabel: { fontSize: 8, color: "#666666", marginTop: 2 },
  issueItem: { fontSize: 9, color: "#666666", marginBottom: 3, paddingLeft: 10 },
  recommendation: { fontSize: 10, color: "#0d9488", fontStyle: "italic", marginTop: 8, padding: 10, backgroundColor: "#f0fdfa", borderRadius: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999999", borderTop: "1px solid #e5e5e5", paddingTop: 8 },
  badge: { fontSize: 9, padding: "3 8", borderRadius: 10, color: "#ffffff" },
})

function getScoreColor(score: number) {
  if (score >= 70) return "#16a34a"
  if (score >= 40) return "#d97706"
  return "#dc2626"
}

function getScoreBg(score: number) {
  if (score >= 70) return "#f0fdf4"
  if (score >= 40) return "#fffbeb"
  return "#fef2f2"
}

export function AuditReport({ data }: { data: any }) {
  const { business, companyName, logoUrl } = data
  const analysis = business.analysis
  const gbpAudit = business.gbpAudit
  const duellyScan = business.duellyScan
  const aiAssessment = analysis?.aiAssessment
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0d9488" }}>
                {companyName || "MarketMojo.ai"}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>Digital Audit Report</Text>
            <Text style={styles.subtitle}>{now}</Text>
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Business Name</Text>
            <Text style={styles.value}>{business.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{business.address}</Text>
          </View>
          {business.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{business.phone}</Text>
            </View>
          )}
          {business.website && (
            <View style={styles.row}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.value}>{business.website}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Online Presence</Text>
            <Text style={styles.value}>
              {business.webPresence === "website" ? "Has Website" :
               business.webPresence === "facebook-only" ? "Facebook Only" :
               business.webPresence === "social-only" ? "Social Media Only" : "No Online Presence"}
            </Text>
          </View>
          {business.rating && (
            <View style={styles.row}>
              <Text style={styles.label}>Google Rating</Text>
              <Text style={styles.value}>{business.rating}/5 ({business.reviewCount || 0} reviews)</Text>
            </View>
          )}
        </View>

        {/* Scores */}
        {(aiAssessment || gbpAudit || duellyScan) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scores</Text>
            <View style={styles.scoreBox}>
              {aiAssessment && (
                <View style={[styles.score, { backgroundColor: getScoreBg(aiAssessment.score * 10) }]}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(aiAssessment.score * 10) }]}>
                    {aiAssessment.score}/10
                  </Text>
                  <Text style={styles.scoreLabel}>Website Health</Text>
                </View>
              )}
              {gbpAudit && (
                <View style={[styles.score, { backgroundColor: getScoreBg(gbpAudit.completenessScore) }]}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(gbpAudit.completenessScore) }]}>
                    {gbpAudit.completenessScore}/100
                  </Text>
                  <Text style={styles.scoreLabel}>Google Business</Text>
                </View>
              )}
              {duellyScan && (
                <>
                  <View style={[styles.score, { backgroundColor: getScoreBg(duellyScan.seoScore) }]}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(duellyScan.seoScore) }]}>
                      {duellyScan.seoScore}
                    </Text>
                    <Text style={styles.scoreLabel}>SEO Score</Text>
                  </View>
                  <View style={[styles.score, { backgroundColor: getScoreBg(duellyScan.geoScore) }]}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(duellyScan.geoScore) }]}>
                      {duellyScan.geoScore}
                    </Text>
                    <Text style={styles.scoreLabel}>GEO Score</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Website Analysis */}
        {analysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Website Analysis</Text>
            {analysis.platform && (
              <View style={styles.row}>
                <Text style={styles.label}>Platform</Text>
                <Text style={styles.value}>{analysis.platform}</Text>
              </View>
            )}
            {analysis.estimatedAge && (
              <View style={styles.row}>
                <Text style={styles.label}>Estimated Age</Text>
                <Text style={styles.value}>{analysis.estimatedAge}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>SSL Certificate</Text>
              <Text style={[styles.value, { color: analysis.hasSSL ? "#16a34a" : "#dc2626" }]}>
                {analysis.hasSSL ? "Secure" : "Not Secure"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mobile Friendly</Text>
              <Text style={[styles.value, { color: analysis.isMobileFriendly ? "#16a34a" : "#dc2626" }]}>
                {analysis.isMobileFriendly ? "Yes" : "No"}
              </Text>
            </View>
            {analysis.flags?.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>Issues Found:</Text>
                {analysis.flags.map((flag: string, i: number) => (
                  <Text key={i} style={styles.issueItem}>• {flag}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* AI Assessment */}
        {aiAssessment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Assessment</Text>
            {aiAssessment.reasons?.map((reason: string, i: number) => (
              <Text key={i} style={styles.issueItem}>• {reason}</Text>
            ))}
            {aiAssessment.recommendation && (
              <Text style={styles.recommendation}>
                Recommendation: {aiAssessment.recommendation}
              </Text>
            )}
          </View>
        )}

        {/* Google Business Profile */}
        {gbpAudit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Google Business Profile</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Business Hours</Text>
              <Text style={[styles.value, { color: gbpAudit.hasHours ? "#16a34a" : "#dc2626" }]}>
                {gbpAudit.hasHours ? "Listed" : "Missing"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={[styles.value, { color: gbpAudit.hasPhone ? "#16a34a" : "#dc2626" }]}>
                {gbpAudit.hasPhone ? "Listed" : "Missing"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Website Link</Text>
              <Text style={[styles.value, { color: gbpAudit.hasWebsite ? "#16a34a" : "#dc2626" }]}>
                {gbpAudit.hasWebsite ? "Listed" : "Missing"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Business Description</Text>
              <Text style={[styles.value, { color: gbpAudit.hasDescription ? "#16a34a" : "#dc2626" }]}>
                {gbpAudit.hasDescription ? "Present" : "Missing"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Photos</Text>
              <Text style={styles.value}>{gbpAudit.photoCount} photos</Text>
            </View>
            {gbpAudit.recommendations?.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>Recommendations:</Text>
                {gbpAudit.recommendations.map((rec: string, i: number) => (
                  <Text key={i} style={styles.issueItem}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Report generated by {companyName || "MarketMojo.ai"} • {now}
        </Text>
      </Page>
    </Document>
  )
}
