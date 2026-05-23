"use client"
import type { Transaction } from "@/types"
import { formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Props { transactions: Transaction[] }

export function TransactionList({ transactions }: Props) {
  if (!transactions.length) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground text-sm">
        Belum ada transaksi bulan ini.
      </div>
    )
  }
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b">
        <p className="text-sm font-semibold">Riwayat Transaksi</p>
      </div>
      <ul className="divide-y">
        {transactions.map((t) => (
          <li key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`} />
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.category?.name} · {format(new Date(t.transactionDate), "d MMM", { locale: id })}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
              {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
