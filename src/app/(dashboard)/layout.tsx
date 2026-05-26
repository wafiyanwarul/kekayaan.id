import { SidebarNav, MobileSidebarDrawer } from "@/components/layout/SidebarNav"
import { TopBar } from "@/components/layout/TopBar"
import { SidebarProvider } from "@/components/providers/SidebarProvider"
import { createClient } from "@/lib/server"
import { MaintenanceListener } from "@/components/settings/MaintenanceListener"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <SidebarNav />

        {/* Mobile drawer + backdrop */}
        <MobileSidebarDrawer />

        {/* Main content area — expands when sidebar is collapsed */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <MaintenanceListener userId={user?.id || null} />
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

