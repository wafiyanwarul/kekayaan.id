import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseBCAStatement, parseBCAFlatLines } from "@/features/finance/parsers/bca-parser"
import type { ParsedTransaction, SupportedBank } from "@/features/finance/types"

// Force Node.js runtime for buffer/file processing (required for unpdf)
export const runtime = "nodejs"

// --- Constants ---
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB
const DAILY_LIMIT = 3                          // Max extractions per user per day
const ALLOWED_MIME_TYPES = ["application/pdf"]
const SUPPORTED_BANKS: SupportedBank[] = ["bca"]

// --- Groq category suggestion ---
// Ordered from most specific to most generic.
// First match wins. Use lowercase; partial matching is applied.
const CATEGORY_RULES: Array<{ keywords: string[]; category: string }> = [
  // ── Investasi ─────────────────────────────────────────────
  {
    keywords: ["bibit", "ajaib", "bareksa", "stockbit", "pluang", "indodax", "pintu", "reksadana", "mutual fund", "saham", "invest"],
    category: "Investasi",
  },
  // ── Tagihan / Langganan ──────────────────────────────────
  {
    keywords: ["spotify", "netflix", "youtube premium", "youtube music", "disney+", "disney plus", "prime video", "apple tv", "hbo", "vidio", "mola tv", "vision+", "canva pro", "notion", "chatgpt", "openai", "github", "figma", "adobe"],
    category: "Langganan",
  },
  {
    keywords: ["pln", "pdam", "listrik", "air bersih", "indihome", "myrepublic", "biznet", "firstmedia", "wifi", "internet", "telkomsel", "xl axiata", "axis", "smartfren", "tri ", " tri ", "im3", "indosat", "bolt", "by.u", "byku", "loop"],
    category: "Tagihan",
  },
  // ── Top-up / e-Wallet ────────────────────────────────────
  {
    keywords: ["top up", "topup", "top-up", "isi saldo", "isi ulang", "pulsa", "paket data", "reload", "recharge"],
    category: "Top-up & Pulsa",
  },
  {
    keywords: ["gopay", "ovo ", " ovo", "dana ", " dana", "linkaja", "jenius", "shopeepay", "spay", "sakuku", "flazz", "tapcash", "brizzi", "emoney", "e-money", "dompet digital"],
    category: "Top-up & Pulsa",
  },
  // ── Transportasi ─────────────────────────────────────────
  {
    keywords: ["grab", "gojek", "go-jek", "maxim", "indriver", "ojek", "gocar", "gomotor", "grabcar", "grabmotor", "grabbike", "goride", "bluebird", "taxix", "transjakarta", "commuter", "mrt", "lrt", "kereta", "kai ", "bus", "bensin", "bbm", "pertamina", "shell", "spbu", "parkir", "tol"],
    category: "Transportasi",
  },
  // ── Makanan & Minuman ─────────────────────────────────────
  // Online delivery first
  {
    keywords: ["gofood", "grabfood", "shopeefood", "shopee food", "traveloka eats", "kfc", "mcdonalds", "mcd ", "mc d", "burger king", "wendy's", "wendys", "domino", "pizza hut", "pizzahut", "hokben", "hoka hoka", "starbucks", "chatime", "kopi kenangan", "fore coffee", "kopitiam", "es teh", "boba", "mixue", "thai tea"],
    category: "Makanan & Minuman",
  },
  // Warung / local food
  {
    keywords: [
      "waroeng", "warung", "warteg", "warug",
      "makan", "sarapan", "makan siang", "makan malam", "santap",
      "nasi", "mie", "bakso", "soto", "ayam", "pecel", "lalapan", "padang", "sunda", "seafood",
      "pisang", "buah", "snack", "jajan", "kue", "gorengan", "siomay", "batagor",
      "kopi", "teh ", "minuman", "juice", "jus", "es ", "cafe", "cafeteria", "kantin",
      "restoran", "restaurant", "rumah makan", "rm ", "depot",
      "alfanow", "toko alfi", "toko a", "alfanow",
    ],
    category: "Makanan & Minuman",
  },
  // ── Belanja ───────────────────────────────────────────────
  {
    keywords: ["shopee", "tokopedia", "lazada", "blibli", "bukalapak", "tiktok shop", "zalora", "sociolla", "jd.id", "sendo"],
    category: "Belanja Online",
  },
  {
    keywords: ["indomaret", "alfamart", "alfamidi", "superindo", "hero ", "giant", "hypermart", "carrefour", "lottemart", "transmart", "indogrosir", "yogya", "ramayana", "matahari", "ace hardware", "ikea", "uniqlo", "h&m", "zara", "guardian", "watson", "century", "k24"],
    category: "Belanja",
  },
  // ── Kesehatan ─────────────────────────────────────────────
  {
    keywords: ["apotek", "apotik", "kimia farma", "guardian", "halodoc", "alodokter", "klinik", "rumah sakit", "puskesmas", "dokter", "obat", "vitamin", "suplemen", "laboratorium", "lab ", "rontgen", "bpjs"],
    category: "Kesehatan",
  },
  // ── Hiburan ───────────────────────────────────────────────
  {
    keywords: ["bioskop", "cgv", "cinepolis", "xxi", "21 ", "cinema", "game", "gaming", "steam", "playstation", "nintendo", "xbox", "konser", "event", "ticket", "tiket"],
    category: "Hiburan",
  },
  // ── Administrasi / Bank ───────────────────────────────────
  {
    keywords: ["biaya adm", "biaya admin", "admin bank", "biaya bulanan", "biaya transfer", "provisi", "denda", "penalti", "materai"],
    category: "Administrasi",
  },
  // ── Transfer / Kirim Uang ────────────────────────────────
  {
    keywords: ["transfer", "trsf", "trf ke", "kirim ke", "kirim uang", "remitansi", "remittance"],
    category: "Transfer",
  },
  // ── Pendidikan ────────────────────────────────────────────
  {
    keywords: ["spp", "ukt", "kuliah", "sekolah", "les ", "kursus", "bimbel", "ruangguru", "zenius", "udemy", "coursera", "skillshare", "dicoding", "edutech"],
    category: "Pendidikan",
  },
]

