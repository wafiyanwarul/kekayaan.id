"use client"

import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectOption {
  value: string
  label: string
}

interface SelectGroup {
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
}

/**
 * Styled select wrapper that renders a native <select> with a custom
 * chevron icon, hover/focus ring, and proper cursor-pointer.
 * Supports flat options or option groups.
 */
export function StyledSelect({
  value,
  onChange,
  options,
  groups,
  placeholder,
  className,
  id,
  required,
}: Props) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-lg border border-[#1e2235] bg-[#0f1117]",
          "pl-4 pr-10 py-2.5 text-sm text-white",
          "transition cursor-pointer",
          "hover:border-indigo-500/60",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          "[&>option]:bg-[#1a1d2e] [&>option]:text-white",
          "[&>optgroup]:bg-[#1a1d2e] [&>optgroup]:text-slate-400"
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}

        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Custom arrow icon — positioned to not overlap content */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  )
}
