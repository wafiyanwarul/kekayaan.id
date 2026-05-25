import type { Metadata } from "next"
import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider"
import "./globals.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kekayaan.id"
const APP_NAME = "kekayaan.id"
const APP_DESCRIPTION =
  "Pantau total kekayaan, pengeluaran harian, dan tujuan finansialmu dalam satu dashboard pribadi yang cerdas."

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Personal Wealth OS`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "personal finance",
    "wealth tracker",
    "expense tracker",
    "keuangan pribadi",
    "pencatat kekayaan",
    "investasi",
    "tabungan",
    "laporan keuangan",
  ],
  authors: [{ name: "Wafiy Anwarul Hikam" }],
  creator: "Wafiy Anwarul Hikam",
  publisher: APP_NAME,
  robots: {
    index: false,       // Private app — do not index
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Personal Wealth OS`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Personal Wealth OS`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Personal Wealth OS`,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
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
