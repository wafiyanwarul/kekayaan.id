"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Target,
  Wallet,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/assets", labelKey: "nav.assets", icon: Wallet },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/finance", labelKey: "nav.finance", icon: Receipt },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useAppPreferences()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border flex justify-around items-center py-2 px-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-2xl">
      {navItems.map(({ href, labelKey, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 text-center transition-all duration-200 active:scale-90",
              isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-1 rounded-xl transition-colors duration-200",
              isActive && "bg-primary/10"
            )}>
              <Icon className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] tracking-tight">{t(labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
