"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCompact } from "@/lib/utils"

interface Props {
  liquid: number
  nonLiquid: number
}

const COLORS = ["#3b82f6", "#f59e0b"]

export function WealthAllocationChart({ liquid, nonLiquid }: Props) {
  const data = [
    { name: "Likuid", value: liquid },
    { name: "Non-Likuid", value: nonLiquid },
  ]
  const total = liquid + nonLiquid

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Alokasi Aset
      </p>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v) => formatCompact(Number(v))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="text-center">
            <p className="text-xs text-muted-foreground">{d.name}</p>
            <p className="text-sm font-semibold" style={{ color: COLORS[i] }}>
              {((d.value / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
