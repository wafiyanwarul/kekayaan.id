"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Download, X, Loader2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FinanceCycle, FinanceTransaction } from "../types"
import { getAvailableCycles } from "../utils"
import { exportCashflowPdf } from "../pdf-export"

interface Props {
  transactions: FinanceTransaction[]
  cycle: FinanceCycle
  defaultCycleIndex?: number
}

export function PdfExportModal({ transactions, cycle, defaultCycleIndex = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(defaultCycleIndex)
  const [dropdownYear, setDropdownYear] = useState(() => new Date().getFullYear())
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  const availableCycles = useMemo(() => getAvailableCycles(transactions, cycle), [transactions, cycle])
  const availableYears = useMemo(() => {
    const years = new Set(availableCycles.map((c) => c.start.getFullYear()))
    return [...years].sort((a, b) => b - a)
  }, [availableCycles])
  const yearCycles = useMemo(
    () => availableCycles.filter((c) => c.start.getFullYear() === dropdownYear),
    [availableCycles, dropdownYear]
  )
  const selectedCycle = availableCycles[selectedIndex] ?? availableCycles[0]

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

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setSelectedIndex(defaultCycleIndex)
          setDropdownYear(
            (availableCycles[defaultCycleIndex] ?? availableCycles[0])?.start.getFullYear() ??
              new Date().getFullYear()
          )
          setOpen(true)
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-[#1e2235] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white cursor-pointer"
      >
        <Download className="h-4 w-4" />
        Laporan PDF
      </button>

      {/* Modal backdrop + panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#1e2235] bg-[#1a1d2e] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#1e2235] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                  <CalendarDays className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Unduh Laporan Arus Kas</h2>
                  <p className="text-[11px] text-slate-500">Pilih periode yang ingin diunduh sebagai PDF</p>
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
            <div className="px-6 py-5 space-y-5">
              {/* Year selector */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Pilih Tahun</p>
                <div className="flex gap-2 flex-wrap">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setDropdownYear(year)
                        // Auto-select first cycle of that year
                        const firstIdx = availableCycles.findIndex((c) => c.start.getFullYear() === year)
                        if (firstIdx !== -1) setSelectedIndex(firstIdx)
                      }}
                      className={cn(
                        "flex-1 min-w-[64px] rounded-lg px-4 py-2.5 text-sm font-semibold transition cursor-pointer border",
                        dropdownYear === year
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "border-[#1e2235] bg-[#0f1117] text-slate-400 hover:border-indigo-500/40 hover:text-white"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle list for selected year */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pilih Siklus {dropdownYear}
                </p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {yearCycles.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">Tidak ada siklus di tahun ini.</p>
                  ) : (
                    yearCycles.map((c) => {
                      const idx = availableCycles.findIndex(
                        (ac) => ac.start.toISOString() === c.start.toISOString()
                      )
                      const isSelected = idx === selectedIndex
                      const isCurrent = idx === 0
                      return (
                        <button
                          key={c.start.toISOString()}
                          type="button"
                          onClick={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition cursor-pointer",
                            isSelected
                              ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                              : "border-[#1e2235] bg-[#0f1117] text-slate-400 hover:border-[#2e3450] hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="font-medium">{c.label}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            {isCurrent && (
                              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                                Aktif
                              </span>
                            )}
                            {isSelected && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Selected period preview */}
              {selectedCycle && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    Laporan yang akan diunduh
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{selectedCycle.label}</p>
                  <p className="mt-0.5 text-[12px] text-slate-400">
                    {transactions.filter(
                      (t) => {
                        const d = new Date(`${t.transaction_date}T00:00:00`)
                        return d >= selectedCycle.start && d <= selectedCycle.end
                      }
                    ).length}{" "}
                    transaksi · Format PDF (A4)
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 border-t border-[#1e2235] px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-[#1e2235] py-2.5 text-sm font-medium text-slate-400 transition hover:border-[#2e3450] hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading || !selectedCycle}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Unduh PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
