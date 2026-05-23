import { create } from "zustand"
import type { Transaction } from "@/types"

interface FinanceStore {
  transactions: Transaction[]
  isLoading: boolean
  setTransactions: (t: Transaction[]) => void
  addTransaction: (t: Transaction) => void
  updateTransaction: (id: string, t: Partial<Transaction>) => void
  removeTransaction: (id: string) => void
  setLoading: (v: boolean) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  isLoading: false,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  updateTransaction: (id, updated) =>
    set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)) })),
  removeTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}))
