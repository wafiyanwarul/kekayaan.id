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
