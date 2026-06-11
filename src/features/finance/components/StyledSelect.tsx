"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface Props {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
  groups?: SelectGroup[]
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
  /** Max height of the dropdown panel in px. Default 220. */
  maxHeight?: number
}

/**
 * Fully custom dropdown — NOT a native <select>.
 * Gives us 100% control over the dropdown panel size and appearance.
 * Supports flat option lists or grouped option lists.
 */
export function StyledSelect({
  value,
  onChange,
  options,
  groups,
  placeholder = "Pilih...",
  className,
  id,
  required,
  maxHeight = 220,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Flatten all options for label lookup
  const allOptions: SelectOption[] = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? [])

  const selectedLabel =
    allOptions.find((o) => o.value === value)?.label ?? placeholder

  const hasValue = Boolean(value)

  // Close on outside click / Escape
  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open, handleOutside])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  function select(val: string) {
    onChange(val)
    setOpen(false)
  }

  // Hidden input for form required validation
  return (
    <div ref={containerRef} className={cn("relative w-full", className)} id={id}>
      {/* Hidden real input for form validation */}
      <input type="hidden" value={value} required={required} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500",
          open
            ? "border-indigo-500 bg-[#0f1117] ring-2 ring-indigo-500"
            : "border-[#1e2235] bg-[#0f1117] hover:border-indigo-500/60"
        )}
      >
        <span className={cn("truncate min-w-0", hasValue ? "text-white" : "text-slate-500")}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open ? "rotate-180 text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"
          )}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-[70] w-full rounded-xl border border-[#2a2f45] bg-[#12151f] py-1 shadow-2xl shadow-black/60 overflow-y-auto"
          style={{ maxHeight }}
        >
          {/* Flat options */}
          {options?.map((opt) => (
            <OptionItem
              key={opt.value}
              option={opt}
              isSelected={opt.value === value}
              onSelect={select}
            />
          ))}

          {/* Grouped options */}
          {groups?.map((group, gi) => (
            <div key={gi}>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group.label}
                </span>
              </div>
              {group.options.map((opt) => (
                <OptionItem
                  key={opt.value}
                  option={opt}
                  isSelected={opt.value === value}
                  onSelect={select}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OptionItem({
  option,
  isSelected,
  onSelect,
}: {
  option: SelectOption
  isSelected: boolean
  onSelect: (value: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition cursor-pointer",
        isSelected
          ? "bg-indigo-500/15 text-indigo-300"
          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <span className="truncate">{option.label}</span>
      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-400" />}
    </button>
  )
}
