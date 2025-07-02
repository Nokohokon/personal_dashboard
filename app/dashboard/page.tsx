"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Users, FileText, TrendingUp, Activity, Plus, ArrowRight, MessageSquare } from "lucide-react"
import { format } from "date-fns"

interface DashboardStats {
  todayHours: number
  totalContacts: number
  totalNotes: number
  activeTimer: any
  recentTimeEntries: any[]
  recentContacts: any[]
  recentNotes: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    todayHours: 0,
    totalContacts: 0,
    totalNotes: 0,
    activeTimer: null,
    recentTimeEntries: [],
    recentContacts: [],
    recentNotes: []
  })
  const [isLoading, setIsLoading] = useState(true)

  console.log("🏠 Dashboard - Session Status:", { status, session, email: session?.user?.email })

  useEffect(() => {
    console.log("🏠 Dashboard - useEffect triggered with status:", status)
    
    if (status === "unauthenticated") {
      console.log("🚫 Dashboard - Not authenticated, redirecting to signin")
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      console.log("✅ Dashboard - Authenticated, user:", session?.user?.email)
    } else if (status === "loading") {
      console.log("⏳ Dashboard - Session loading...")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const [timeRes, contactsRes, notesRes] = await Promise.all([
        fetch("/api/time-entries"),
        fetch("/api/contacts"),
        fetch("/api/notes")
      ])

      let timeEntries = []
      let contacts = []
      let notes = []

      if (timeRes.ok) {
        timeEntries = await timeRes.json()
      }

      if (contactsRes.ok) {
        contacts = await contactsRes.json()
      }

      if (notesRes.ok) {
        notes = await notesRes.json()
      }

      // Calculate today's hours
      const today = new Date().toDateString()
      const todayEntries = timeEntries.filter((entry: any) => {
        return new Date(entry.startTime).toDateString() === today && entry.duration
      })
      const todayHours = todayEntries.reduce((sum: number, entry: any) => {
        return sum + (entry.duration || 0)
      }, 0) / (1000 * 60 * 60)

      // Find active timer
      const activeTimer = timeEntries.find((entry: any) => entry.isActive)

      setStats({
        todayHours: Number(todayHours.toFixed(1)),
        totalContacts: contacts.length,
        totalNotes: notes.length,
        activeTimer,
        recentTimeEntries: timeEntries.slice(0, 5),
        recentContacts: contacts.slice(0, 3),
        recentNotes: notes.slice(0, 3)
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Will redirect
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-6 xl:space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 xs:p-5 sm:p-6 md:p-7 lg:p-6 xl:p-8 text-white">
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-2 xs:mb-3 sm:mb-4">
            Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-purple-100 text-sm xs:text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl">
            Here's what's happening with your productivity today.
          </p>
          {stats.activeTimer && (
            <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 lg:mt-5 xl:mt-6 bg-white/20 rounded-lg p-3 xs:p-4 sm:p-5 md:p-6 lg:p-5 xl:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-base xl:text-lg text-purple-100">Currently tracking</p>
                  <p className="font-semibold text-sm xs:text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl truncate">{stats.activeTimer.project} - {stats.activeTimer.task}</p>
                </div>
                <div className="text-right ml-3 xs:ml-4 sm:ml-5 flex-shrink-0">
                  <Clock className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-green-300 mb-1 xs:mb-1.5 sm:mb-2 mx-auto" />
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">Active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
          <Card className="hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base md:text-sm font-medium">Hours Today</CardTitle>
              <Clock className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-4 md:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-xl lg:text-2xl font-bold">{stats.todayHours}h</div>
              <p className="text-xs xs:text-sm text-slate-400">
                {stats.activeTimer ? "Timer active" : "No active timer"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base md:text-sm font-medium">Contacts</CardTitle>
              <Users className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-4 md:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-xl lg:text-2xl font-bold">{stats.totalContacts}</div>
              <p className="text-xs xs:text-sm text-slate-400">
                CRM entries
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base md:text-sm font-medium">Notes</CardTitle>
              <FileText className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-4 md:w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-xl lg:text-2xl font-bold">{stats.totalNotes}</div>
              <p className="text-xs xs:text-sm text-slate-400">
                Total notes
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base md:text-sm font-medium">Sessions</CardTitle>
              <TrendingUp className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-4 md:w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-xl lg:text-2xl font-bold">{stats.recentTimeEntries.length}</div>
              <p className="text-xs xs:text-sm text-slate-400">
                Time entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base xs:text-lg sm:text-xl lg:text-base xl:text-lg">
                Recent Activity
                <Activity className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-slate-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 xs:space-y-4 sm:space-y-5">
                {stats.recentTimeEntries.length === 0 && stats.recentContacts.length === 0 && stats.recentNotes.length === 0 ? (
                  <p className="text-center text-slate-400 py-3 xs:py-4 sm:py-6 text-sm xs:text-base">
                    No recent activity. Start tracking time or add content!
                  </p>
                ) : (
                  <>
                    {stats.recentTimeEntries.slice(0, 2).map((entry: any) => (
                      <div key={entry._id} className="flex items-center">
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <p className="ml-3 text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm text-slate-400 min-w-0 flex-1 truncate">
                          {entry.isActive ? "Started" : "Completed"} "{entry.project} - {entry.task}"
                        </p>
                        <span className="ml-auto text-xs xs:text-sm lg:text-xs xl:text-sm text-slate-500 flex-shrink-0">
                          {format(new Date(entry.startTime), "HH:mm")}
                        </span>
                      </div>
                    ))}
                    {stats.recentContacts.slice(0, 1).map((contact: any) => (
                      <div key={contact._id} className="flex items-center">
                        <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <p className="ml-3 text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm text-slate-400 min-w-0 flex-1 truncate">
                          Added contact "{contact.name}"
                        </p>
                        <span className="ml-auto text-xs xs:text-sm lg:text-xs xl:text-sm text-slate-500 flex-shrink-0">
                          {format(new Date(contact.createdAt), "MMM dd")}
                        </span>
                      </div>
                    ))}
                    {stats.recentNotes.slice(0, 1).map((note: any) => (
                      <div key={note._id} className="flex items-center">
                        <div className="h-2 w-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <p className="ml-3 text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm text-slate-400 min-w-0 flex-1 truncate">
                          Created note "{note.title}"
                        </p>
                        <span className="ml-auto text-xs xs:text-sm lg:text-xs xl:text-sm text-slate-500 flex-shrink-0">
                          {format(new Date(note.createdAt), "MMM dd")}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-base xl:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                <Button 
                  asChild 
                  className="w-full justify-between text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm py-2 xs:py-2.5 sm:py-3" 
                  variant="outline"
                >
                  <Link href="/dashboard/time-tracking">
                    <span className="flex items-center">
                      <Clock className="mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                      {stats.activeTimer ? "View Active Timer" : "Start Time Tracking"}
                    </span>
                    <ArrowRight className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  className="w-full justify-between text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm py-2 xs:py-2.5 sm:py-3" 
                  variant="outline"
                >
                  <Link href="/dashboard/crm?tab=contacts&action=add">
                    <span className="flex items-center">
                      <Users className="mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                      Add New Contact
                    </span>
                    <ArrowRight className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  className="w-full justify-between text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm py-2 xs:py-2.5 sm:py-3" 
                  variant="outline"
                >
                  <Link href="/dashboard/crm?tab=notes&action=add">
                    <span className="flex items-center">
                      <FileText className="mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                      Create New Note
                    </span>
                    <ArrowRight className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                  </Link>
                </Button>

                <Button 
                  asChild 
                  className="w-full justify-between text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm py-2 xs:py-2.5 sm:py-3" 
                  variant="outline"
                >
                  <Link href="/dashboard/team-chat">
                    <span className="flex items-center">
                      <MessageSquare className="mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                      Team Chat
                    </span>
                    <ArrowRight className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                  </Link>
                </Button>

                <Button 
                  asChild 
                  className="w-full justify-between text-xs xs:text-sm sm:text-base lg:text-xs xl:text-sm py-2 xs:py-2.5 sm:py-3" 
                  variant="outline"
                >
                  <Link href="/dashboard/analytics">
                    <span className="flex items-center">
                      <TrendingUp className="mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                      View Analytics
                    </span>
                    <ArrowRight className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
          {/* Recent Time Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-base xl:text-lg">Recent Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 xs:space-y-4">
                {stats.recentTimeEntries.slice(0, 3).length === 0 ? (
                  <p className="text-sm xs:text-base text-slate-400 text-center py-4 xs:py-5 sm:py-6">
                    No time entries yet
                  </p>
                ) : (
                  stats.recentTimeEntries.slice(0, 3).map((entry: any) => (
                    <div key={entry._id} className="p-3 xs:p-4 bg-slate-800 rounded-lg">
                      <p className="font-medium text-sm xs:text-base">{entry.project}</p>
                      <p className="text-xs xs:text-sm text-slate-400">{entry.task}</p>
                      <p className="text-xs xs:text-sm text-slate-500">
                        {entry.duration ? formatDuration(entry.duration) : "Active"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-base xl:text-lg">Recent Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 xs:space-y-4">
                {stats.recentContacts.length === 0 ? (
                  <p className="text-sm xs:text-base text-slate-400 text-center py-4 xs:py-5 sm:py-6">
                    No contacts yet
                  </p>
                ) : (
                  stats.recentContacts.map((contact: any) => (
                    <div key={contact._id} className="p-3 xs:p-4 bg-slate-800 rounded-lg">
                      <p className="font-medium text-sm xs:text-base">{contact.name}</p>
                      <p className="text-xs xs:text-sm text-slate-400">{contact.email}</p>
                      {contact.company && (
                        <p className="text-xs xs:text-sm text-slate-500">{contact.company}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-base xl:text-lg">Recent Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 xs:space-y-4">
                {stats.recentNotes.length === 0 ? (
                  <p className="text-sm xs:text-base text-slate-400 text-center py-4 xs:py-5 sm:py-6">
                    No notes yet
                  </p>
                ) : (
                  stats.recentNotes.map((note: any) => (
                    <div key={note._id} className="p-3 xs:p-4 bg-slate-800 rounded-lg">
                      <p className="font-medium text-sm xs:text-base">{note.title}</p>
                      <p className="text-xs xs:text-sm text-slate-400 line-clamp-2">
                        {note.content}
                      </p>
                      <span className="inline-block px-2 py-1 bg-purple-900/20 text-purple-300 text-xs xs:text-sm rounded-full mt-2">
                        {note.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
