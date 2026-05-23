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
