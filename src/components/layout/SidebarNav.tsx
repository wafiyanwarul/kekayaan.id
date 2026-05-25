"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"
import { useSidebar } from "@/components/providers/SidebarProvider"
import { cn } from "@/lib/utils"
import {
  Gem,
  LayoutDashboard,
  Receipt,
  Settings,
  Sparkles,
  Target,
  Wallet,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/assets", labelKey: "nav.assets", icon: Wallet },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/finance", labelKey: "nav.finance", icon: Receipt },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const

function NavLinks({
  collapsed,
  onLinkClick,
}: {
  collapsed?: boolean
  onLinkClick?: () => void
}) {
  const pathname = usePathname()
  const { t } = useAppPreferences()

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map(({ href, labelKey, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            title={collapsed ? t(labelKey) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
              collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{t(labelKey)}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

/** Desktop sidebar: collapsible with toggle button integrated in footer */
export function SidebarNav() {
  const { isOpen, toggle } = useSidebar()
  const { t } = useAppPreferences()

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card h-full shrink-0 transition-all duration-300 ease-in-out",
        isOpen ? "w-60" : "w-[64px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-b flex items-center h-[65px] shrink-0",
          isOpen ? "px-5 gap-3" : "px-3 justify-center"
        )}
      >
        {isOpen ? (
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20 shrink-0">
              <Gem className="h-5 w-5" />
            </span>
            <span className="leading-tight min-w-0">
              <span className="block text-lg font-bold text-primary truncate">kekayaan.id</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3 shrink-0" />
                {t("app.tagline")}
              </span>
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            title="kekayaan.id"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20"
          >
            <Gem className="h-5 w-5" />
          </Link>
        )}
      </div>

      {/* Nav links */}
      <NavLinks collapsed={!isOpen} />

      {/* Collapse toggle at bottom */}
      <div className="border-t p-2 shrink-0">
        <button
          type="button"
          onClick={toggle}
          title={isOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer",
            !isOpen && "justify-center"
          )}
        >
          {isOpen ? (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Sembunyikan</span>
            </>
          ) : (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  )
}

/** Mobile sidebar drawer (overlay from left) */
export function MobileSidebarDrawer() {
  const { isMobileOpen, closeMobile } = useSidebar()
  const { t } = useAppPreferences()

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20 shrink-0">
              <Gem className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold text-primary">kekayaan.id</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                {t("app.tagline")}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <NavLinks onLinkClick={closeMobile} />

        {/* Bottom branding */}
        <div className="px-5 py-4 border-t">
          <p className="text-[11px] text-muted-foreground/60 text-center">Personal Wealth OS</p>
        </div>
      </div>
    </>
  )
}
