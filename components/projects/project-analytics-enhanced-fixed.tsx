import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts'
import { BarChart3, Clock, Users, FileText, TrendingUp, Activity, Timer, Calendar, MessageSquare, Target, Zap, CheckCircle, AlertTriangle, Download, Share2, RefreshCw } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, eachDayOfInterval, differenceInDays, isAfter, isBefore } from "date-fns"

interface ProjectAnalyticsProps {
  projectId: string
  project: any
}

interface TimeEntry {
  _id: string
  project: string
  task: string
  startTime: string
  endTime?: string
  duration?: number
}

interface Contact {
  _id: string
  name: string
  projectId?: string
  createdAt: string
  tags: string[]
}

interface Note {
  _id: string
  title: string
  projectId?: string
  category: string
  createdAt: string
}

interface Document {
  _id: string
  title: string
  projectId?: string
  category: string
  fileType: string
  createdAt: string
  size: number
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f']

export function ProjectAnalyticsEnhanced({ projectId, project }: ProjectAnalyticsProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")
  const [compareMode, setCompareMode] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [projectId])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Only owner can see time tracking data
      if (project?.userRole?.canViewTimeTracking) {
        const timeRes = await fetch(`/api/time-entries?project=${encodeURIComponent(project.name)}`)
        if (timeRes.ok) {
          const timeData = await timeRes.json()
          setTimeEntries(timeData)
        }
      }

