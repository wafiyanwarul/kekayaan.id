"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCompact } from "@/lib/utils"

interface Props {
  liquid: number
  nonLiquid: number
}

const COLORS = ["#3b82f6", "#f59e0b"]

export function WealthAllocationChart({ liquid, nonLiquid }: Props) {
  const total = liquid + nonLiquid
  const data = total > 0
    ? [
        { name: "Likuid", value: liquid },
        { name: "Non-Likuid", value: nonLiquid },
      ]
    : [{ name: "Belum Ada Aset", value: 1 }]

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Alokasi Aset
      </p>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="47%" innerRadius={58} outerRadius={82} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={total > 0 ? COLORS[i] : "#334155"} />)}
            </Pie>
            {total > 0 && <Tooltip formatter={(v) => formatCompact(Number(v))} />}
            {total > 0 && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 border-t pt-4">
        {[
          { name: "Likuid", value: liquid },
          { name: "Non-Likuid", value: nonLiquid },
        ].map((d, i) => (
          <div key={d.name} className="text-center">
            <p className="text-xs text-muted-foreground">{d.name}</p>
            <p className="text-sm font-semibold" style={{ color: COLORS[i] }}>
              {total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0"}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
