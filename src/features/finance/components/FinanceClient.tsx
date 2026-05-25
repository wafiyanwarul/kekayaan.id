"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Percent,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PdfExportModal } from "./PdfExportModal"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { cn, formatCompact, formatRupiah } from "@/lib/utils"
import {
  formatCycleLabel,
  formatDateLabel,
  formatShortDate,
  getAvailableCycles,
  getCycleRange,
  isInRange,
  parseDate,
  sortTransactions,
  summarizeTransactions,
} from "../utils"
import type {
  FinanceCategory,
  FinanceCycle,
  FinanceTransaction,
  FinanceTypeFilter,
  FinanceViewMode,
} from "../types"
import { TransactionFormModal } from "./TransactionFormModal"

interface Props {
  cycle: FinanceCycle
  initialCategories: FinanceCategory[]
  initialTransactions: FinanceTransaction[]
  userId: string
}

interface FinanceGroup {
  expense: number
  income: number
  key: string
  label: string
  sortValue: string
  surplus: number
  transactions: FinanceTransaction[]
}

interface CategoryShare {
  amount: number
  name: string
  percentage: number
}

const viewOptions: Array<{ label: string; value: FinanceViewMode }> = [
  { label: "Item", value: "items" },
  { label: "Harian", value: "days" },
  { label: "Bulanan", value: "months" },
  { label: "Tahunan", value: "years" },
]

const typeOptions: Array<{ label: string; value: FinanceTypeFilter }> = [
  { label: "Semua", value: "all" },
  { label: "Pemasukan", value: "income" },
  { label: "Pengeluaran", value: "expense" },
]

const CATEGORY_COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#38bdf8", "#a855f7", "#14b8a6", "#fb7185"]

