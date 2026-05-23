import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kekayaan.id — Personal Wealth OS",
  description: "Pantau kekayaan, pengeluaran, dan tujuan finansialmu.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
