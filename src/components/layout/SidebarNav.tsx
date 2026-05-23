"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Wallet, Target, Receipt, Settings } from "lucide-react"

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
        <span className="text-lg font-bold text-primary">kekayaan.id</span>
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
