import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { FinanceCycle, FinanceTransaction } from "./types"

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function getCycleRange(date: Date, cycle: FinanceCycle) {
  const startMonth = date.getDate() >= cycle.start_day ? date.getMonth() : date.getMonth() - 1
  const start = new Date(date.getFullYear(), startMonth, cycle.start_day)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, cycle.end_day)

  return { end, start }
}

export function formatDateLabel(value: string) {
  return format(parseDate(value), "d MMM yyyy", { locale: id })
}

export function formatShortDate(value: string) {
  return format(parseDate(value), "d MMM", { locale: id })
}

export function formatCycleLabel(start: Date, end: Date) {
  return `${format(start, "d MMM yyyy", { locale: id })} - ${format(end, "d MMM yyyy", { locale: id })}`
}

export function isInRange(value: string, start: Date, end: Date) {
  const date = parseDate(value)

  return date >= start && date <= end
}

export function summarizeTransactions(transactions: FinanceTransaction[]) {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const surplus = income - expense
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0

  return { expense, income, savingsRate, surplus }
}

export function sortTransactions(transactions: FinanceTransaction[]) {
  return [...transactions].sort((a, b) => {
    const byDate = b.transaction_date.localeCompare(a.transaction_date)
    if (byDate !== 0) return byDate

    return b.created_at.localeCompare(a.created_at)
  })
}

/** Returns all unique billing cycles that appear in `transactions` plus the
 *  current active cycle, sorted newest → oldest. Index 0 is always current. */
export function getAvailableCycles(
  transactions: FinanceTransaction[],
  cycle: FinanceCycle,
  now = new Date()
): Array<{ end: Date; label: string; start: Date }> {
  const currentCycle = getCycleRange(now, cycle)
  const seen = new Set<string>()
  const cycles: Array<{ end: Date; label: string; start: Date }> = []

  // Always include the current active cycle first
  const currentKey = currentCycle.start.toISOString()
  seen.add(currentKey)
  cycles.push({ ...currentCycle, label: formatCycleLabel(currentCycle.start, currentCycle.end) })

  // Derive cycles from every transaction date
  transactions.forEach((tx) => {
    const range = getCycleRange(parseDate(tx.transaction_date), cycle)
    const key = range.start.toISOString()
    if (!seen.has(key)) {
      seen.add(key)
      cycles.push({ ...range, label: formatCycleLabel(range.start, range.end) })
    }
  })

  // Sort newest → oldest
  return cycles.sort((a, b) => b.start.getTime() - a.start.getTime())
}
