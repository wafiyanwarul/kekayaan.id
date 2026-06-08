import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseBCAStatement } from "@/features/finance/parsers/bca-parser"
import type { ParsedTransaction, SupportedBank } from "@/features/finance/types"

// Force Node.js runtime for buffer/file processing (required for unpdf)
export const runtime = "nodejs"

// --- Constants ---
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB
const DAILY_LIMIT = 3                          // Max extractions per user per day
const ALLOWED_MIME_TYPES = ["application/pdf"]
const SUPPORTED_BANKS: SupportedBank[] = ["bca"]

// --- Groq category suggestion ---
const CATEGORY_KEYWORDS: Record<string, string> = {
  grab: "Transportasi",
  gojek: "Transportasi",
  "go-jek": "Transportasi",
  maxim: "Transportasi",
  indomaret: "Belanja",
  alfamart: "Belanja",
  shopee: "Belanja",
  tokopedia: "Belanja",
  lazada: "Belanja",
  spotify: "Langganan",
  netflix: "Langganan",
  youtube: "Langganan",
  apple: "Langganan",
  "biaya adm": "Administrasi",
  "admin": "Administrasi",
  "trf": "Transfer",
  "transfer": "Transfer",
  "waroeng": "Makanan & Minuman",
  "warung": "Makanan & Minuman",
  "bakso": "Makanan & Minuman",
  "makan": "Makanan & Minuman",
  "kfc": "Makanan & Minuman",
  "mcd": "Makanan & Minuman",
  "mcdonalds": "Makanan & Minuman",
  "tokaf": "Makanan & Minuman",
  "toko alfi": "Makanan & Minuman",
  "alfi": "Makanan & Minuman",
  "alfanow": "Makanan & Minuman",
  "investasi": "Investasi",
  "bibit": "Investasi",
  "ajaib": "Investasi",
  "bareksa": "Investasi",
  "pdam": "Tagihan",
  "pln": "Tagihan",
  "listrik": "Tagihan",
  "indihome": "Tagihan",
  "wifi": "Tagihan",
  "internet": "Tagihan",
  "telkomsel": "Tagihan",
  "xl": "Tagihan",
  "axis": "Tagihan",
  "im3": "Tagihan",
}

/**
 * Lightweight local category suggestion (no AI needed).
 * Falls back to Groq AI if no local keyword matches.
 */
function suggestCategoryLocal(title: string): string | null {
  const lower = title.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category
  }
  return null
}

/**
 * Use Groq AI to suggest categories for transactions that couldn't be
 * matched locally. Groups all unmatched descriptions into a single API call
 * to minimise token usage.
 */
