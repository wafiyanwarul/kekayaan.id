import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kekayaan.id"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: ["/dashboard", "/assets", "/finance", "/goals", "/settings", "/auth/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
