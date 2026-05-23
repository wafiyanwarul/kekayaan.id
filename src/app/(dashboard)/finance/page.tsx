import Link from "next/link"
import { StatCard } from "@/components/shared/StatCard"
import { TransactionList } from "@/features/finance/components/TransactionList"
import { formatCompact } from "@/lib/utils"

const mockSummary = {
  totalIncome: 12_000_000, totalExpense: 7_350_000,
  surplus: 4_650_000, savingsRate: 38.75,
  cycleStart: "25 Apr 2025", cycleEnd: "24 Mei 2025",
}

const mockTransactions = [
  { id: "1", title: "Gaji Mei", amount: 10_000_000, type: "income" as const, transactionDate: "2025-05-01", category: { id: "c1", name: "Gaji", type: "income" as const, userId: "u1" }, userId: "u1", createdAt: "" },
  { id: "2", title: "Freelance", amount: 2_000_000, type: "income" as const, transactionDate: "2025-05-05", category: { id: "c2", name: "Freelance", type: "income" as const, userId: "u1" }, userId: "u1", createdAt: "" },
  { id: "3", title: "Makan siang", amount: 45_000, type: "expense" as const, transactionDate: "2025-05-07", category: { id: "c3", name: "Makanan", type: "expense" as const, userId: "u1" }, userId: "u1", createdAt: "" },
  { id: "4", title: "Tagihan internet", amount: 350_000, type: "expense" as const, transactionDate: "2025-05-08", category: { id: "c4", name: "Internet", type: "expense" as const, userId: "u1" }, userId: "u1", createdAt: "" },
]

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Siklus aktif</p>
          <p className="text-sm font-medium">{mockSummary.cycleStart} – {mockSummary.cycleEnd}</p>
        </div>
        <Link href="/finance/transactions/new"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-medium hover:bg-primary/90 transition-colors">
          + Transaksi
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pemasukan" value={formatCompact(mockSummary.totalIncome)} trend="up" />
        <StatCard label="Pengeluaran" value={formatCompact(mockSummary.totalExpense)} trend="down" />
        <StatCard label="Surplus" value={formatCompact(mockSummary.surplus)} trend="up" />
        <StatCard label="Savings Rate" value={`${mockSummary.savingsRate.toFixed(1)}%`} />
      </div>

      <TransactionList transactions={mockTransactions} />
    </div>
  )
}
