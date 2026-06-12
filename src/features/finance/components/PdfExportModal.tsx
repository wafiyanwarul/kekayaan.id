"use client"

import { useState, useMemo } from "react"
import { Download, X, Loader2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FinanceCycle, FinanceTransaction } from "../types"
import { getAvailableCycles } from "../utils"
import { exportCashflowPdf } from "../pdf-export"
import { StyledSelect } from "./StyledSelect"

interface Props {
  transactions: FinanceTransaction[]
  cycle: FinanceCycle
  defaultCycleIndex?: number
}

export function PdfExportModal({ transactions, cycle, defaultCycleIndex = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const availableCycles = useMemo(() => getAvailableCycles(transactions, cycle), [transactions, cycle])

  // Derive available years from cycles
  const availableYears = useMemo(() => {
    const years = [...new Set(availableCycles.map((c) => c.start.getFullYear()))].sort((a, b) => b - a)
    return years
  }, [availableCycles])

  const [selectedYear, setSelectedYear] = useState<number>(
    () => availableCycles[defaultCycleIndex]?.start.getFullYear() ?? new Date().getFullYear()
  )

  // Cycles for the selected year — as StyledSelect options
  const yearCycles = useMemo(
    () => availableCycles.filter((c) => c.start.getFullYear() === selectedYear),
    [availableCycles, selectedYear]
  )

  const [selectedCycleKey, setSelectedCycleKey] = useState<string>(
    () => availableCycles[defaultCycleIndex]?.start.toISOString() ?? ""
  )

  // When year changes, auto-select first cycle of that year
  function handleYearChange(yearStr: string) {
    const year = Number(yearStr)
    setSelectedYear(year)
    const first = availableCycles.find((c) => c.start.getFullYear() === year)
    setSelectedCycleKey(first?.start.toISOString() ?? "")
  }

  const selectedCycle = useMemo(
    () => availableCycles.find((c) => c.start.toISOString() === selectedCycleKey),
    [availableCycles, selectedCycleKey]
  )

  const cycleOptions = useMemo(
    () =>
      yearCycles.map((c, i) => ({
        value: c.start.toISOString(),
        label: `${c.label}${i === 0 && availableCycles[0]?.start.toISOString() === c.start.toISOString() ? " (Aktif)" : ""}`,
      })),
    [yearCycles, availableCycles]
  )

  const yearOptions = useMemo(
    () => availableYears.map((y) => ({ value: String(y), label: String(y) })),
    [availableYears]
  )

  const txCount = useMemo(() => {
    if (!selectedCycle) return 0
    return transactions.filter((t) => {
      const d = new Date(`${t.transaction_date}T00:00:00`)
      return d >= selectedCycle.start && d <= selectedCycle.end
    }).length
  }, [transactions, selectedCycle])

  async function handleExport() {
    if (!selectedCycle) return
    setLoading(true)
    try {
      await exportCashflowPdf(transactions, cycle, selectedCycle.start, selectedCycle.end)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  function openModal() {
    const defYear = availableCycles[defaultCycleIndex]?.start.getFullYear() ?? new Date().getFullYear()
    const defKey = availableCycles[defaultCycleIndex]?.start.toISOString() ?? ""
    setSelectedYear(defYear)
    setSelectedCycleKey(defKey)
    setOpen(true)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={openModal}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/15 hover:text-indigo-200 active:scale-95 duration-200 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        Laporan PDF
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-[400px] rounded-2xl border border-[#1e2235] bg-[#1a1d2e] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e2235] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                  <CalendarDays className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Unduh Laporan Arus Kas</h2>
                  <p className="text-[11px] text-slate-500">Pilih periode sebagai PDF</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Year + Cycle dropdowns stacked */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tahun
                  </label>
                  <StyledSelect
                    value={String(selectedYear)}
                    onChange={handleYearChange}
                    options={yearOptions}
                    maxHeight={160}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Siklus Laporan
                  </label>
                  {cycleOptions.length === 0 ? (
                    <p className="rounded-lg border border-[#1e2235] bg-[#0f1117] px-3 py-2 text-xs text-slate-500">
                      Tidak ada siklus
                    </p>
                  ) : (
                    <StyledSelect
                      value={selectedCycleKey}
                      onChange={setSelectedCycleKey}
                      options={cycleOptions}
                      maxHeight={200}
                    />
                  )}
                </div>
              </div>

              {/* Preview */}
              {selectedCycle && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                    Laporan yang akan diunduh
                  </p>
                  <p className="text-sm font-bold text-white">{selectedCycle.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {txCount} transaksi · Format PDF (A4)
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-[#1e2235] px-5 py-3.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-[#1e2235] py-2 text-sm font-medium text-slate-400 transition hover:border-[#2e3450] hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading || !selectedCycle}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-white transition cursor-pointer shadow-lg shadow-indigo-500/20",
                  "bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Membuat PDF...</>
                ) : (
                  <><Download className="h-4 w-4" />Unduh PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
