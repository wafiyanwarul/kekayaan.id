import type { Metadata } from "next"
import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kekayaan.id — Personal Wealth OS",
  description: "Pantau kekayaan, pengeluaran, dan tujuan finansialmu.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  )
}