/**
 * Lightweight local category suggestion.
 * Uses ordered rules — first match wins.
 * Falls back to Groq AI if nothing matches.
 */
function suggestCategoryLocal(title: string): string | null {
  const lower = title.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.trim().toLowerCase())) {
        return rule.category
      }
    }
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
          content: `Kamu adalah AI yang mengkategorikan transaksi keuangan perbankan Indonesia dari mutasi rekening BCA.

DAFTAR KATEGORI yang tersedia (pilih SATU yang paling tepat):
- "Makanan & Minuman" → warung, warteg, waroeng, restoran, kafe, jajan, makan, nasi, mie, bakso, soto, pisang, buah, gorengan, es, kopi, minuman, delivery makanan
- "Transportasi" → Grab, Gojek, ojek online, parkir, bensin, BBM, tol, kereta, bus, taksi
- "Belanja" → Indomaret, Alfamart, supermarket, minimarket, online shop lokal
- "Belanja Online" → Shopee, Tokopedia, Lazada, Blibli, Bukalapak, TikTok Shop
- "Langganan" → Spotify, Netflix, YouTube Premium, Disney+, Apple, iCloud, SaaS apps, aplikasi berlangganan
- "Tagihan" → PLN, PDAM, listrik, air, internet, Wi-Fi, pulsa, paket data, Indihome, Telkomsel, XL, BPJS
- "Top-up & Pulsa" → GoPay, OVO, DANA, LinkAja, ShopeePay, dompet digital, top-up saldo, isi ulang pulsa
- "Investasi" → Bibit, Ajaib, Bareksa, Stockbit, saham, reksa dana, crypto
- "Kesehatan" → apotek, klinik, rumah sakit, obat, vitamin, dokter, lab
- "Hiburan" → bioskop, game, konser, tiket event, CGV, XXI
- "Administrasi" → biaya admin bank, provisi, denda, materai
- "Transfer" → transfer ke rekening lain, kirim uang
- "Pendidikan" → SPP, kursus, bimbel, aplikasi belajar
- "Lainnya" → jika benar-benar tidak bisa diklasifikasikan

ATURAN PENTING:
1. Nama tempat dengan awalan "Waroeng", "Warung", "Warteg", atau kata makanan lokal → "Makanan & Minuman"
2. Nama dengan kata "Grab" atau "Gojek" tanpa konteks makanan → "Transportasi"
3. Topup e-wallet (GoPay, OVO, DANA, dsb) → "Top-up & Pulsa"
4. Biaya admin/administrasi bank → "Administrasi"
5. Jangan pernah memilih "Lainnya" jika ada kategori yang masuk akal
6. Balas HANYA dengan JSON: { "results": [ { "id": "...", "category": "..." }, ... ] }`,
        },
        {
          role: "user",
          content: `Kategorikan transaksi berikut (gunakan raw_desc sebagai konteks tambahan jika tersedia):\n${prompt}`,
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

      // Fallback: if line-by-line parser found nothing, try flat-line strategy
      if (transactions.length === 0) {
        console.log("[mutasi/extract] Line parser found 0 results, trying flat-line fallback...")
        transactions = parseBCAFlatLines(text)
      }
    }

    if (transactions.length === 0) {
      // Return more of the raw text so we can debug the actual format
      const lineCount = text.split("\n").length
      return NextResponse.json(
        {
          error: "Tidak ditemukan transaksi dalam file ini. Pastikan ini adalah mutasi rekening BCA yang valid.",
          debug: {
            pages: pagesCount,
            total_chars: text.length,
            total_lines: lineCount,
            raw_preview: text.slice(0, 2000),
            lines_preview: text.split("\n").slice(0, 50),
          },
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
