"use client"
import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts"
import { ArrowUpDown } from "lucide-react"
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
      <div className="bg-[#181d30]/95 backdrop-blur-md border border-[#2e3660] p-3.5 rounded-xl shadow-2xl space-y-2">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          Siklus: {data.label}
        </p>
        <div className="space-y-1.5 border-t border-[#2e3660]/60 pt-2 text-xs">
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 font-medium">Pemasukan:</span>
            <span className="text-emerald-400 font-bold">{formatRupiah(data.income)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 font-medium">Pengeluaran:</span>
            <span className="text-rose-400 font-bold">{formatRupiah(data.expense)}</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-slate-700/50 pt-1.5">
            <span className="text-slate-300 font-medium">Surplus:</span>
            <span className={`font-bold ${data.surplus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {data.surplus >= 0 ? "+" : ""}
              {formatRupiah(data.surplus)}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-300 font-medium">Savings Rate:</span>
            <span className="text-indigo-400 font-bold">{data.savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function CashFlowBarChart() {
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

  return (
    <div className="rounded-2xl border border-[#1e2440] bg-[#181d30]/40 backdrop-blur-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400" />
            Arus Kas Bulanan (Cash Flow)
          </p>
          <h3 className="text-base font-bold text-white">
            Perbandingan Pemasukan & Pengeluaran
          </h3>
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
              {[55, 40, 70, 35, 65, 45, 80, 50, 60, 75, 40, 65].map((h, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-slate-700/20 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm font-medium text-slate-400">Belum ada riwayat transaksi</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Catatan cash flow akan muncul setelah Anda menginput transaksi pemasukan atau pengeluaran.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2440/40" vertical={false} />
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingBottom: 10 }} />
              <Bar
                name="Pemasukan"
                dataKey="income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="Pengeluaran"
                dataKey="expense"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
