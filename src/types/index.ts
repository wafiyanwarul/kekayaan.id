export type AssetCategory =
  | "cash" | "bank" | "e-wallet" | "stocks" | "mutual_funds"
  | "bonds" | "crypto" | "gold" | "laptop" | "ipad"
  | "phone" | "vehicle" | "property" | "others"

export type TransactionType = "income" | "expense"
export type GoalType =
  | "marriage" | "house" | "car" | "hajj" | "umrah"
  | "retirement" | "education" | "business" | "custom"

export interface Asset {
  id: string
  userId: string
  name: string
  category: AssetCategory
  currentValue: number
  isLiquid: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AssetSnapshot {
  id: string
  assetId: string
  value: number
  snapshotDate: string
}

export interface Transaction {
  id: string
  userId: string
  title: string
  amount: number
  type: TransactionType
  categoryId?: string
  transactionDate: string
  notes?: string
  createdAt: string
  category?: TransactionCategory
}

export interface TransactionCategory {
  id: string
  userId: string
  name: string
  type: TransactionType
}

export interface Goal {
  id: string
  userId: string
  title: string
  targetAmount: number
  targetDate: string
  goalType: GoalType
  createdAt: string
}

export interface MonthlyCycle {
  startDay: number
  endDay: number
}

// Dashboard summary types
export interface WealthSummary {
  totalWealth: number
  liquidWealth: number
  nonLiquidWealth: number
  todayDelta: number
  monthlyDelta: number
}

export interface MonthlyFinanceSummary {
  totalIncome: number
  totalExpense: number
  surplus: number
  savingsRate: number
  cycleStart: string
  cycleEnd: string
}
