import { randomUUID } from "crypto"
import type { ParsedTransaction } from "../types"

// BCA Mutasi Rekening Parser
//
// Parses raw text extracted from BCA e-Statement PDF (mBCA format).
// BCA uses TWO possible date formats in their PDFs:
//   - "DD/MM/YYYY" (full year, newer statements)
//   - "DD/MM"      (no year, older / period-based statements)
//
// BCA uses TWO possible number formats:
//   - "14,000.00"   (comma thousands, dot decimal — English locale)
//   - "14.000,00"   (dot thousands, comma decimal — Indonesian locale)
//
// Type indicator at end of amount: DB = debit = expense, CR = credit = income

// ---------------------------------------------------------------------------
// Amount parsing — handles both ID and EN number formats
// ---------------------------------------------------------------------------
function parseAmount(raw: string): number {
  const trimmed = raw.trim()

  // Indonesian format: ends with ",XX" (comma decimal)
  // e.g. "14.000,50" → 14000.50
  if (/^\d[\d.]*,\d{2}$/.test(trimmed)) {
    return parseFloat(trimmed.replace(/\./g, "").replace(",", "."))
  }

  // English format: ends with ".XX" (dot decimal)
  // e.g. "14,000.50" → 14000.50
  if (/^\d[\d,]*\.\d{2}$/.test(trimmed)) {
    return parseFloat(trimmed.replace(/,/g, ""))
  }

  // Fallback: strip all non-numeric except last separator
  const cleaned = trimmed.replace(/[,.](?=\d{3})/g, "").replace(",", ".")
  return parseFloat(cleaned) || 0
}

