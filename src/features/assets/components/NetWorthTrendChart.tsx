"use client"
import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, CalendarRange } from "lucide-react"
import { formatCompact, formatRupiah } from "@/lib/utils"

interface HistoricalDataPoint {
  label: string
  netWorth: number
  income: number
  expense: number
  surplus: number
  savingsRate: number
  changePercent: number
  startDate: string
  endDate: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#181d30]/95 backdrop-blur-md border border-[#2e3660] p-3.5 rounded-xl shadow-2xl">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
          Siklus: {data.label}
        </p>
        <p className="text-base font-extrabold text-indigo-400">
          {formatRupiah(Number(data.netWorth))}
        </p>
        {data.changePercent !== 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                data.changePercent > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              }`}
            >
              {data.changePercent > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {data.changePercent > 0 ? "+" : ""}
              {data.changePercent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500">vs bulan lalu</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function NetWorthTrendChart() {
  const [selectedMonths, setSelectedMonths] = useState<number>(3)
  const [data, setData] = useState<HistoricalDataPoint[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/history?months=${selectedMonths}`)
        if (!res.ok) throw new Error("Failed to fetch history")
        const json = await res.json()
        if (active && Array.isArray(json)) {
          setData(json)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchData()
    return () => {
      active = false
    }
  }, [selectedMonths])

  const latestPoint = data.length > 0 ? data[data.length - 1] : null
  const currentNetWorth = latestPoint?.netWorth ?? 0
  const currentGrowth = latestPoint?.changePercent ?? 0

  return (
    <div className="rounded-2xl border border-[#1e2440] bg-[#181d30]/40 backdrop-blur-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CalendarRange className="h-3.5 w-3.5 text-indigo-400" />
            Tren Kekayaan Bersih
          </p>
          <div className="flex items-baseline gap-2.5">
            {loading ? (
              <div className="h-8 w-44 bg-slate-800 rounded animate-pulse" />
            ) : (
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {formatRupiah(currentNetWorth)}
              </h3>
            )}
            {!loading && currentGrowth !== 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  currentGrowth > 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {currentGrowth > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {currentGrowth > 0 ? "+" : ""}
                {currentGrowth.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex bg-[#0f1117]/80 p-1 rounded-lg border border-[#1e2440] self-start sm:self-auto">
          {[
            { label: "3B", value: 3 },
            { label: "6B", value: 6 },
            { label: "12B", value: 12 },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedMonths(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                selectedMonths === opt.value
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[280px] w-full flex items-center justify-center">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full h-[220px] bg-slate-800/10 rounded-lg overflow-hidden animate-pulse flex items-end p-2 gap-1">
              {[45, 60, 35, 70, 50, 80, 40, 65, 55, 75, 45, 85].map((h, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-slate-700/20 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ) : data.length === 0 || currentNetWorth === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm font-medium text-slate-400">Belum ada riwayat kekayaan</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Nilai kekayaan Anda akan dicatat otomatis seiring berjalannya waktu saat Anda menambah atau memperbarui nilai aset.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompact(v)}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4f46e5", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorNetWorth)"
                activeDot={{ r: 6, fill: "#818cf8", stroke: "#181d30", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
