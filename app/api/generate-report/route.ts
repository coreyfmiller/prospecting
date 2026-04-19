import { NextRequest, NextResponse } from "next/server"
import ReactPDF from "@react-pdf/renderer"
import { AuditReport } from "@/lib/pdf/audit-report"
import React from "react"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.business) {
      return NextResponse.json({ error: "Business data required" }, { status: 400 })
    }

    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(AuditReport, { data })
    )

    const chunks: Buffer[] = []
    // @ts-ignore - stream is readable
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-${data.business.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
