 "use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
  FolderOpen,
  ExternalLink
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Time Tracking", href: "/dashboard/time-tracking", icon: Clock },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "Team Chat", href: "/dashboard/team-chat", icon: MessageSquare },
  { name: "CRM Notes", href: "/dashboard/crm", icon: Users },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:h-full ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-white">
                Dashboard
              </span>
            </div>            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
            {sidebarItems.map((item) => {
              return (
                <a
                  key={item.name}
                  href={item.href}                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-200 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              )
            })}
          </nav>{/* User section */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {session?.user?.name || "User"}
                  </p>                  <p className="text-xs text-slate-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 mb-4"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>

            {/* Footer info for mobile */}
            <div className="md:hidden border-t border-slate-700 pt-4 space-y-2">
              <div className="text-xs text-slate-500 text-center">
                © {new Date().getFullYear()} Konja Rehm
              </div>
              <div className="flex justify-center space-x-4 text-xs">
                <Link 
                  href="/datenschutz" 
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Datenschutz
                </Link>
                <a 
                  href="https://konja-rehm.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-1"
                >
                  <span>Impressum</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="text-xs text-slate-500 text-center mt-2">
                Daten werden nur lokal verarbeitet
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-md shadow-sm border-b border-slate-700 lg:border-l lg:border-slate-700">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-slate-200"
              >
                <Menu className="h-6 w-6" />
              </button>
              <span className="text-sm font-medium text-slate-200">
                Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!
              </span>
            </div>
            
            {/* Footer info moved to header */}
            <div className="hidden md:flex items-center space-x-6 text-xs text-slate-400">
              <span>© {new Date().getFullYear()} Konja Rehm</span>
              <Link 
                href="/datenschutz" 
                className="hover:text-slate-200 transition-colors flex items-center space-x-1"
              >
                <span>Datenschutz</span>
              </Link>
              <a 
                href="https://konja-rehm.de/impressum"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-200 transition-colors flex items-center space-x-1"
              >
                <span>Impressum</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  )
}
