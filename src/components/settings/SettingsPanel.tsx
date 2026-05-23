"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CloudCog, ShieldCheck, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const MAINTENANCE_KEY = "kekayaan-id-maintenance-mode"
const UPGRADE_KEY = "kekayaan-id-upgrading-system"

export function SettingsPanel() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [upgradingSystem, setUpgradingSystem] = useState(false)

  useEffect(() => {
    setMaintenanceMode(localStorage.getItem(MAINTENANCE_KEY) === "true")
    setUpgradingSystem(localStorage.getItem(UPGRADE_KEY) === "true")
  }, [])

  function toggleMaintenance(value: boolean) {
    setMaintenanceMode(value)
    localStorage.setItem(MAINTENANCE_KEY, String(value))
  }

  function toggleUpgrade(value: boolean) {
    setUpgradingSystem(value)
    localStorage.setItem(UPGRADE_KEY, String(value))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">System settings</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Operational Control Center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              These controls are prepared for future deployment and server orchestration workflows.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <CloudCog className="h-7 w-7" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingToggleCard
          checked={maintenanceMode}
          description="Prepare a future SaaS-wide maintenance gate so deployments, migrations, and urgent fixes can happen with clearer user messaging."
          icon={Wrench}
          label="Maintenance Mode"
          onChange={toggleMaintenance}
          statusText={maintenanceMode ? "Maintenance mode prepared" : "Application is available"}
          tone="warning"
        />
        <SettingToggleCard
          checked={upgradingSystem}
          description="Mark the app as undergoing an upgrade. In the future, this can integrate with deployment pipelines and server-side release guards."
          icon={ShieldCheck}
          label="Upgrading System"
          onChange={toggleUpgrade}
          statusText={upgradingSystem ? "Upgrade flow prepared" : "No upgrade in progress"}
          tone="info"
        />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/15 p-2 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Integration note</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Current toggles are local UI controls. The next implementation step is wiring them to a persistent settings table, then enforcing the state in Proxy/server middleware and deployment hooks.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function SettingToggleCard({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
  statusText,
  tone,
}: {
  checked: boolean
  description: string
  icon: typeof Wrench
  label: string
  onChange: (value: boolean) => void
  statusText: string
  tone: "info" | "warning"
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "rounded-lg p-2",
            tone === "warning" ? "bg-amber-500/15 text-amber-300" : "bg-indigo-500/15 text-indigo-300"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative h-7 w-14 shrink-0 rounded-full border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-background",
            checked ? "border-emerald-400 bg-emerald-600" : "border-slate-500 bg-slate-700"
          )}
        >
          <span className={cn(
            "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-7" : "translate-x-0"
          )} />
        </button>
      </div>
      <div className={cn(
        "mt-5 rounded-lg border px-3 py-2 text-sm font-medium",
        checked ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-[#1e2235] bg-[#0f1117] text-slate-400"
      )}>
        {statusText}
      </div>
    </div>
  )
}