export function FinanceClient({ cycle, initialCategories, initialTransactions, userId }: Props) {
  const [transactions, setTransactions] = useState(() => sortTransactions(initialTransactions))
  const [categories] = useState(initialCategories)
  const [viewMode, setViewMode] = useState<FinanceViewMode>("items")
  const [typeFilter, setTypeFilter] = useState<FinanceTypeFilter>("all")
  const [search, setSearch] = useState("")
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<FinanceTransaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0)
  const [showCycleDropdown, setShowCycleDropdown] = useState(false)
  const [dropdownYear, setDropdownYear] = useState<number>(() => new Date().getFullYear())

  const availableCycles = useMemo(() => getAvailableCycles(transactions, cycle), [transactions, cycle])
  const selectedCycle = availableCycles[selectedCycleIndex] ?? availableCycles[0]
  const isCurrentCycle = selectedCycleIndex === 0

  // All unique years that have at least one cycle
  const availableYears = useMemo(() => {
    const years = new Set(availableCycles.map((c) => c.start.getFullYear()))
    return [...years].sort((a, b) => b - a)
  }, [availableCycles])

  // Cycles visible in the dropdown filtered by selected year
  const dropdownCycles = useMemo(
    () => availableCycles.filter((c) => c.start.getFullYear() === dropdownYear),
    [availableCycles, dropdownYear]
  )

  const activeTransactions = useMemo(
    () => transactions.filter((transaction) => isInRange(transaction.transaction_date, selectedCycle.start, selectedCycle.end)),
    [selectedCycle, transactions]
  )
  const activeSummary = useMemo(() => summarizeTransactions(activeTransactions), [activeTransactions])
  const cycleLabel = selectedCycle?.label ?? ""

  // Riwayat Transaksi — now scoped to the selected cycle
  const visibleTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return activeTransactions.filter((transaction) => {
      const matchesType = typeFilter === "all" || transaction.type === typeFilter
      const categoryName = transaction.category?.name ?? ""
      const matchesSearch =
        !normalizedSearch ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        categoryName.toLowerCase().includes(normalizedSearch) ||
        transaction.notes?.toLowerCase().includes(normalizedSearch)

      return matchesType && matchesSearch
    })
  }, [search, activeTransactions, typeFilter])

  // Daily average spend for Makanan & Transportasi
  const dailyAvgStats = useMemo(() => {
    const cycleDays = Math.max(
      1,
      Math.round((selectedCycle.end.getTime() - selectedCycle.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )
    const expenseItems = activeTransactions.filter((t) => t.type === "expense")
    const sumCategory = (keyword: string) =>
      expenseItems
        .filter((t) => (t.category?.name ?? "").toLowerCase().includes(keyword.toLowerCase()))
        .reduce((s, t) => s + t.amount, 0)
    return {
      cycleDays,
      makanan: sumCategory("makanan"),
      transportasi: sumCategory("transportasi"),
    }
  }, [activeTransactions, selectedCycle])

  const groupedTransactions = useMemo(
    () => buildGroups(visibleTransactions, viewMode, cycle),
    [cycle, viewMode, visibleTransactions]
  )

  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { expense: number; income: number; label: string }>()

    activeTransactions.forEach((transaction) => {
      const entry = dailyMap.get(transaction.transaction_date) ?? {
        expense: 0,
        income: 0,
        label: formatShortDate(transaction.transaction_date),
      }

      if (transaction.type === "income") entry.income += transaction.amount
      else entry.expense += transaction.amount

      dailyMap.set(transaction.transaction_date, entry)
    })

    return [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)
  }, [activeTransactions])
  const categoryShares = useMemo(
    () => ({
      expense: buildCategoryShares(activeTransactions, "expense"),
      income: buildCategoryShares(activeTransactions, "income"),
    }),
    [activeTransactions]
  )

  function openNewModal() {
    setEditingTransaction(null)
    setShowModal(true)
  }

  function openEditModal(transaction: FinanceTransaction) {
    setEditingTransaction(transaction)
    setShowModal(true)
  }

  function handleSaved(transaction: FinanceTransaction, isEdit: boolean) {
    setTransactions((current) =>
      sortTransactions(
        isEdit
          ? current.map((item) => (item.id === transaction.id ? transaction : item))
          : [transaction, ...current]
      )
    )
    setShowModal(false)
    setEditingTransaction(null)
  }

  async function handleDelete(transaction: FinanceTransaction) {
    setDeletingId(transaction.id)
    const supabase = createClient()
    const { error } = await supabase.from("transactions").delete().eq("id", transaction.id)

    if (!error) {
      setTransactions((current) => current.filter((item) => item.id !== transaction.id))
      setPendingDelete(null)
    }

    setDeletingId(null)
  }

  function toggleGroup(key: string) {
    setExpandedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Period Selector */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Siklus ditampilkan</p>
          <div className="relative flex items-center gap-1.5">
            {/* Prev button */}
            <button
              type="button"
              disabled={selectedCycleIndex >= availableCycles.length - 1}
              onClick={() => {
                setSelectedCycleIndex((i) => Math.min(i + 1, availableCycles.length - 1))
                setShowCycleDropdown(false)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e2235] bg-[#0f1117] text-slate-400 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
              title="Siklus sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Cycle dropdown button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCycleDropdown((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-[#1e2235] bg-[#0f1117] px-3 py-1.5 text-sm font-semibold text-white transition hover:border-indigo-500/40 hover:bg-indigo-500/10 cursor-pointer"
              >
                <span>{cycleLabel}</span>
                {isCurrentCycle && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                    Aktif
                  </span>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", showCycleDropdown && "rotate-180")} />
              </button>

              {showCycleDropdown && (
                <>
                  {/* backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowCycleDropdown(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1.5 w-72 overflow-hidden rounded-xl border border-[#1e2235] bg-[#1a1d2e] shadow-2xl">
                    {/* Year tabs */}
                    {availableYears.length > 1 && (
                      <div className="flex gap-1 border-b border-[#1e2235] px-2 py-2">
                        {availableYears.map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => setDropdownYear(year)}
                            className={cn(
                              "flex-1 rounded-md px-2 py-1 text-xs font-semibold transition cursor-pointer",
                              dropdownYear === year
                                ? "bg-indigo-600 text-white"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="border-b border-[#1e2235] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Pilih Siklus {dropdownYear}
                    </p>
                    <ul className="max-h-52 overflow-y-auto">
                      {dropdownCycles.length === 0 ? (
                        <li className="px-3 py-4 text-center text-sm text-slate-500">Tidak ada siklus di tahun ini.</li>
                      ) : dropdownCycles.map((c) => {
                        const idx = availableCycles.findIndex((ac) => ac.start.toISOString() === c.start.toISOString())
                        return (
                          <li key={c.start.toISOString()}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCycleIndex(idx)
                                setShowCycleDropdown(false)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-sm transition cursor-pointer hover:bg-white/5",
                                idx === selectedCycleIndex ? "text-white" : "text-slate-400"
                              )}
                            >
                              <span>{c.label}</span>
                              <span className="flex items-center gap-2 shrink-0">
                                {idx === 0 && (
                                  <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-300">
                                    Aktif
                                  </span>
                                )}
                                {idx === selectedCycleIndex && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                )}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Next button */}
            <button
              type="button"
              disabled={selectedCycleIndex <= 0}
              onClick={() => {
                setSelectedCycleIndex((i) => Math.max(i - 1, 0))
                setShowCycleDropdown(false)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e2235] bg-[#0f1117] text-slate-400 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
              title="Siklus berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PdfExportModal
            transactions={transactions}
            cycle={cycle}
            defaultCycleIndex={selectedCycleIndex}
          />
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-[#1e2235] px-4 py-2 text-sm font-medium text-slate-500 opacity-70 cursor-not-allowed"
            title="Fitur ekstraksi mutasi PDF akan ditambahkan nanti"
          >
            <FileText className="h-4 w-4" />
            Import Mutasi PDF
          </button>
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Transaksi
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FinanceStatCard
          icon={ArrowUpRight}
          label="Pemasukan"
          value={formatCompact(activeSummary.income)}
          tone="income"
          sub="Siklus aktif"
        />
        <FinanceStatCard
          icon={ArrowDownLeft}
          label="Pengeluaran"
          value={formatCompact(activeSummary.expense)}
          tone="expense"
          sub="Siklus aktif"
        />
        <FinanceStatCard
          icon={PiggyBank}
          label="Surplus"
          value={formatCompact(activeSummary.surplus)}
          tone={activeSummary.surplus >= 0 ? "income" : "expense"}
          sub={activeSummary.surplus >= 0 ? "Masih positif" : "Defisit"}
        />
        <FinanceStatCard
          icon={Percent}
          label="Savings Rate"
          value={`${activeSummary.savingsRate.toFixed(1)}%`}
          tone="neutral"
          sub="Surplus / pemasukan"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Arus Kas{isCurrentCycle ? " Siklus Ini" : " Periode Ini"}
                </h3>
              </div>
              <p className="text-[13px] font-medium text-slate-400">
                <span className="font-semibold text-slate-200">{activeTransactions.length} transaksi</span>
                {" · "}
                <span>{cycleLabel}</span>
              </p>
            </div>
          </div>
          <div className="h-[220px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ bottom: 6, left: -12, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompact(Number(value)).replace("Rp ", "")} />
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#0f1117", border: "1px solid #1e2235", borderRadius: 8 }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#1e2235] text-sm text-muted-foreground">
                Belum ada transaksi di siklus ini.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Ekstraksi Mutasi</h3>
          </div>
          <p className="text-[13px] text-slate-400 mb-4">Import otomatis dari PDF mutasi rekening</p>
          <div className="mt-4 rounded-lg border border-dashed border-[#2a2f45] bg-[#0f1117]/60 p-4">
            <FileText className="mb-3 h-6 w-6 text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">Preview PDF mutasi rekening</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Nanti hasil ekstraksi akan muncul sebagai tabel preview untuk cek tanggal, kategori, nominal, hapus baris, lalu confirm ke data keuangan.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-lg bg-slate-700/60 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
            >
              Belum aktif
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CategoryShareChart
          data={categoryShares.income}
          title="Persentase Kategori Pemasukan"
          tone="income"
        />
        <CategoryShareChart
          data={categoryShares.expense}
          title="Persentase Kategori Pengeluaran"
          tone="expense"
        />
      </div>

      {/* Daily average spending for essential categories */}
      <DailyEssentialCard
        cycleDays={dailyAvgStats.cycleDays}
        makanan={dailyAvgStats.makanan}
        transportasi={dailyAvgStats.transportasi}
        cycleLabel={cycleLabel}
      />

      <section className="rounded-xl border bg-card">
        <div className="space-y-4 border-b p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Riwayat Transaksi</h2>
                <p className="mt-0.5 text-[13px] font-medium text-slate-400">
                  <span className="font-semibold text-slate-200">{visibleTransactions.length} transaksi</span>
                  {" · "}
                  <span>{cycleLabel}</span>
                </p>
              </div>
              {!isCurrentCycle && (
                <span className="hidden sm:inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                  Periode lalu
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer",
                    viewMode === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#0f1117] text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari sumber, kategori, atau catatan"
                className="w-full rounded-lg border border-[#1e2235] bg-[#0f1117] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <div className="flex rounded-lg border border-[#1e2235] bg-[#0f1117] p-1">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTypeFilter(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition cursor-pointer",
                    typeFilter === option.value
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visibleTransactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Belum ada transaksi yang cocok dengan filter ini.
          </div>
        ) : viewMode === "items" ? (
          <ul className="divide-y">
            {visibleTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onDelete={() => setPendingDelete(transaction)}
                onEdit={() => openEditModal(transaction)}
              />
            ))}
          </ul>
        ) : (
          <div className="divide-y">
            {groupedTransactions.map((group) => {
              const isExpanded = expandedKeys.has(group.key)

              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5 cursor-pointer"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", isExpanded && "rotate-180")} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{group.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.transactions.length} transaksi · +{formatCompact(group.income)} · -{formatCompact(group.expense)}
                        </p>
                      </div>
                    </div>
                    <span className={cn("shrink-0 text-sm font-bold", group.surplus >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {group.surplus >= 0 ? "+" : "-"}{formatRupiah(Math.abs(group.surplus))}
                    </span>
                  </button>
                  {isExpanded && renderExpandedGroup({
                    cycle,
                    expandedKeys,
                    group,
                    onDelete: setPendingDelete,
                    onEdit: openEditModal,
                    toggleGroup,
                    viewMode,
                  })}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {showModal && (
        <TransactionFormModal
          categories={categories}
          transaction={editingTransaction}
          userId={userId}
          onClose={() => {
            setShowModal(false)
            setEditingTransaction(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e2235] bg-[#1a1d2e] p-6">
            <h2 className="text-lg font-bold text-white">Hapus Transaksi?</h2>
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-medium text-slate-200">{pendingDelete.title}</span> akan dihapus dari riwayat.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deletingId === pendingDelete.id}
                className="flex-1 rounded-lg border border-[#1e2235] py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete)}
                disabled={deletingId === pendingDelete.id}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === pendingDelete.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DailyEssentialCard({
  cycleDays,
  cycleLabel,
  makanan,
  transportasi,
}: {
  cycleDays: number
  cycleLabel: string
  makanan: number
  transportasi: number
}) {
  const avgMakanan = makanan / cycleDays
  const avgTransportasi = transportasi / cycleDays
  const total = makanan + transportasi
  const hasData = total > 0

  const makananPct = hasData ? (makanan / total) * 100 : 0
  const transportasiPct = hasData ? (transportasi / total) * 100 : 0

  const items = [
    {
      avg: avgMakanan,
      borderColor: "border-amber-500/30",
      color: "bg-amber-500",
      colorBg: "bg-amber-500/10",
      colorText: "text-amber-400",
      colorTextMuted: "text-amber-500/70",
      emoji: "🍽️",
      label: "Makanan",
      pct: makananPct,
      total: makanan,
      width: makananPct,
    },
    {
      avg: avgTransportasi,
      borderColor: "border-sky-500/30",
      color: "bg-sky-500",
      colorBg: "bg-sky-500/10",
      colorText: "text-sky-400",
      colorTextMuted: "text-sky-500/70",
      emoji: "🚌",
      label: "Transportasi",
      pct: transportasiPct,
      total: transportasi,
      width: transportasiPct,
    },
  ]

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Pengeluaran Harian Pokok</h3>
          </div>
          <p className="text-[13px] font-medium text-slate-400">
            Rata-rata per hari ·{" "}
            <span className="font-semibold text-slate-200">{cycleLabel}</span>
            {" "}
            <span className="text-slate-500">({cycleDays} hari)</span>
          </p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Segmented progress bar */}
          <div className="mb-1 flex h-3 overflow-hidden rounded-full bg-[#0f1117]">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${makananPct}%` }}
            />
            <div
              className="h-full bg-sky-500 transition-all duration-500"
              style={{ width: `${transportasiPct}%` }}
            />
          </div>
          <div className="mb-5 flex justify-between text-[11px] text-slate-500">
            <span>🍽️ {makananPct.toFixed(0)}% Makanan</span>
            <span>Transportasi {transportasiPct.toFixed(0)}% 🚌</span>
          </div>

          {/* Two category cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 ${item.colorBg} ${item.borderColor}`}
              >
                {/* Category label */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-bold text-white">{item.label}</span>
                  <span className={`ml-auto text-xs font-semibold ${item.colorText}`}>
                    {item.pct.toFixed(0)}%
                  </span>
                </div>

                {/* Main avg per day */}
                <p className={`text-3xl font-extrabold tracking-tight ${item.colorText}`}>
                  {formatCompact(item.avg)}
                  <span className="ml-1 text-base font-semibold text-slate-400">/hari</span>
                </p>

                {/* Total in cycle */}
                <p className="mt-2 text-[13px] font-medium text-slate-400">
                  Total periode:{" "}
                  <span className="font-bold text-slate-200">{formatCompact(item.total)}</span>
                </p>

                {/* Projections row */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className={`rounded-lg px-2.5 py-2 ${item.colorBg}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Per Minggu</p>
                    <p className={`mt-0.5 text-sm font-bold ${item.colorText}`}>{formatCompact(item.avg * 7)}</p>
                  </div>
                  <div className={`rounded-lg px-2.5 py-2 ${item.colorBg}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Per Bulan</p>
                    <p className={`mt-0.5 text-sm font-bold ${item.colorText}`}>{formatCompact(item.avg * 30)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Combined total row */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#1e2235] bg-[#0f1117] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Kebutuhan Pokok / Hari</p>
              <p className="mt-0.5 text-[13px] text-slate-400">Makanan + Transportasi</p>
            </div>
            <p className="text-xl font-extrabold text-white">{formatCompact(avgMakanan + avgTransportasi)}</p>
          </div>
        </>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#1e2235] text-sm text-muted-foreground">
          Belum ada transaksi kategori Makanan atau Transportasi di periode ini.
        </div>
      )}
    </div>
  )
}

function CategoryShareChart({

  data,
  title,
  tone,
}: {
  data: CategoryShare[]
  title: string
  tone: "expense" | "income"
}) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)
  const icon = tone === "income" ? "📈" : "📉"

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
        </div>
        <p className="text-[13px] font-medium text-slate-400">
          {data.length ? (
            <>
              <span className="font-semibold text-slate-200">{data.length} kategori aktif</span>
              {" · "}
              <span>{formatCompact(total)}</span>
            </>
          ) : (
            "Belum ada kategori dengan nominal"
          )}
        </p>
      </div>
      {data.length ? (
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={2}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#0f1117", border: "1px solid #1e2235", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 self-center">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-[#0f1117]/70 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                  <span className="truncate text-sm font-medium text-slate-200">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold", tone === "income" ? "text-emerald-300" : "text-rose-300")}>{item.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{formatCompact(item.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-[210px] items-center justify-center rounded-lg border border-dashed border-[#1e2235] text-sm text-muted-foreground">
          Tambahkan transaksi berkategori untuk melihat komposisi.
        </div>
      )}
    </div>
  )
}

function FinanceStatCard({
  icon: Icon,
  label,
  sub,
  tone,
  value,
}: {
  icon: LucideIcon
  label: string
  sub: string
  tone: "expense" | "income" | "neutral"
  value: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
        <div
          className={cn(
            "rounded-lg p-2",
            tone === "income" && "bg-emerald-500/15 text-emerald-300",
            tone === "expense" && "bg-rose-500/15 text-rose-300",
            tone === "neutral" && "bg-indigo-500/15 text-indigo-300"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function TransactionRow({
  compact,
  onDelete,
  onEdit,
  transaction,
}: {
  compact?: boolean
  onDelete: () => void
  onEdit: () => void
  transaction: FinanceTransaction
}) {
  const isIncome = transaction.type === "income"

  return (
    <li className={cn("group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/5", compact && "pl-12")}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", isIncome ? "bg-emerald-400" : "bg-rose-400")} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{transaction.title}</p>
          <p className="text-xs text-muted-foreground">
            {transaction.category?.name ?? "Tanpa kategori"} · {formatDateLabel(transaction.transaction_date)}
          </p>
          {transaction.notes && <p className="mt-0.5 truncate text-xs italic text-slate-500">{transaction.notes}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={cn("text-sm font-bold", isIncome ? "text-emerald-400" : "text-rose-400")}>
          {isIncome ? "+" : "-"}{formatRupiah(transaction.amount)}
        </span>
        <div className="flex gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-indigo-500/15 p-2 text-indigo-300 transition hover:bg-indigo-500/30 hover:text-indigo-100 cursor-pointer"
            aria-label="Edit transaksi"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md bg-red-500/15 p-2 text-red-300 transition hover:bg-red-500/30 hover:text-red-100 cursor-pointer"
            aria-label="Hapus transaksi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}

function PeriodRow({
  canExpand,
  group,
  isExpanded,
  onClick,
}: {
  canExpand: boolean
  group: FinanceGroup
  isExpanded?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        {canExpand && <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", isExpanded && "rotate-180")} />}
        {!canExpand && <span className="h-2 w-2 shrink-0 rounded-full bg-slate-500" />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{group.label}</p>
          <p className="text-xs text-muted-foreground">
            {group.transactions.length} transaksi · +{formatCompact(group.income)} · -{formatCompact(group.expense)}
          </p>
        </div>
      </div>
      <span className={cn("shrink-0 text-sm font-bold", group.surplus >= 0 ? "text-emerald-400" : "text-rose-400")}>
        {group.surplus >= 0 ? "+" : "-"}{formatRupiah(Math.abs(group.surplus))}
      </span>
    </>
  )

  if (!canExpand) {
    return <div className="flex items-center justify-between gap-4 px-5 py-3.5 pl-12">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-5 py-3.5 pl-12 text-left transition hover:bg-white/5 cursor-pointer"
    >
      {content}
    </button>
  )
}

function renderExpandedGroup({
  cycle,
  expandedKeys,
  group,
  onDelete,
  onEdit,
  toggleGroup,
  viewMode,
}: {
  cycle: FinanceCycle
  expandedKeys: Set<string>
  group: FinanceGroup
  onDelete: (transaction: FinanceTransaction) => void
  onEdit: (transaction: FinanceTransaction) => void
  toggleGroup: (key: string) => void
  viewMode: FinanceViewMode
}) {
  if (viewMode === "days") {
    return (
      <ul className="border-t bg-[#0f1117]/40">
        {group.transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            compact
            onDelete={() => onDelete(transaction)}
            onEdit={() => onEdit(transaction)}
          />
        ))}
      </ul>
    )
  }

  if (viewMode === "months") {
    const dayGroups = buildGroups(group.transactions, "days", cycle)

    return (
      <div className="border-t bg-[#0f1117]/40">
        {dayGroups.map((dayGroup) => {
          const nestedKey = `${group.key}:day:${dayGroup.key}`
          const isNestedExpanded = expandedKeys.has(nestedKey)

          return (
            <div key={nestedKey} className="border-b border-[#1e2235]/70 last:border-b-0">
              <PeriodRow
                canExpand
                group={dayGroup}
                isExpanded={isNestedExpanded}
                onClick={() => toggleGroup(nestedKey)}
              />
              {isNestedExpanded && (
                <ul className="border-t border-[#1e2235]/70 bg-black/10">
                  {dayGroup.transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      compact
                      onDelete={() => onDelete(transaction)}
                      onEdit={() => onEdit(transaction)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const monthGroups = buildCalendarMonthGroups(group.transactions)

  return (
    <div className="border-t bg-[#0f1117]/40">
      {monthGroups.map((monthGroup) => (
        <PeriodRow key={`${group.key}:month:${monthGroup.key}`} canExpand={false} group={monthGroup} />
      ))}
    </div>
  )
}

function buildGroups(transactions: FinanceTransaction[], viewMode: FinanceViewMode, cycle: FinanceCycle) {
  const groups = new Map<string, FinanceGroup>()

  transactions.forEach((transaction) => {
    const date = parseDate(transaction.transaction_date)
    let key = transaction.transaction_date
    let label = formatDateLabel(transaction.transaction_date)
    let sortValue = transaction.transaction_date

    if (viewMode === "months") {
      const range = getCycleRange(date, cycle)
      key = `${range.start.toISOString()}-${range.end.toISOString()}`
      label = formatCycleLabel(range.start, range.end)
      sortValue = range.start.toISOString()
    }

    if (viewMode === "years") {
      key = `${date.getFullYear()}`
      label = `${date.getFullYear()}`
      sortValue = `${date.getFullYear()}`
    }

    const group = groups.get(key) ?? {
      expense: 0,
      income: 0,
      key,
      label,
      sortValue,
      surplus: 0,
      transactions: [],
    }

    group.transactions.push(transaction)
    if (transaction.type === "income") group.income += transaction.amount
    else group.expense += transaction.amount
    group.surplus = group.income - group.expense
    groups.set(key, group)
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      transactions: sortTransactions(group.transactions),
    }))
    .sort((a, b) => b.sortValue.localeCompare(a.sortValue))
}

function buildCategoryShares(transactions: FinanceTransaction[], type: "expense" | "income") {
  const categoryMap = new Map<string, number>()

  transactions
    .filter((transaction) => transaction.type === type)
    .forEach((transaction) => {
      const category = transaction.category?.name ?? "Tanpa kategori"
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + transaction.amount)
    })

  const total = [...categoryMap.values()].reduce((sum, amount) => sum + amount, 0)
  if (total === 0) return []

  return [...categoryMap.entries()]
    .map(([name, amount]) => ({
      amount,
      name,
      percentage: (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
}

function buildCalendarMonthGroups(transactions: FinanceTransaction[]) {
  const groups = new Map<string, FinanceGroup>()

  transactions.forEach((transaction) => {
    const date = parseDate(transaction.transaction_date)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    const label = date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    const group = groups.get(key) ?? {
      expense: 0,
      income: 0,
      key,
      label,
      sortValue: `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`,
      surplus: 0,
      transactions: [],
    }

    group.transactions.push(transaction)
    if (transaction.type === "income") group.income += transaction.amount
    else group.expense += transaction.amount
    group.surplus = group.income - group.expense
    groups.set(key, group)
  })

  return [...groups.values()].sort((a, b) => b.sortValue.localeCompare(a.sortValue))
}
