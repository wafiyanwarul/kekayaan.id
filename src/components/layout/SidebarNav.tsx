"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Gem, LayoutDashboard, Receipt, Settings, Sparkles, Target, Wallet } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Aset", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/finance", label: "Keuangan", icon: Receipt },
  { href: "/settings", label: "Pengaturan", icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-60 border-r bg-card h-full">
      <div className="px-6 py-5 border-b">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Gem className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold text-primary">kekayaan.id</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              wealth cockpit
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
