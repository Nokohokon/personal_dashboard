"use client"

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

export function ProjectAnalytics({ projectId, project }: ProjectAnalyticsProps) {
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

  const getProjectHealthScore = () => {
    const deadline = project.endDate ? new Date(project.endDate) : null
    const progress = project.progress || 0
    const daysRemaining = deadline ? differenceInDays(deadline, new Date()) : null
    
    let healthScore = 85 // Base score
    
    // Progress vs time remaining
    if (deadline && daysRemaining !== null) {
      const totalDays = differenceInDays(deadline, new Date(project.startDate))
      const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100
      const progressDiff = progress - expectedProgress
      
      if (progressDiff < -20) healthScore -= 30
      else if (progressDiff < -10) healthScore -= 15
      else if (progressDiff > 10) healthScore += 10
    }
    
    // Team activity
    const recentActivity = [...notes, ...documents, ...contacts].filter(item => {
      const itemDate = new Date(item.createdAt)
      return differenceInDays(new Date(), itemDate) <= 7
    })
    
    if (recentActivity.length === 0) healthScore -= 20
    else if (recentActivity.length > 10) healthScore += 10
    
    return Math.max(0, Math.min(100, healthScore))
  }

  const getProductivityTrends = () => {
    const { start: startDate, end: endDate } = getDateRange()
    const previousStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
    
    const currentPeriodActivity = [...notes, ...documents, ...contacts].filter(item => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= startDate && itemDate <= endDate
    })
    
    const previousPeriodActivity = [...notes, ...documents, ...contacts].filter(item => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= previousStart && itemDate < startDate
    })
    
    const currentCount = currentPeriodActivity.length
    const previousCount = previousPeriodActivity.length
    const trend = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0
    
    return {
      current: currentCount,
      previous: previousCount,
      trend: trend,
      isIncreasing: trend > 0
    }
  }

  const getTeamProductivity = () => {
    // Simulate team productivity data
    const teamData = project.teamMembers?.map((member: any, index: number) => ({
      name: typeof member === 'string' ? member : member.name || member.email || `Member ${index + 1}`,
      contributions: Math.floor(Math.random() * 50) + 10,
      lastActive: `${Math.floor(Math.random() * 7) + 1} days ago`,
      efficiency: Math.floor(Math.random() * 30) + 70
    })) || []
    
    return teamData
  }

  const getMilestoneAnalysis = () => {
    const startDate = new Date(project.startDate)
    const endDate = project.endDate ? new Date(project.endDate) : new Date()
    const totalDays = differenceInDays(endDate, startDate)
    const currentProgress = project.progress || 0
    
    const milestones = [
      { name: "Planning", target: 25, actual: currentProgress >= 25 ? 25 : currentProgress, status: currentProgress >= 25 ? 'completed' : 'in-progress' },
      { name: "Development", target: 60, actual: currentProgress >= 60 ? 60 : Math.max(0, currentProgress - 25), status: currentProgress >= 60 ? 'completed' : currentProgress > 25 ? 'in-progress' : 'pending' },
      { name: "Testing", target: 85, actual: currentProgress >= 85 ? 85 : Math.max(0, currentProgress - 60), status: currentProgress >= 85 ? 'completed' : currentProgress > 60 ? 'in-progress' : 'pending' },
      { name: "Deployment", target: 100, actual: currentProgress >= 100 ? 100 : Math.max(0, currentProgress - 85), status: currentProgress >= 100 ? 'completed' : currentProgress > 85 ? 'in-progress' : 'pending' }
    ]
    
    return milestones
  }
    const now = new Date()
    switch (timeRange) {
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) }
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case "7days":
        return { start: subDays(now, 7), end: now }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }

  const getTimeAnalytics = () => {
    const { start: startDate, end: endDate } = getDateRange()
    
    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= startDate && entryDate <= endDate && entry.duration
    })

    // Daily time tracking
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const dailyData = days.map(day => {
      const dayEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.startTime)
        return entryDate.toDateString() === day.toDateString()
      })
      
      const totalHours = dayEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0)
      }, 0) / (1000 * 60 * 60) // Convert to hours

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

  const timeAnalytics = getTimeAnalytics()
  const contentAnalytics = getContentAnalytics()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl ring-1 ring-blue-500/30">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Project Analytics</CardTitle>
                <p className="text-gray-400 text-sm">Insights für {project.name}</p>
              </div>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Notes</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{contentAnalytics.totalNotes}</div>
            <p className="text-xs text-gray-400">
              +{contentAnalytics.recentNotes} this period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{contentAnalytics.totalContacts}</div>
            <p className="text-xs text-gray-400">
              +{contentAnalytics.recentContacts} this period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Documents</CardTitle>
            <FileText className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{contentAnalytics.totalDocuments}</div>
            <p className="text-xs text-gray-400">
              {formatFileSize(contentAnalytics.totalSize)} total
            </p>
          </CardContent>
        </Card>

        {project?.userRole?.canViewTimeTracking && (
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Time Tracked</CardTitle>
              <Timer className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {timeAnalytics.totalHours.toFixed(1)}h
              </div>
              <p className="text-xs text-gray-400">
                {timeAnalytics.totalSessions} sessions
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Note Categories */}
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Note Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentAnalytics.noteCategories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Types */}
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentAnalytics.documentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, value }) => `${type}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {contentAnalytics.documentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contact Tags */}
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Top Contact Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentAnalytics.contactTags}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="tag" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Tracking (only for owners) */}
        {project?.userRole?.canViewTimeTracking && timeAnalytics.dailyData.length > 0 && (
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Daily Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeAnalytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value}h`, 'Hours']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Distribution (only for owners) */}
      {project?.userRole?.canViewTimeTracking && timeAnalytics.taskChartData.length > 0 && (
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Time by Task</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeAnalytics.taskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="task" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
