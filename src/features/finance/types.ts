export type FinanceViewMode = "items" | "days" | "months" | "years"
export type FinanceTypeFilter = "all" | "income" | "expense"
export type TransactionType = "income" | "expense"

export interface FinanceCategory {
  id: string
  user_id: string
  name: string
  type: TransactionType
}

export interface FinanceTransaction {
  id: string
  user_id: string
  title: string
  amount: number
  type: TransactionType
  category_id: string | null
  transaction_date: string
  notes: string | null
  created_at: string
  category?: FinanceCategory | null
}

export interface FinanceCycle {
  start_day: number
  end_day: number
}

/**
 * Represents a transaction extracted from a bank statement PDF.
 * This is a temporary, client-side type used during the import preview step.
 * It is never persisted to the database in this form.
 */
export interface ParsedTransaction {
  /** Temporary client-side UUID for React key and row management */
  id: string
  /** Transaction date in ISO format "YYYY-MM-DD" */
  date: string
  /** Cleaned, human-readable title (merchant name or description) */
  title: string
  /** Amount in IDR (always positive) */
  amount: number
  /** DB = expense (debit), CR = income (credit) */
  type: TransactionType
  /** AI-suggested category name (from Groq), user can override */
  suggested_category: string | null
  /** User-selected category ID for final import */
  category_id: string | null
  /** Raw description string from PDF (for debugging / display) */
  raw_description: string
}

/** Bank codes supported by the mutasi extractor */
export type SupportedBank = "bca"