async function suggestCategoriesWithGroq(
  transactions: ParsedTransaction[]
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return categoryMap

  // Only call Groq for transactions without a local suggestion
  const unmatched = transactions.filter((t) => !t.suggested_category)
  if (unmatched.length === 0) return categoryMap

  try {
    const { default: Groq } = await import("groq-sdk")
    const groq = new Groq({ apiKey })

    const prompt = unmatched
      .map((t, idx) => `${idx + 1}. ID:${t.id} DESC:"${t.title}" TYPE:${t.type}`)
      .join("\n")

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `Kamu adalah AI yang mengkategorikan transaksi keuangan Indonesia.
Berikan satu kategori untuk setiap transaksi dari daftar berikut:
["Makanan & Minuman","Transportasi","Belanja","Langganan","Administrasi","Transfer","Investasi","Tagihan","Kesehatan","Hiburan","Pendidikan","Lainnya"]
Balas HANYA dengan JSON: { "results": [ { "id": "...", "category": "..." }, ... ] }`,
        },
        {
          role: "user",
          content: `Kategorikan transaksi berikut:\n${prompt}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(content) as { results?: Array<{ id: string; category: string }> }

    if (Array.isArray(parsed.results)) {
      for (const item of parsed.results) {
        if (item.id && item.category) {
          categoryMap.set(item.id, item.category)
        }
      }
    }
  } catch (err) {
    // Groq failure is non-fatal — user can assign categories manually
    console.error("[mutasi/extract] Groq suggestion failed (non-fatal):", err)
  }

  return categoryMap
}

/**
 * POST /api/mutasi/extract
 *
 * Accepts multipart/form-data with:
 *   - file: PDF file (application/pdf, max 10MB)
 *   - bank: "bca" (currently only BCA is supported)
 *
 * Returns: { transactions: ParsedTransaction[], remaining: number, total_used: number }
 *
 * Security:
 *   - Auth required (Supabase session)
 *   - Rate limited: 3 extractions per user per calendar day
 *   - File never stored to disk or database
 *   - API key server-side only
 */
export async function POST(req: NextRequest) {
  // --- 1. Auth check ---
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    )
  }

  // --- 2. Rate limiting (via Supabase DB) ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { count: usageCount, error: usageError } = await supabase
    .from("mutasi_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("used_at", todayISO)

  if (usageError) {
    console.error("[mutasi/extract] Usage query error:", usageError)
    return NextResponse.json(
      { error: "Gagal memeriksa kuota. Coba lagi." },
      { status: 500 }
    )
  }

  const usedToday = usageCount ?? 0
  const remaining = DAILY_LIMIT - usedToday

  if (remaining <= 0) {
    return NextResponse.json(
      {
        error: `Batas ekstraksi harian tercapai (${DAILY_LIMIT}x/hari). Coba lagi besok.`,
        remaining: 0,
        total_used: usedToday,
      },
      {
        status: 429,
        headers: {
          "Retry-After": "86400",
          "X-RateLimit-Limit": String(DAILY_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  // --- 3. Parse multipart form ---
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: "Request tidak valid. Gunakan multipart/form-data." },
      { status: 400 }
    )
  }

  const file = formData.get("file")
  const bank = (formData.get("bank") as string | null)?.toLowerCase() as SupportedBank | null

  // --- 4. Validate file ---
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Field 'file' wajib ada dan harus berupa file PDF." },
      { status: 400 }
    )
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipe file tidak didukung: ${file.type}. Hanya PDF yang diterima.` },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 10 MB.` },
      { status: 400 }
    )
  }

  if (!bank || !SUPPORTED_BANKS.includes(bank)) {
    return NextResponse.json(
      { error: `Bank '${bank}' belum didukung. Bank yang tersedia: ${SUPPORTED_BANKS.join(", ")}.` },
      { status: 400 }
    )
  }

  // --- 5. Extract text from PDF (in-memory, never saved) ---
  let transactions: ParsedTransaction[] = []
  let pagesCount = 1

  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // unpdf — serverless-safe PDF text extraction
    const { getDocumentProxy, extractText } = await import("unpdf")
    const pdf = await getDocumentProxy(uint8Array)
    pagesCount = pdf.numPages

    const { text } = await extractText(pdf, { mergePages: true })

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "PDF tidak dapat dibaca atau tidak mengandung teks. Pastikan file bukan hasil scan." },
        { status: 422 }
      )
    }

    // --- 6. Parse according to bank format ---
    if (bank === "bca") {
      transactions = parseBCAStatement(text)
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error: "Tidak ditemukan transaksi dalam file ini. Pastikan ini adalah mutasi rekening BCA yang valid.",
          raw_preview: text.slice(0, 200),
        },
        { status: 422 }
      )
    }
  } catch (err) {
    console.error("[mutasi/extract] PDF parsing error:", err)
    return NextResponse.json(
      { error: "Gagal memproses file PDF. Pastikan file tidak rusak atau terproteksi kata sandi." },
      { status: 500 }
    )
  }

  // --- 7. AI category suggestion ---
  // Step 1: fast local keyword matching (no API call)
  transactions = transactions.map((t) => ({
    ...t,
    suggested_category: suggestCategoryLocal(t.title),
  }))

  // Step 2: Groq for remaining unmatched (single batched API call)
  const groqSuggestions = await suggestCategoriesWithGroq(transactions)
  if (groqSuggestions.size > 0) {
    transactions = transactions.map((t) => ({
      ...t,
      suggested_category: t.suggested_category ?? groqSuggestions.get(t.id) ?? null,
    }))
  }

  // --- 8. Record usage (audit trail) ---
  const { error: insertError } = await supabase.from("mutasi_usage").insert({
    user_id: user.id,
    pages_count: pagesCount,
    bank,
    status: "success",
  })

  if (insertError) {
    // Non-fatal: log but don't block the response
    console.error("[mutasi/extract] Failed to record usage:", insertError)
  }

  // --- 9. Return extracted transactions ---
  return NextResponse.json(
    {
      transactions,
      remaining: remaining - 1,
      total_used: usedToday + 1,
      pages_count: pagesCount,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-RateLimit-Limit": String(DAILY_LIMIT),
        "X-RateLimit-Remaining": String(remaining - 1),
      },
    }
  )
}

// Reject all non-POST methods
export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
