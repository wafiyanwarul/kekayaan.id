import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * DEV-ONLY debug endpoint to inspect raw PDF text extraction.
 * Returns the first 3000 chars of extracted text so we can tune the parser.
 * This endpoint is only active in development (NODE_ENV !== 'production').
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const { getDocumentProxy, extractText } = await import("unpdf")
    const pdf = await getDocumentProxy(uint8Array)

    // Extract per-page to see structure
    const pages: string[] = []
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      // Dump raw items with their positions
      const items = content.items.map((item: Record<string, unknown>) => {
        if ("str" in item) {
          const t = item.transform as number[] | undefined
          return {
            text: item.str,
            x: t ? Math.round(t[4]) : 0,
            y: t ? Math.round(t[5]) : 0,
          }
        }
        return null
      }).filter(Boolean)

      pages.push(JSON.stringify(items.slice(0, 80), null, 2))
    }

    // Also extract merged text
    const { text } = await extractText(pdf, { mergePages: true })

    return NextResponse.json({
      num_pages: pdf.numPages,
      merged_text_preview: text.slice(0, 3000),
      merged_text_lines: text.split("\n").slice(0, 80),
      page_1_raw_items: pages[0] ? JSON.parse(pages[0]) : [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