// ---------------------------------------------------------------------------
// Date conversion — handles DD/MM and DD/MM/YYYY
// ---------------------------------------------------------------------------
function toISODate(dateStr: string, fallbackYear?: number): string {
  const parts = dateStr.split("/")

  if (parts.length === 3) {
    const [d, m, y] = parts
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  // DD/MM only — use fallback year or current year
  const [d, m] = parts
  const year = fallbackYear ?? new Date().getFullYear()
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

// Extract the year from a BCA PDF period header line, e.g.
// "Periode  : 01/06/2026 s/d 07/06/2026"  → 2026
function extractYearFromHeader(text: string): number | undefined {
  const m = text.match(/(?:Periode|Period)\s*:?\s*\d{2}\/\d{2}\/(\d{4})/i)
  if (m) return parseInt(m[1], 10)

  // Try any 4-digit year after DD/MM/
  const m2 = text.match(/\d{2}\/\d{2}\/(\d{4})/)
  if (m2) return parseInt(m2[1], 10)

  return undefined
}

// ---------------------------------------------------------------------------
// Description cleaning
// ---------------------------------------------------------------------------
export function cleanDescription(raw: string): string {
  let s = raw
    .replace(/\s+(DB|CR)\s+INTERCHANGE\s*$/i, "")
    .replace(/\s*TRANSAKSI\s+DEBIT\s*$/i, "")
    .replace(/\s*TRANSAKSI\s+KREDIT\s*$/i, "")
    .replace(/\s*TRSF\s+E-BANKING\s+(DB|CR)\s*$/i, "")
    .replace(/\s*E-BANKING\s+(DB|CR)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()

  // QR/QRIS: "TGL: 0605   QR 503   00000.00MerchantName"
  const qr = s.match(/TGL:\s*\d{4}\s+QR\s+\d+\s+[\d.,]+(.+)/i)
  if (qr) return qr[1].trim() || s

  // Mastercard: "TRN MASTERCARD DBT Grab*..."
  const card = s.match(/TRN\s+MASTERCARD\s+DBT?\s*(.+?)(?:\s+[A-Z]-\w+|$)/i)
  if (card) return card[1].trim() || s

  // Transfer e-banking: "0106/FTFVA/WS.../SHOPEE..."
  const trf = s.match(/\d{4}\/\w+\/\w+\/(.+)/i)
  if (trf) return trf[1].replace(/[\s-]+[\d*]+.*$/, "").trim() || s

  return s
}

// ---------------------------------------------------------------------------
// Amount + DB|CR regex — matches BOTH number formats at end of a string
// ---------------------------------------------------------------------------
// Matches:
//   "14,000.00 DB"   (English)
//   "14.000,00 DB"   (Indonesian)
//   "1,500,000.00 CR"
//   "1.500.000,00 CR"
const AMOUNT_TAIL_RE =
  /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s+(DB|CR)\s*$/i

// Date at start of a line:
//   "DD/MM/YYYY   rest..."
//   "DD/MM   rest..."
const DATE_RE = /^\s*(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.*)/

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------
export function parseBCAStatement(rawText: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = []

  // Normalise line endings
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Try to find the year from the period header
  const fallbackYear = extractYearFromHeader(text)

  const lines = text.split("\n")

  console.log("[bca-parser] Total lines:", lines.length)
  console.log("[bca-parser] Year from header:", fallbackYear)
  console.log("[bca-parser] First 20 lines:\n", lines.slice(0, 20).join("\n"))

  // Strategy: scan line-by-line.
  // When we find a line starting with DD/MM or DD/MM/YYYY, start a new entry.
  // Gather continuation lines until we find the amount+DB|CR tail.
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const dateMatch = line.match(DATE_RE)

    if (!dateMatch) {
      i++
      continue
    }

    const dateStr = dateMatch[1]
    let descParts: string[] = [dateMatch[2].trim()]

    let amountStr = ""
    let indicator: "DB" | "CR" | null = null
    let j = i + 1

    // Check if amount+indicator is already on this line
    const tailMatch = dateMatch[2].match(AMOUNT_TAIL_RE)
    if (tailMatch) {
      amountStr = tailMatch[1]
      indicator = tailMatch[2].toUpperCase() as "DB" | "CR"
      descParts = [dateMatch[2].replace(AMOUNT_TAIL_RE, "").trim()]
    } else {
      // Look ahead up to 8 lines for continuation + amount
      while (j < lines.length && j < i + 9) {
        const next = lines[j]

        // Stop at next transaction date
        if (DATE_RE.test(next)) break

        const nextTail = next.match(AMOUNT_TAIL_RE)
        if (nextTail) {
          amountStr = nextTail[1]
          indicator = nextTail[2].toUpperCase() as "DB" | "CR"
          const part = next.replace(AMOUNT_TAIL_RE, "").trim()
          if (part) descParts.push(part)
          j++
          break
        }

        const trimmed = next.trim()
        // Skip pure-noise lines (page numbers, dashes, etc.)
        if (trimmed && !/^[-=]{3,}$/.test(trimmed)) {
          descParts.push(trimmed)
        }
        j++
      }
    }

    if (amountStr && indicator) {
      const rawDescription = descParts.join(" ").trim()
      const amount = parseAmount(amountStr)

      if (amount > 0) {
        results.push({
          id: randomUUID(),
          date: toISODate(dateStr, fallbackYear),
          title: cleanDescription(rawDescription),
          amount,
          type: indicator === "CR" ? "income" : "expense",
          suggested_category: null,
          category_id: null,
          raw_description: rawDescription,
        })
      }
    }

    i = j
  }

  console.log("[bca-parser] Found transactions:", results.length)
  if (results.length > 0) {
    console.log("[bca-parser] Sample:", JSON.stringify(results[0]))
  }

  return results
}

// ---------------------------------------------------------------------------
// Alternative: flat-line strategy (fallback when table structure is lost)
// ---------------------------------------------------------------------------
// Some PDF extractors lose row structure and output everything on one long line.
// This secondary parser handles that case.
export function parseBCAFlatLines(rawText: string): ParsedTransaction[] {
  const fallbackYear = extractYearFromHeader(rawText)
  const results: ParsedTransaction[] = []

  // Match: [date] [description] [amount] [DB|CR]
  // All on one line, with flexible separators
  const ROW_RE =
    /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s+(DB|CR)/gi

  let match
  while ((match = ROW_RE.exec(rawText)) !== null) {
    const [, dateStr, desc, amountRaw, indicator] = match
    const amount = parseAmount(amountRaw)
    if (amount > 0) {
      results.push({
        id: randomUUID(),
        date: toISODate(dateStr, fallbackYear),
        title: cleanDescription(desc.trim()),
        amount,
        type: indicator.toUpperCase() === "CR" ? "income" : "expense",
        suggested_category: null,
        category_id: null,
        raw_description: desc.trim(),
      })
    }
  }

  console.log("[bca-parser:flat] Found transactions:", results.length)
  return results
}
