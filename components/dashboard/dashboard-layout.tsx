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
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 xs:w-72 sm:w-80 md:w-64 transform glass border-r border-slate-800/50 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:h-full lg:w-64 xl:w-72 2xl:w-80 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex h-16 xs:h-18 sm:h-20 lg:h-16 xl:h-18 items-center justify-between px-4 xs:px-5 sm:px-6 lg:px-4 xl:px-6 border-b border-slate-800/50">
            <div className="flex items-center group">
              <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 lg:h-8 lg:w-8 xl:h-9 xl:w-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                <BarChart3 className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-white" />
              </div>
              <span className="ml-2 xs:ml-3 text-lg xs:text-xl sm:text-2xl lg:text-lg xl:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Dashboard
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors p-1 xs:p-1.5 rounded-lg hover:bg-slate-800/50"
            >
              <X className="h-5 w-5 xs:h-6 xs:w-6" />
            </button>
          </div>          {/* Navigation */}
          <nav className="flex-1 px-3 xs:px-4 sm:px-5 lg:px-3 xl:px-4 py-4 xs:py-5 sm:py-6 lg:py-4 xl:py-6 space-y-1 xs:space-y-1.5 sm:space-y-2 lg:space-y-1 xl:space-y-2 overflow-y-auto scrollbar-hide">
            {sidebarItems.map((item) => {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 xs:px-4 sm:px-5 lg:px-3 xl:px-4 py-2.5 xs:py-3 sm:py-3.5 lg:py-2.5 xl:py-3 text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-purple-600 text-white shadow-md transform scale-[0.98]"
                      : "text-slate-200 hover:bg-slate-700 hover:text-white hover:scale-[0.98]"
                  }`}
                >
                  <item.icon className="mr-2 xs:mr-3 sm:mr-4 lg:mr-2 xl:mr-3 h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 lg:h-4 lg:w-4 xl:h-5 xl:w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </a>
              )
            })}
          </nav>          {/* User section */}
          <div className="border-t border-slate-700 p-3 xs:p-4 sm:p-5 lg:p-3 xl:p-4">
            <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-5 lg:mb-3 xl:mb-4">
              <div className="flex items-center min-w-0 flex-1">
                <div className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 lg:h-7 lg:w-7 xl:h-8 xl:w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm font-medium text-white">
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="ml-2 xs:ml-3 min-w-0 flex-1">
                  <p className="text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm font-medium text-white truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs xs:text-xs sm:text-sm lg:text-xs xl:text-xs text-slate-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 mb-3 xs:mb-4 sm:mb-5 lg:mb-3 xl:mb-4 text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm py-2 xs:py-2.5 sm:py-3 lg:py-2 xl:py-2.5"
            >
              <LogOut className="mr-2 xs:mr-3 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
              Sign out
            </Button>

            {/* Footer info for mobile */}
            <div className="md:hidden border-t border-slate-700 pt-3 xs:pt-4 sm:pt-5 space-y-2 xs:space-y-3">
              <div className="text-xs xs:text-sm text-slate-500 text-center">
                © {new Date().getFullYear()} Konja Rehm
              </div>
              <div className="flex justify-center space-x-3 xs:space-x-4 sm:space-x-5 text-xs xs:text-sm">
                <Link 
                  href="/datenschutz" 
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Privacy Policy
                </Link>
                <a 
                  href="https://konja-rehm.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-1"
                >
                  <span>Imprint</span>
                  <ExternalLink className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                </a>
              </div>
              <div className="text-xs xs:text-sm text-slate-500 text-center mt-2">
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
          <div className="flex h-14 xs:h-16 sm:h-18 lg:h-14 xl:h-16 items-center justify-between px-3 xs:px-4 sm:px-6 lg:px-4 xl:px-6">
            <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 lg:space-x-2 xl:space-x-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-slate-200 p-1 xs:p-1.5 sm:p-2 lg:p-0"
              >
                <Menu className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7" />
              </button>
              <span className="text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm font-medium text-slate-200 truncate">
                Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!
              </span>
            </div>
            
            {/* Footer info moved to header */}
            <div className="hidden md:flex lg:hidden xl:flex items-center space-x-4 xs:space-x-5 sm:space-x-6 lg:space-x-4 xl:space-x-6 text-xs xs:text-sm">
              <span className="hidden xl:inline 2xl:inline">© {new Date().getFullYear()} Konja Rehm</span>
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
                <ExternalLink className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              </a>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-4 xl:p-6 2xl:p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  )
}
