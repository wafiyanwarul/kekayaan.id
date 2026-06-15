import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000) return `Rp\u00A0${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `Rp\u00A0${(amount / 1_000).toFixed(0)}rb`
  return formatRupiah(amount)
}

