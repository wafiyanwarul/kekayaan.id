"use client"
import { usePathname } from "next/navigation"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assets": "Manajemen Aset",
  "/goals": "Goal Planner",
  "/finance": "Keuangan Bulanan",
  "/settings": "Pengaturan",
}

export function TopBar() {
  const pathname = usePathname()
  const base = "/" + pathname.split("/")[1]
  return (
    <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
      <h1 className="text-base font-semibold">{titles[base] ?? "kekayaan.id"}</h1>
      <span className="text-xs text-muted-foreground">
        {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </span>
    </header>
  )
}
