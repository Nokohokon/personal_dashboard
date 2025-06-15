"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, Clock, Users, FileText, TrendingUp, Activity } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from "date-fns"

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
  createdAt: string
  tags: string[]
}

interface Note {
  _id: string
  title: string
  category: string
  createdAt: string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f']

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("week")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      const [timeRes, contactsRes, notesRes] = await Promise.all([
        fetch("/api/time-entries"),
        fetch("/api/contacts"),
        fetch("/api/notes")
      ])

      if (timeRes.ok) {
        const timeData = await timeRes.json()
        setTimeEntries(timeData)
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData)
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate time analytics
  const getTimeAnalytics = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (timeRange) {
      case "week":
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case "month":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case "7days":
        startDate = subDays(now, 7)
        endDate = now
        break
      default:
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
    }

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

    // Project distribution
    const projectData = filteredEntries.reduce((acc, entry) => {
      const project = entry.project
      const hours = (entry.duration || 0) / (1000 * 60 * 60)
      
      if (acc[project]) {
        acc[project] += hours
      } else {
        acc[project] = hours
      }
      
      return acc
    }, {} as Record<string, number>)

    const projectChartData = Object.entries(projectData).map(([project, hours]) => ({
      name: project,
      value: Number(hours.toFixed(2))
    }))

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
      projectChartData,
      taskChartData,
      totalHours: filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / (1000 * 60 * 60),
      totalSessions: filteredEntries.length
    }
  }

  // Calculate other analytics
  const getContactAnalytics = () => {
    const last30Days = subDays(new Date(), 30)
    const recentContacts = contacts.filter(contact => 
      new Date(contact.createdAt) >= last30Days
    )

    // Contact tags distribution
    const tagData = contacts.reduce((acc, contact) => {
      contact.tags.forEach(tag => {
        if (acc[tag]) {
          acc[tag] += 1
        } else {
          acc[tag] = 1
        }
      })
      return acc
    }, {} as Record<string, number>)

    const tagChartData = Object.entries(tagData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([tag, count]) => ({
        tag,
        count
      }))

    return {
      totalContacts: contacts.length,
      recentContacts: recentContacts.length,
      tagChartData
    }
  }

  const getNoteAnalytics = () => {
    const last30Days = subDays(new Date(), 30)
    const recentNotes = notes.filter(note => 
      new Date(note.createdAt) >= last30Days
    )

    // Category distribution
    const categoryData = notes.reduce((acc, note) => {
      const category = note.category
      if (acc[category]) {
        acc[category] += 1
      } else {
        acc[category] = 1
      }
      return acc
    }, {} as Record<string, number>)

    const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
      name: category,
      value: count
    }))

    return {
      totalNotes: notes.length,
      recentNotes: recentNotes.length,
      categoryChartData
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const timeAnalytics = getTimeAnalytics()
  const contactAnalytics = getContactAnalytics()
  const noteAnalytics = getNoteAnalytics()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analytics
            </h1>
            <p className="text-slate-400">
              Insights into your productivity and activity
            </p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timeAnalytics.totalHours.toFixed(1)}h
              </div>
              <p className="text-xs text-slate-400">
                {timeAnalytics.totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacts</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactAnalytics.totalContacts}</div>
              <p className="text-xs text-slate-400">
                +{contactAnalytics.recentContacts} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
              <FileText className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noteAnalytics.totalNotes}</div>
              <p className="text-xs text-slate-400">
                +{noteAnalytics.recentNotes} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timeAnalytics.dailyData.length > 0 
                  ? (timeAnalytics.totalHours / timeAnalytics.dailyData.length).toFixed(1)
                  : "0"
                }h
              </div>
              <p className="text-xs text-slate-400">
                per day average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeAnalytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Top Tasks by Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeAnalytics.taskChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="task" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Project Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={timeAnalytics.projectChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {timeAnalytics.projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Contact Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contactAnalytics.tagChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tag" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Note Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Note Categories Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={noteAnalytics.categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {noteAnalytics.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