      // Fetch project-specific data
      const [contactsRes, notesRes, documentsRes] = await Promise.all([
        fetch(`/api/contacts?projectId=${projectId}`),
        fetch(`/api/notes?projectId=${projectId}`),
        fetch(`/api/documents?projectId=${projectId}`)
      ])

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData)
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData)
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        setDocuments(documentsData)
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  const getDateRange = () => {
    const now = new Date()
    switch (timeRange) {
      case "7days":
        return { start: subDays(now, 7), end: now }
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) }
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }

  const getProjectHealthScore = () => {
    // Calculate health score based on activity, completeness, and trends
    const activityScore = Math.min(100, (timeEntries.length + contacts.length + notes.length + documents.length) * 5)
    const completenessScore = project.description ? 20 : 0
    const recentActivityScore = timeEntries.filter(entry => 
      new Date(entry.startTime) > subDays(new Date(), 7)
    ).length * 10

    return Math.min(100, Math.floor((activityScore + completenessScore + recentActivityScore) / 3))
  }

  const getProductivityTrends = () => {
    const { start } = getDateRange()
    const currentPeriodEntries = timeEntries.filter(entry => 
      new Date(entry.startTime) >= start
    )
    
    const previousStart = timeRange === "week" 
      ? startOfWeek(subDays(start, 7))
      : startOfMonth(subDays(start, 30))
    
    const previousPeriodEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= previousStart && entryDate < start
    })

    const current = currentPeriodEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / (1000 * 60 * 60)
    const previous = previousPeriodEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / (1000 * 60 * 60)
    
    const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0

    return {
      current: Math.round(current),
      previous: Math.round(previous),
      trend: Number(trend.toFixed(1)),
      isIncreasing: trend > 0
    }
  }

  const getTimeAnalytics = () => {
    const { start, end } = getDateRange()
    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= start && entryDate <= end
    })

    // Daily data for charts
    const days = eachDayOfInterval({ start, end })
    const dailyData = days.map(day => {
      const dayEntries = filteredEntries.filter(entry => 
        format(new Date(entry.startTime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      )
      
      const totalHours = dayEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0)
      }, 0) / (1000 * 60 * 60)

      return {
        date: format(day, "MMM dd"),
        hours: Number(totalHours.toFixed(2))
      }
    })

    // Task distribution
    const taskData = filteredEntries.reduce((acc, entry) => {
      const task = entry.task
      const hours = (entry.duration || 0) / (1000 * 60 * 60)
      
      if (acc[task]) {
        acc[task] += hours
      } else {
        acc[task] = hours
      }
      
      return acc
    }, {} as Record<string, number>)

    const taskChartData = Object.entries(taskData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([task, hours]) => ({
        task,
        hours: Number(hours.toFixed(2))
      }))

    return {
      dailyData,
      taskChartData,
      totalHours: filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / (1000 * 60 * 60),
      totalSessions: filteredEntries.length
    }
  }

  const getContentAnalytics = () => {
    const { start: startDate, end: endDate } = getDateRange()

    // Recent content
    const recentNotes = notes.filter(note => 
      new Date(note.createdAt) >= startDate
    )
    const recentContacts = contacts.filter(contact => 
      new Date(contact.createdAt) >= startDate
    )
    const recentDocuments = documents.filter(doc => 
      new Date(doc.createdAt) >= startDate
    )

    // Category distributions
    const noteCategories = notes.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const documentTypes = documents.reduce((acc, doc) => {
      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const contactTags = contacts.reduce((acc, contact) => {
      contact.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return {
      totalNotes: notes.length,
      totalContacts: contacts.length,
      totalDocuments: documents.length,
      recentNotes: recentNotes.length,
      recentContacts: recentContacts.length,
      recentDocuments: recentDocuments.length,
      noteCategories: Object.entries(noteCategories).map(([category, count]) => ({ category, count })),
      documentTypes: Object.entries(documentTypes).map(([type, count]) => ({ type, count })),
      contactTags: Object.entries(contactTags).slice(0, 6).map(([tag, count]) => ({ tag, count })),
      totalSize: documents.reduce((sum, doc) => sum + (doc.size || 0), 0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const exportAnalytics = () => {
    const analytics = {
      project: project.name,
      timeRange,
      generatedAt: new Date().toISOString(),
      health: getProjectHealthScore(),
      productivity: getProductivityTrends(),
      content: getContentAnalytics(),
      time: project?.userRole?.canViewTimeTracking ? getTimeAnalytics() : null
    }

    const dataStr = JSON.stringify(analytics, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analytics.json`
    
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const timeAnalytics = getTimeAnalytics()
  const contentAnalytics = getContentAnalytics()
  const healthScore = getProjectHealthScore()
  const productivityTrends = getProductivityTrends()

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-2 xs:p-3 sm:p-4 md:p-6 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto space-y-3 xs:space-y-4 md:space-y-6 lg:space-y-8">
          {/* Loading Header */}
          <div className="relative overflow-hidden">
            <Card className="relative bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <CardHeader className="space-y-6">
                <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse"></div>
                <div className="h-4 w-48 bg-white/10 rounded-lg animate-pulse"></div>
              </CardHeader>
            </Card>
          </div>
          
          {/* Loading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-24 bg-white/10 rounded-lg animate-pulse"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-16 w-16 mx-auto bg-white/10 rounded-full animate-pulse"></div>
                  <div className="h-4 w-24 mx-auto bg-white/10 rounded-lg animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Loading Overview Stats */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-white/10 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Charts */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 md:gap-6 lg:gap-8 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 shadow-2xl">
                <CardHeader className="border-b border-white/10 space-y-4">
                  <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-32 bg-white/10 rounded-lg animate-pulse"></div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-72 bg-white/5 rounded-lg animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-2 xs:p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-3 xs:space-y-4 md:space-y-6 lg:space-y-8">
        {/* Enhanced Header - Mobile Optimized */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 blur-xl"></div>
          <Card className="relative bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
            <CardHeader className="pb-4 xs:pb-6 md:pb-8 px-3 xs:px-4 md:px-6 pt-3 xs:pt-4 md:pt-6">
              <div className="flex flex-col space-y-3 xs:space-y-4">
                <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 md:space-x-4 space-y-2 xs:space-y-0">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl xs:rounded-2xl blur opacity-75"></div>
                    <div className="relative p-2 xs:p-2.5 md:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl xs:rounded-2xl">
                      <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg xs:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Project Analytics Dashboard
                    </CardTitle>
                    <p className="text-gray-400 text-xs xs:text-sm mt-1">
                      Umfassende Analyse für <span className="font-semibold text-white truncate">{project.name}</span>
                    </p>
                  </div>
                </div>
                
                {/* Mobile Actions */}
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3">
                  <div className="flex gap-2 flex-1 xs:flex-initial">
                    <Button
                      onClick={refreshData}
                      disabled={refreshing}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 hover:scale-105 flex-1 xs:flex-initial"
                      size="sm"
                    >
                      <RefreshCw className={`w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="text-xs xs:text-sm">Aktualisieren</span>
                    </Button>
                    
                    <Button
                      onClick={exportAnalytics}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all duration-200 hover:scale-105 shadow-lg flex-1 xs:flex-initial"
                      size="sm"
                    >
                      <Download className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" />
                      <span className="text-xs xs:text-sm">Export</span>
                    </Button>
                  </div>
                  
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-full xs:w-32 md:w-40 bg-white/10 border-white/20 text-white backdrop-blur-sm text-xs xs:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 border-white/20 backdrop-blur-sm">
                      <SelectItem value="7days">Letzte 7 Tage</SelectItem>
                      <SelectItem value="week">Diese Woche</SelectItem>
                      <SelectItem value="month">Dieser Monat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Project Health Dashboard - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xs:gap-4 md:gap-6 animate-in slide-in-from-bottom-4 duration-700">
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
            <CardHeader className="relative pb-2 xs:pb-3 md:pb-4 px-3 xs:px-4 md:px-6 pt-3 xs:pt-4 md:pt-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-green-300 text-sm xs:text-base">
                <div className="p-1.5 xs:p-2 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-colors duration-200">
                  <Target className="w-4 h-4 xs:w-5 xs:h-5" />
                </div>
                <span className="font-semibold">Project Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-3 xs:px-4 md:px-6 pb-3 xs:pb-4 md:pb-6">
              <div className="text-center space-y-3 xs:space-y-4 md:space-y-6">
                <div className="relative">
                  <div className="text-3xl xs:text-4xl md:text-5xl font-bold text-white mb-2 transition-all duration-300 hover:scale-110">{healthScore}%</div>
                  <div className="w-16 xs:w-20 md:w-24 h-1 bg-gray-700/50 rounded-full mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${healthScore}%` }}
                    ></div>
                  </div>
                </div>
                <Progress value={healthScore} className="h-2 xs:h-3 bg-gray-700/50" />
                <div className="flex items-center justify-center space-x-1 xs:space-x-2">
                  {healthScore >= 80 ? (
                    <>
                      <div className="p-1 xs:p-1.5 bg-green-500/20 rounded-full hover:bg-green-500/30 transition-all duration-200 hover:scale-110">
                        <CheckCircle className="w-3 h-3 xs:w-4 xs:h-4 text-green-400" />
                      </div>
                      <span className="text-green-300 font-medium text-xs xs:text-sm">Ausgezeichnet</span>
                    </>
                  ) : healthScore >= 60 ? (
                    <>
                      <div className="p-1 xs:p-1.5 bg-yellow-500/20 rounded-full hover:bg-yellow-500/30 transition-all duration-200 hover:scale-110">
                        <Zap className="w-3 h-3 xs:w-4 xs:h-4 text-yellow-400" />
                      </div>
                      <span className="text-yellow-300 font-medium text-xs xs:text-sm">Gut</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 xs:p-1.5 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-all duration-200 hover:scale-110">
                        <AlertTriangle className="w-3 h-3 xs:w-4 xs:h-4 text-red-400" />
                      </div>
                      <span className="text-red-300 font-medium text-xs xs:text-sm">Verbesserung nötig</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 border border-blue-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
            <CardHeader className="relative pb-2 xs:pb-3 md:pb-4 px-3 xs:px-4 md:px-6 pt-3 xs:pt-4 md:pt-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-blue-300 text-sm xs:text-base">
                <div className="p-1.5 xs:p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors duration-200">
                  <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5" />
                </div>
                <span className="font-semibold">Produktivitätstrend</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-3 xs:px-4 md:px-6 pb-3 xs:pb-4 md:pb-6">
              <div className="text-center space-y-3 xs:space-y-4 md:space-y-6">
                <div className="text-3xl xs:text-4xl font-bold text-white transition-all duration-300 hover:scale-110">{productivityTrends.current}</div>
                <div className="text-xs xs:text-sm text-gray-400">vs {productivityTrends.previous} vorherige Periode</div>
                <div className={`flex items-center justify-center space-x-1 xs:space-x-2 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full transition-all duration-300 hover:scale-105 ${
                  productivityTrends.isIncreasing ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                }`}>
                  <TrendingUp className={`w-3 h-3 xs:w-4 xs:h-4 transition-transform duration-200 ${productivityTrends.isIncreasing ? '' : 'rotate-180'}`} />
                  <span className="font-medium text-xs xs:text-sm">{Math.abs(productivityTrends.trend).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 border border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
            <CardHeader className="relative pb-2 xs:pb-3 md:pb-4 px-3 xs:px-4 md:px-6 pt-3 xs:pt-4 md:pt-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-purple-300 text-sm xs:text-base">
                <div className="p-1.5 xs:p-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors duration-200">
                  <Activity className="w-4 h-4 xs:w-5 xs:h-5" />
                </div>
                <span className="font-semibold">Aktivitätswert</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-3 xs:px-4 md:px-6 pb-3 xs:pb-4 md:pb-6">
              <div className="text-center space-y-3 xs:space-y-4 md:space-y-6">
                <div className="text-3xl xs:text-4xl font-bold text-white transition-all duration-300 hover:scale-110">{contentAnalytics.totalNotes + contentAnalytics.totalDocuments + contentAnalytics.totalContacts}</div>
                <div className="text-xs xs:text-sm text-gray-400">Gesamt Items</div>
                <div className="inline-flex items-center space-x-1 px-2 xs:px-3 py-1 xs:py-1.5 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-all duration-300 hover:scale-105">
                  <span className="text-purple-300 font-medium text-xs xs:text-sm">
                    +{contentAnalytics.recentNotes + contentAnalytics.recentDocuments + contentAnalytics.recentContacts}
                  </span>
                  <span className="text-purple-400 text-xs">diese Periode</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Overview Stats - Mobile Optimized */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 md:gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 xs:pb-2 px-3 xs:px-4 pt-3 xs:pt-4">
              <CardTitle className="text-xs xs:text-sm font-medium text-blue-300">Notizen</CardTitle>
              <div className="p-1.5 xs:p-2 bg-blue-500/20 rounded-lg">
                <FileText className="h-3 h-3 xs:h-4 xs:w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative px-3 xs:px-4 pb-3 xs:pb-4">
              <div className="text-2xl xs:text-3xl font-bold text-white mb-1">{contentAnalytics.totalNotes}</div>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-emerald-400 rounded-full"></div>
                <p className="text-xs text-emerald-400">
                  +{contentAnalytics.recentNotes} diese Periode
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 xs:pb-2 px-3 xs:px-4 pt-3 xs:pt-4">
              <CardTitle className="text-xs xs:text-sm font-medium text-green-300">Kontakte</CardTitle>
              <div className="p-1.5 xs:p-2 bg-green-500/20 rounded-lg">
                <Users className="h-3 h-3 xs:h-4 xs:w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative px-3 xs:px-4 pb-3 xs:pb-4">
              <div className="text-2xl xs:text-3xl font-bold text-white mb-1">{contentAnalytics.totalContacts}</div>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-emerald-400 rounded-full"></div>
                <p className="text-xs text-emerald-400">
                  +{contentAnalytics.recentContacts} diese Periode
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 xs:pb-2 px-3 xs:px-4 pt-3 xs:pt-4">
              <CardTitle className="text-xs xs:text-sm font-medium text-purple-300">Dokumente</CardTitle>
              <div className="p-1.5 xs:p-2 bg-purple-500/20 rounded-lg">
                <FileText className="h-3 h-3 xs:h-4 xs:w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="relative px-3 xs:px-4 pb-3 xs:pb-4">
              <div className="text-2xl xs:text-3xl font-bold text-white mb-1">{contentAnalytics.totalDocuments}</div>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-purple-400 rounded-full"></div>
                <p className="text-xs text-purple-400">
                  {formatFileSize(contentAnalytics.totalSize)} gesamt
                </p>
              </div>
            </CardContent>
          </Card>

          {project?.userRole?.canViewTimeTracking && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 xs:pb-2 px-3 xs:px-4 pt-3 xs:pt-4">
                <CardTitle className="text-xs xs:text-sm font-medium text-orange-300">Zeit erfasst</CardTitle>
                <div className="p-1.5 xs:p-2 bg-orange-500/20 rounded-lg">
                  <Timer className="h-3 h-3 xs:h-4 xs:w-4 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent className="relative px-3 xs:px-4 pb-3 xs:pb-4">
                <div className="text-2xl xs:text-3xl font-bold text-white mb-1">
                  {timeAnalytics.totalHours.toFixed(1)}h
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-orange-400 rounded-full"></div>
                  <p className="text-xs text-orange-400">
                    {timeAnalytics.totalSessions} Sitzungen
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Charts - Mobile Optimized */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 md:gap-6 lg:gap-8 overflow-hidden">
          {/* Activity Timeline */}
          <Card className="relative w-full overflow-hidden bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent"></div>
            <CardHeader className="relative border-b border-white/10 px-3 xs:px-4 md:px-6 py-3 xs:py-4 md:py-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-white text-sm xs:text-base md:text-lg">
                <div className="p-1.5 xs:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Calendar className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
                <span className="font-semibold truncate">Aktivitäts-Zeitverlauf</span>
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs xs:text-sm">Projekt-Aktivität über die Zeit</CardDescription>
            </CardHeader>
            <CardContent className="relative p-2 xs:p-3 md:p-6 w-full overflow-hidden">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} minWidth={300}>
                  <AreaChart data={timeAnalytics.dailyData}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      fill="url(#colorGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Content Distribution */}
          <Card className="relative w-full overflow-hidden bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent"></div>
            <CardHeader className="relative border-b border-white/10 px-3 xs:px-4 md:px-6 py-3 xs:py-4 md:py-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-white text-sm xs:text-base md:text-lg">
                <div className="p-1.5 xs:p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                  <Activity className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-emerald-400" />
                </div>
                <span className="font-semibold truncate">Content-Verteilung</span>
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs xs:text-sm">Aufschlüsselung der Projekt-Inhaltstypen</CardDescription>
            </CardHeader>
            <CardContent className="relative p-2 xs:p-3 md:p-6 w-full overflow-hidden">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} minWidth={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Notizen', value: contentAnalytics.totalNotes, fill: '#3B82F6' },
                        { name: 'Dokumente', value: contentAnalytics.totalDocuments, fill: '#8B5CF6' },
                        { name: 'Kontakte', value: contentAnalytics.totalContacts, fill: '#10B981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="none"
                    >
                      {[{ name: 'Notizen' }, { name: 'Dokumente' }, { name: 'Kontakte' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#8B5CF6', '#10B981'][index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Note Categories */}
          <Card className="relative w-full overflow-hidden bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent"></div>
            <CardHeader className="relative border-b border-white/10 px-3 xs:px-4 md:px-6 py-3 xs:py-4 md:py-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-white text-sm xs:text-base md:text-lg">
                <div className="p-1.5 xs:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <FileText className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
                <span className="font-semibold truncate">Notiz-Kategorien</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-2 xs:p-3 md:p-6 w-full overflow-hidden">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} minWidth={300}>
                  <BarChart data={contentAnalytics.noteCategories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="category" 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Contact Tags */}
          <Card className="relative w-full overflow-hidden bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-transparent"></div>
            <CardHeader className="relative border-b border-white/10 px-3 xs:px-4 md:px-6 py-3 xs:py-4 md:py-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-white text-sm xs:text-base md:text-lg">
                <div className="p-1.5 xs:p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                  <Users className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-green-400" />
                </div>
                <span className="font-semibold truncate">Top Kontakt-Tags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-2 xs:p-3 md:p-6 w-full overflow-hidden">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} minWidth={300}>
                  <BarChart data={contentAnalytics.contactTags}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="tag" 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Tracking (only for owners) - Mobile Optimized */}
        {project?.userRole?.canViewTimeTracking && timeAnalytics.taskChartData.length > 0 && (
          <Card className="relative w-full overflow-hidden bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-transparent"></div>
            <CardHeader className="relative border-b border-white/10 px-3 xs:px-4 md:px-6 py-3 xs:py-4 md:py-6">
              <CardTitle className="flex items-center space-x-2 xs:space-x-3 text-white text-sm xs:text-base md:text-lg">
                <div className="p-1.5 xs:p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                  <Timer className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-orange-400" />
                </div>
                <span className="font-semibold truncate">Zeit-Verteilung nach Aufgaben</span>
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs xs:text-sm">Detaillierte Aufschlüsselung der Zeit nach Aufgaben</CardDescription>
            </CardHeader>
            <CardContent className="relative p-2 xs:p-3 md:p-6 w-full overflow-hidden">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={300} minWidth={400}>
                  <ComposedChart data={timeAnalytics.taskChartData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="task" 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickLine={{ stroke: '#374151' }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}h`, 'Stunden']}
                    />
                    <Bar 
                      dataKey="hours" 
                      fill="url(#barGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
