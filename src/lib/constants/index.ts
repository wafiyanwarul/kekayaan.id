export const ASSET_CATEGORIES = {
  liquid: ["cash", "bank", "e-wallet", "stocks", "mutual_funds", "bonds", "crypto"],
  non_liquid: ["gold", "laptop", "ipad", "phone", "vehicle", "property", "others"],
} as const

export const EXPENSE_CATEGORIES = [
  "food", "transport", "rent", "internet",
  "family", "health", "entertainment", "shopping", "misc",
] as const

export const INCOME_CATEGORIES = [
  "salary", "freelance", "bonus", "business", "gift", "others",
] as const

export const GOAL_TYPES = [
  "marriage", "house", "car", "hajj", "umrah",
  "retirement", "education", "business", "custom",
] as const

export const MONTHLY_CYCLE = { startDay: 25, endDay: 24 } as const
