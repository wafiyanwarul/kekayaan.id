"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  value: string          // YYYY-MM-DD
  onChange: (value: string) => void
  required?: boolean
  id?: string
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function parseYMD(ymd: string): { y: number; m: number; d: number } | null {
  if (!ymd) return null
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return null
  return { y, m, d }
}

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

function firstDayOfMonth(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay()
}

export function DatePicker({ value, onChange, required, id }: Props) {
  const parsed = parseYMD(value)
  const today = new Date()

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? today.getMonth() + 1)

  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.y)
      setViewMonth(parsed.m)
    }
  }, [value])

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(day: number) {
    onChange(toYMD(viewYear, viewMonth, day))
    setOpen(false)
  }

  function goToday() {
    const t = new Date()
    const y = t.getFullYear(), m = t.getMonth() + 1, d = t.getDate()
    setViewYear(y); setViewMonth(m)
    onChange(toYMD(y, m, d))
    setOpen(false)
  }

  function clear() {
    onChange("")
    setOpen(false)
  }

  // Build calendar grid
  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay = firstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad to full 6-row grid
  while (cells.length % 7 !== 0) cells.push(null)

  // Display value
  const displayText = parsed
    ? `${String(parsed.d).padStart(2, "0")}/${String(parsed.m).padStart(2, "0")}/${parsed.y}`
    : "Pilih tanggal"

  const isToday = (d: number) => {
    return d === today.getDate() && viewMonth === today.getMonth() + 1 && viewYear === today.getFullYear()
  }
  const isSelected = (d: number) => {
    return parsed?.d === d && parsed?.m === viewMonth && parsed?.y === viewYear
  }

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "group flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500",
          open
            ? "border-indigo-500 bg-[#0f1117] ring-2 ring-indigo-500"
            : "border-[#1e2235] bg-[#0f1117] hover:border-indigo-500/60"
        )}
      >
        <span className={parsed ? "text-white" : "text-slate-500"}>
          {displayText}
        </span>
        <Calendar
          className={cn(
            "h-4 w-4 shrink-0 transition",
            open ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"
          )}
        />
      </button>

      {/* Hidden real input for form validation */}
      <input
        type="hidden"
        value={value}
        required={required}
      />

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[60] w-72 rounded-xl border border-[#2a2f45] bg-[#12151f] p-3 shadow-2xl shadow-black/60">
          {/* Month / year nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-semibold text-white">
              {MONTHS[viewMonth - 1]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map(d => (
              <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const selected = isSelected(day)
              const todayMark = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-sm font-medium transition cursor-pointer",
                    selected
                      ? "bg-indigo-600 text-white"
                      : todayMark
                      ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/50"
                      : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-[#1e2235] pt-3">
            {!required && (
              <button
                type="button"
                onClick={clear}
                className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-rose-400 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Hapus
              </button>
            )}
            <button
              type="button"
              onClick={goToday}
              className="ml-auto rounded-lg bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-400 transition hover:bg-indigo-500/25 hover:text-indigo-300 cursor-pointer"
            >
              Hari ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
