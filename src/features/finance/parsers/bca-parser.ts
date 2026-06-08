import { randomUUID } from "crypto"
import type { ParsedTransaction } from "../types"

// BCA Mutasi Rekening Parser
//
// Parses raw text extracted from BCA e-Statement PDF (mBCA format).
// Handles the two main transaction formats:
//
// 1. QR / QRIS:
//    "TGL: 0605   QR 503   00000.00Waroeng Ma  TRANSAKSI DEBIT  14,000.00 DB"
//
// 2. Mastercard / e-banking transfers / admin fees:
//    "TRN MASTERCARD DBT Grab...  9,000.00 DB"
//    "0106/FTFVA/WS99/SHOPEE...  TRSF E-BANKING DB  102,500.00 DB"
//    "BIAYA ADM  6,500.00 DB"
//
// Date format: DD/MM/YYYY
// Amount format: 14,000.00 (comma = thousands sep, dot = decimal)
// Type indicator: DB = debit = expense, CR = credit = income


interface RawEntry {
  date: string            // "DD/MM/YYYY"
  description: string     // raw keterangan (may be multi-line)
  amount: string          // "14,000.00"
  indicator: "DB" | "CR"
}

/**
 * Parse the amount string from BCA format to a number.
 * e.g. "14,000.00" -> 14000, "1,500,000.00" -> 1500000
 */
function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""))
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD
 */
function toISODate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/**
 * Clean and shorten the raw description into a human-readable title.
 * Strips noise like "TRANSAKSI DEBIT", "DB INTERCHANGE", "TRSF E-BANKING DB", etc.
 */
export function cleanDescription(raw: string): string {
  let cleaned = raw
    // Remove trailing type indicators
    .replace(/\s+(DB|CR)\s+INTERCHANGE\s*$/i, "")
    .replace(/\s*TRANSAKSI\s+DEBIT\s*$/i, "")
    .replace(/\s*TRSF\s+E-BANKING\s+DB\s*$/i, "")
    .replace(/\s*E-BANKING\s+DB\s*$/i, "")
    // Collapse multiple whitespace and newlines
    .replace(/\s+/g, " ")
    .trim()

  // QR/QRIS pattern: "TGL: 0605   QR 503   00000.00MerchantName"
  const qrMatch = cleaned.match(/TGL:\s*\d{4}\s+QR\s+\d+\s+\d+\.\d{2}(.+)/i)
  if (qrMatch) {
    return qrMatch[1].trim() || cleaned
  }

  // MASTERCARD pattern: "TRN MASTERCARD DBTGrab* A-9E****..."
  const cardMatch = cleaned.match(/TRN\s+MASTERCARD\s+DBT?(.+?)(?:\s+A-\w+|$)/i)
  if (cardMatch) {
    return cardMatch[1].trim() || cleaned
  }

  // Transfer e-banking: "0106/FTFVA/WS****9999/SHOPEE..."
  const transferMatch = cleaned.match(/\d{4}\/\w+\/\w+\/(.+)/i)
  if (transferMatch) {
    return transferMatch[1].replace(/[\s-]+\d[\d*]+.*/, "").trim() || cleaned
  }

  return cleaned
}

/**
 * Main BCA PDF statement parser.
 * 
 * @param rawText - Plain text extracted from a BCA PDF via unpdf
 * @returns Array of ParsedTransaction objects (temp, not yet inserted to DB)
 */
export function parseBCAStatement(rawText: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = []

  // Normalise line endings
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = text.split("\n")

  /**
   * BCA PDF tables have this structure (after unpdf text extraction):
   *   DD/MM/YYYY  [description line 1]  amount  DB|CR
   *   (optional)  [description line 2]
   *
   * The date column appears at the start of a new transaction entry.
   * We scan line by line, detect date-anchored lines, then gather
   * the amount+indicator from the same line or the next few lines.
   */

  // Regex: matches "DD/MM/YYYY" at start of a line (with optional leading whitespace)
  const DATE_RE = /^\s*(\d{2}\/\d{2}\/\d{4})\s+(.*)/

  // Regex: matches amount + DB|CR at end of a string
  // e.g. "...  14,000.00 DB" or "  1,500,000.00 CR"
  const AMOUNT_TAIL_RE = /([\d,]+\.\d{2})\s+(DB|CR)\s*$/i

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const dateMatch = line.match(DATE_RE)

    if (!dateMatch) {
      i++
      continue
    }

    const dateStr = dateMatch[1]   // "DD/MM/YYYY"
    let descParts = [dateMatch[2].trim()]

    // Look ahead to gather more description lines + find amount + DB|CR
    let amountStr = ""
    let indicator: "DB" | "CR" | null = null
    let j = i + 1

    // Check if amount+indicator is already on the current line
    const tailMatch = dateMatch[2].match(AMOUNT_TAIL_RE)
    if (tailMatch) {
      amountStr = tailMatch[1]
      indicator = tailMatch[2].toUpperCase() as "DB" | "CR"
      // Remove the amount tail from the description
      descParts = [dateMatch[2].replace(AMOUNT_TAIL_RE, "").trim()]
    } else {
      // Scan up to 5 more lines for continuation + amount
      while (j < lines.length && j < i + 6) {
        const nextLine = lines[j]

        // Stop if we hit the next transaction (new date line)
        if (DATE_RE.test(nextLine)) break

        const nextTail = nextLine.match(AMOUNT_TAIL_RE)
        if (nextTail) {
          // This line contains the amount — grab it, strip tail, add to desc
          amountStr = nextTail[1]
          indicator = nextTail[2].toUpperCase() as "DB" | "CR"
          const descPart = nextLine.replace(AMOUNT_TAIL_RE, "").trim()
          if (descPart) descParts.push(descPart)
          j++
          break
        }

        // Plain continuation line
        const trimmed = nextLine.trim()
        if (trimmed) descParts.push(trimmed)
        j++
      }
    }

    // Only add if we found a valid amount + indicator
    if (amountStr && indicator) {
      const rawDescription = descParts.join(" ").trim()
      const amount = parseAmount(amountStr)

      // Skip zero-amount lines (sometimes appear in PDF noise)
      if (amount > 0) {
        results.push({
          id: randomUUID(),
          date: toISODate(dateStr),
          title: cleanDescription(rawDescription),
          amount,
          type: indicator === "CR" ? "income" : "expense",
          suggested_category: null,   // filled later by Groq
          category_id: null,
          raw_description: rawDescription,
        })
      }
    }

    i = j
  }

  return results
}
