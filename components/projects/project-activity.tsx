"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  Clock, 
  FileText, 
  Users, 
  MessageSquare, 
  Edit, 
  Plus, 
  Calendar,
  GitBranch,
  Settings,
  Star,
  Eye
} from "lucide-react"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"

interface ProjectActivityProps {
  projectId: string
  project: any
}

interface ActivityItem {
  _id: string
  type: 'note' | 'document' | 'contact' | 'event' | 'project_update'
  title: string
  description?: string
  user: {
    name: string
    email: string
  }
  projectId?: string
  createdAt: string
  updatedAt: string
  metadata?: any
}

interface RecentItem {
  _id: string
  title: string
  type: string
  createdAt: string
  updatedAt: string
  category?: string
  fileType?: string
  name?: string
  email?: string
  tags?: string[]
}

const activityTypeIcons = {
  note: FileText,
  document: FileText,
  contact: Users,
  event: Calendar,
  project_update: Settings
}

const activityTypeColors = {
  note: "text-blue-400",
  document: "text-green-400",
  contact: "text-purple-400", 
  event: "text-orange-400",
  project_update: "text-red-400"
}

export function ProjectActivity({ projectId, project }: ProjectActivityProps) {
  const [recentNotes, setRecentNotes] = useState<RecentItem[]>([])
  const [recentDocuments, setRecentDocuments] = useState<RecentItem[]>([])
  const [recentContacts, setRecentContacts] = useState<RecentItem[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    fetchActivityData()
  }, [projectId])

  const fetchActivityData = async () => {
    setIsLoading(true)
    try {
      const [notesRes, documentsRes, contactsRes, eventsRes] = await Promise.all([
        fetch(`/api/notes?projectId=${projectId}`),
        fetch(`/api/documents?projectId=${projectId}`),
        fetch(`/api/contacts?projectId=${projectId}`),
        fetch(`/api/events?projectId=${projectId}`)
      ])

      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setRecentNotes(notesData.map((note: any) => ({ ...note, type: 'note' })))
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        setRecentDocuments(documentsData.map((doc: any) => ({ ...doc, type: 'document' })))
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setRecentContacts(contactsData.map((contact: any) => ({ ...contact, type: 'contact' })))
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setRecentEvents(eventsData.map((event: any) => ({ ...event, type: 'event' })))
      }
    } catch (error) {
      console.error("Error fetching activity data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredActivities = () => {
    const allActivities = [
      ...recentNotes,
      ...recentDocuments,
      ...recentContacts,
      ...recentEvents
    ]

    let filtered = allActivities

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.type === typeFilter)
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (timeFilter) {
        case "today":
          filtered = filtered.filter(item => isToday(new Date(item.updatedAt || item.createdAt)))
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(item => new Date(item.updatedAt || item.createdAt) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(item => new Date(item.updatedAt || item.createdAt) >= filterDate)
          break
      }
    }

    // Sort by most recent
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt)
      const dateB = new Date(b.updatedAt || b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
  }

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return `Today, ${format(date, 'HH:mm')}`
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM dd, HH:mm')
    }
  }

  const getActivityTitle = (item: RecentItem) => {
    switch (item.type) {
      case 'contact':
        return item.name || item.title
      default:
        return item.title
    }
  }

  const getActivityDescription = (item: RecentItem) => {
    switch (item.type) {
      case 'note':
        return `Note in ${item.category} category`
      case 'document':
        return `${item.fileType?.toUpperCase()} document`
      case 'contact':
        return item.email || 'Contact information'
      case 'event':
        return `Event scheduled`
      default:
        return ''
    }
  }

  const getActivityIcon = (type: string) => {
    const IconComponent = activityTypeIcons[type as keyof typeof activityTypeIcons] || Activity
    return IconComponent
  }

  const getActivityColor = (type: string) => {
    return activityTypeColors[type as keyof typeof activityTypeColors] || "text-gray-400"
  }

  const filteredActivities = getFilteredActivities()

  const activityStats = {
    totalItems: recentNotes.length + recentDocuments.length + recentContacts.length + recentEvents.length,
    notesCount: recentNotes.length,
    documentsCount: recentDocuments.length,
    contactsCount: recentContacts.length,
    eventsCount: recentEvents.length,
    todayItems: filteredActivities.filter(item => isToday(new Date(item.updatedAt || item.createdAt))).length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700/50 rounded-lg animate-pulse"></div>
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
              <div className="p-2.5 bg-purple-500/20 rounded-xl ring-1 ring-purple-500/30">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Project Activity</CardTitle>
                <p className="text-gray-400 text-sm">Recent changes and updates for {project.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="contact">Contacts</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">{activityStats.totalItems}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Notes</p>
                <p className="text-2xl font-bold text-white">{activityStats.notesCount}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Documents</p>
                <p className="text-2xl font-bold text-white">{activityStats.documentsCount}</p>
              </div>
              <FileText className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Contacts</p>
                <p className="text-2xl font-bold text-white">{activityStats.contactsCount}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today</p>
                <p className="text-2xl font-bold text-white">{activityStats.todayItems}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-green-400" />
            <span>Recent Activity</span>
            <Badge variant="secondary" className="bg-gray-700">
              {filteredActivities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Activity Found</h3>
              <p className="text-gray-400 mb-6">
                {timeFilter !== "all" || typeFilter !== "all" 
                  ? "Try adjusting your filters to see more activity."
                  : "Start creating content to see activity here."
                }
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=notes&action=add`, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
                <Button
                  onClick={() => window.open(`/dashboard/documents?projectId=${projectId}&action=add`, '_blank')}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((item) => {
                const IconComponent = getActivityIcon(item.type)
                const iconColor = getActivityColor(item.type)
                
                return (
                  <div
                    key={`${item.type}-${item._id}`}
                    className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-gray-600/50 flex-shrink-0`}>
                      <IconComponent className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white truncate">
                          {getActivityTitle(item)}
                        </h4>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatActivityDate(item.updatedAt || item.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-400 mt-1">
                        {getActivityDescription(item)}
                      </p>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs bg-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-600">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {item.type === 'note' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=notes`, '_blank')}
                          className="text-gray-400 hover:text-blue-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {item.type === 'document' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/dashboard/documents?projectId=${projectId}`, '_blank')}
                          className="text-gray-400 hover:text-green-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {item.type === 'contact' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=contacts`, '_blank')}
                          className="text-gray-400 hover:text-purple-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {item.type === 'event' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/dashboard/calendar?projectId=${projectId}`, '_blank')}
                          className="text-gray-400 hover:text-orange-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=notes&action=add`, '_blank')}
              className="bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
            
            <Button
              onClick={() => window.open(`/dashboard/documents?projectId=${projectId}&action=add`, '_blank')}
              className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
            
            <Button
              onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=contacts&action=add`, '_blank')}
              className="bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
            
            <Button
              onClick={() => window.open(`/dashboard/calendar?projectId=${projectId}&action=add`, '_blank')}
              className="bg-orange-600/20 border border-orange-500/30 text-orange-400 hover:bg-orange-600/30 justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
