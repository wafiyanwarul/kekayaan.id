"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function MobileNativeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    async function initNativePlugins() {
      // Dynamically import Capacitor core to prevent compilation errors during Vercel dynamic builds
      const { Capacitor } = await import("@capacitor/core")
      
      if (!Capacitor.isNativePlatform()) {
        return
      }

      try {
        // Initialize native Status Bar style to match premium dark/light themes
        const { StatusBar, Style } = await import("@capacitor/status-bar")
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: "#0f1117" })
        console.log("Capacitor Status Bar configured.")
      } catch (e) {
        console.error("Failed to initialize StatusBar plugin:", e)
      }

      try {
        // Handle incoming deep links (e.g. email verification, Google OAuth, reset password recovery links)
        const { App } = await import("@capacitor/app")
        App.addListener("appUrlOpen", (data) => {
          console.log("App opened with deep link URL:", data.url)
          
          try {
            // Support formats like "com.kekayaan.app://auth/callback?..." or "kekayaan://dashboard"
            const urlString = data.url.replace("com.kekayaan.app://", "http://localhost/").replace("kekayaan://", "http://localhost/")
            const parsedUrl = new URL(urlString)
            const relativePath = parsedUrl.pathname + parsedUrl.search
            
            console.log("Redirecting deep link to internal route:", relativePath)
            router.push(relativePath)
          } catch (urlError) {
            console.error("Error parsing deep link URL:", urlError)
          }
        })
        console.log("Capacitor App deep link listener configured.")
      } catch (e) {
        console.error("Failed to initialize App deep link listener:", e)
      }
    }

    initNativePlugins()
  }, [router])

  return <>{children}</>
}
