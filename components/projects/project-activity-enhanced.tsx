"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
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
  Eye,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  Bell,
  CheckCircle,
  AlertCircle,
  Timer,
  Download,
  Share2,
  RefreshCw,
  Heart,
  MessageCircle,
  Bookmark
} from "lucide-react"
import { format, isToday, isYesterday, formatDistanceToNow, startOfDay, endOfDay, subDays } from "date-fns"

interface ProjectActivityEnhancedProps {
  projectId: string
  project: any
}

interface ActivityItem {
  _id: string
  type: 'note' | 'document' | 'contact' | 'event' | 'project_update' | 'comment' | 'milestone'
  title: string
  description?: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  projectId?: string
  createdAt: string
  updatedAt: string
  metadata?: any
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in-progress' | 'completed'
  tags?: string[]
  reactions?: { type: string; count: number; users: string[] }[]
  comments?: { user: string; message: string; createdAt: string }[]
}

interface RecentItem {
  _id: string
  title: string
  type: string
  createdAt: string
  updatedAt: string
  category?: string
  fileType?: string
  email?: string
  tags?: string[]
  user?: {
    name: string
    email: string
  }
  priority?: string
  status?: string
}

interface ActivityFilter {
  timeRange: 'today' | 'week' | 'month' | 'all'
  type: 'all' | 'note' | 'document' | 'contact' | 'event' | 'comment'
  user: 'all' | string
  priority: 'all' | 'low' | 'medium' | 'high'
}

const activityTypeIcons = {
  note: FileText,
  document: FileText,
  contact: Users,
  event: Calendar,
  project_update: Settings,
  comment: MessageCircle,
  milestone: Target
}

const activityTypeColors = {
  note: "text-blue-400",
  document: "text-green-400",
  contact: "text-purple-400",
  event: "text-yellow-400",
  project_update: "text-orange-400",
  comment: "text-pink-400",
  milestone: "text-emerald-400"
}

const priorityColors = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-red-500/20 text-red-400"
}

export function ProjectActivityEnhanced({ projectId, project }: ProjectActivityEnhancedProps) {
  const [recentNotes, setRecentNotes] = useState<RecentItem[]>([])
  const [recentDocuments, setRecentDocuments] = useState<RecentItem[]>([])
  const [recentContacts, setRecentContacts] = useState<RecentItem[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentItem[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<ActivityFilter>({
    timeRange: 'week',
    type: 'all',
    user: 'all',
    priority: 'all'
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewComment, setShowNewComment] = useState(false)
  const [newComment, setNewComment] = useState({ title: "", content: "", priority: "medium" })
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [liveUpdates, setLiveUpdates] = useState(true)

  useEffect(() => {
    fetchActivityData()
    if (liveUpdates) {
      const interval = setInterval(fetchActivityData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [projectId, liveUpdates])

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

      // Generate enhanced activity feed
      generateActivityFeed()
    } catch (error) {
      console.error("Error fetching activity data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateActivityFeed = () => {
    const allActivities: ActivityItem[] = []
    
    // Add recent notes, documents, contacts, events as activities
    const allItems = [...recentNotes, ...recentDocuments, ...recentContacts, ...recentEvents]
    
    allItems.forEach(item => {
      allActivities.push({
        _id: item._id,
        type: item.type as any,
        title: item.title,
        description: getItemDescription(item),
        user: item.user || {
          name: "System",
          email: "system@dashboard.com"
        },
        projectId: projectId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        metadata: item,
        priority: item.priority as any || 'medium',
        status: item.status as any || 'completed',
        tags: item.tags || [],
        reactions: [],
        comments: []
      })
    })

    // Sort by date
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    setActivityFeed(allActivities)
  }

  const getItemDescription = (item: RecentItem) => {
    switch (item.type) {
      case 'note':
        return `Note created in ${item.category} category`
      case 'document':
        return `${item.fileType?.toUpperCase()} document added`
      case 'contact':
        return `Contact information for ${item.email || 'new contact'}`
      case 'event':
        return `Event scheduled for project`
      default:
        return 'Project activity'
    }
  }

  const getFilteredActivities = () => {
    let filtered = activityFeed

    // Time range filter
    const now = new Date()
    switch (filter.timeRange) {
      case 'today':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.createdAt)
          return itemDate >= startOfDay(now) && itemDate <= endOfDay(now)
        })
        break
      case 'week':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.createdAt)
          return itemDate >= subDays(now, 7)
        })
        break
      case 'month':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.createdAt)
          return itemDate >= subDays(now, 30)
        })
        break
    }

    // Type filter
    if (filter.type !== 'all') {
      filtered = filtered.filter(item => item.type === filter.type)
    }

    // Priority filter
    if (filter.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filter.priority)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getActivityIcon = (type: string) => {
    const IconComponent = activityTypeIcons[type as keyof typeof activityTypeIcons] || Activity
    return IconComponent
  }

  const getActivityColor = (type: string) => {
    return activityTypeColors[type as keyof typeof activityTypeColors] || "text-gray-400"
  }

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM dd, yyyy')
    }
  }

  const getProductivityScore = () => {
    const thisWeekActivities = activityFeed.filter(item => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= subDays(new Date(), 7)
    })
    
    const baseScore = Math.min(thisWeekActivities.length * 5, 100)
    const qualityBonus = thisWeekActivities.filter(item => item.priority === 'high').length * 2
    
    return Math.min(baseScore + qualityBonus, 100)
  }

  const getActivityStats = () => {
    const filteredActivities = getFilteredActivities()
    
    const stats = {
      total: filteredActivities.length,
      notes: filteredActivities.filter(item => item.type === 'note').length,
      documents: filteredActivities.filter(item => item.type === 'document').length,
      contacts: filteredActivities.filter(item => item.type === 'contact').length,
      events: filteredActivities.filter(item => item.type === 'event').length,
      milestones: filteredActivities.filter(item => item.type === 'milestone').length,
      todayItems: filteredActivities.filter(item => isToday(new Date(item.createdAt))).length,
      highPriority: filteredActivities.filter(item => item.priority === 'high').length,
      completed: filteredActivities.filter(item => item.status === 'completed').length
    }

    return stats
  }

  const addComment = async () => {
    if (!newComment.title || !newComment.content) return

    const comment: ActivityItem = {
      _id: `comment-${Date.now()}`,
      type: "comment",
      title: newComment.title,
      description: newComment.content,
      user: {
        name: "Current User",
        email: "user@example.com"
      },
      projectId: projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: newComment.priority as any,
      status: "completed",
      reactions: [],
      comments: []
    }

    setActivityFeed([comment, ...activityFeed])
    setNewComment({ title: "", content: "", priority: "medium" })
    setShowNewComment(false)
  }

  const addReaction = (activityId: string, reactionType: string) => {
    setActivityFeed(feed => 
      feed.map(item => {
        if (item._id === activityId) {
          const existingReaction = item.reactions?.find(r => r.type === reactionType)
          if (existingReaction) {
            existingReaction.count++
          } else {
            item.reactions = item.reactions || []
            item.reactions.push({
              type: reactionType,
              count: 1,
              users: ["current-user"]
            })
          }
        }
        return item
      })
    )
  }

  const exportActivity = () => {
    const exportData = {
      project: project.name,
      exported: new Date().toISOString(),
      filter,
      activities: getFilteredActivities(),
      stats: getActivityStats()
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_activity.json`
    
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const filteredActivities = getFilteredActivities()
  const activityStats = getActivityStats()
  const productivityScore = getProductivityScore()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-pink-500/20 rounded-xl ring-1 ring-pink-500/30">
                <Activity className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <CardTitle className="text-white">Enhanced Project Activity</CardTitle>
                <p className="text-gray-400 text-sm">Live activity feed für {project.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setLiveUpdates(!liveUpdates)}
                variant="outline"
                size="sm"
                className={`border-gray-600 hover:bg-gray-700 ${liveUpdates ? 'text-green-400' : 'text-gray-400'}`}
              >
                <Bell className={`w-4 h-4 mr-2 ${liveUpdates ? 'animate-pulse' : ''}`} />
                Live
              </Button>
              
              <Button
                onClick={() => setShowNewComment(true)}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Update
              </Button>
              
              <Button
                onClick={exportActivity}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button
                onClick={fetchActivityData}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Productivity Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-400">
              <BarChart3 className="w-5 h-5" />
              <span>Productivity Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-white">{productivityScore}%</div>
              <Progress value={productivityScore} className="h-3" />
              <div className="flex items-center justify-center space-x-2">
                {productivityScore >= 80 ? (
                  <><Zap className="w-4 h-4 text-green-400" /><span className="text-green-400">Excellent</span></>
                ) : productivityScore >= 60 ? (
                  <><TrendingUp className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400">Good</span></>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">Needs Boost</span></>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-white">{activityStats.completed}</div>
              <div className="text-sm text-gray-400">Activities</div>
              <div className="text-sm text-green-400">
                {((activityStats.completed / activityStats.total) * 100).toFixed(0)}% completion rate
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-400">
              <Target className="w-5 h-5" />
              <span>High Priority</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-white">{activityStats.highPriority}</div>
              <div className="text-sm text-gray-400">Critical Items</div>
              <div className="text-sm text-purple-400">
                Requires attention
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-400">
              <Clock className="w-5 h-5" />
              <span>Today</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-white">{activityStats.todayItems}</div>
              <div className="text-sm text-gray-400">Activities</div>
              <div className="text-sm text-orange-400">
                Active today
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-xl font-bold text-white">{activityStats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Notes</span>
            </div>
            <div className="text-xl font-bold text-white">{activityStats.notes}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Docs</span>
            </div>
            <div className="text-xl font-bold text-white">{activityStats.documents}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Contacts</span>
            </div>
            <div className="text-xl font-bold text-white">{activityStats.contacts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Events</span>
            </div>
            <div className="text-xl font-bold text-white">{activityStats.events}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-400">Milestones</span>
            </div>
            <div className="text-xl font-bold text-white">{activityStats.milestones}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600"
                />
              </div>
              
              <Select value={filter.timeRange} onValueChange={(value: any) => setFilter({ ...filter, timeRange: value })}>
                <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filter.type} onValueChange={(value: any) => setFilter({ ...filter, type: value })}>
                <SelectTrigger className="w-36 bg-gray-700/50 border-gray-600">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="contact">Contacts</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filter.priority} onValueChange={(value: any) => setFilter({ ...filter, priority: value })}>
                <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {filteredActivities.length} activities
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Activity Feed */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-pink-400" />
              <span>Activity Feed</span>
            </CardTitle>
            <Badge variant="secondary" className="bg-pink-500/20 text-pink-400">
              {filteredActivities.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No activity found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filter.type !== 'all' || filter.timeRange !== 'all'
                  ? "Try adjusting your filters"
                  : "Get started by adding some content to your project"}
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
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredActivities.map((item) => {
                const IconComponent = getActivityIcon(item.type)
                const iconColor = getActivityColor(item.type)
                
                return (
                  <div
                    key={item._id}
                    className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all duration-200 group cursor-pointer"
                    onClick={() => setSelectedActivity(item)}
                  >
                    <Avatar className="flex-shrink-0">
                      <AvatarImage src={item.user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500">
                        {item.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-4 h-4 ${iconColor}`} />
                          <h4 className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </h4>
                          {item.priority && (
                            <Badge variant="secondary" className={priorityColors[item.priority]}>
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatActivityDate(item.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-400">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">by {item.user.name}</span>
                          {item.status && (
                            <Badge variant="secondary" className={`text-xs ${
                              item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {item.status}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {item.reactions?.slice(0, 3).map((reaction, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation()
                                addReaction(item._id, reaction.type)
                              }}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-600/50 rounded-full hover:bg-gray-600/70 transition-colors"
                            >
                              <span className="text-xs">{reaction.type}</span>
                              <span className="text-xs text-gray-400">{reaction.count}</span>
                            </button>
                          ))}
                          
                          {item.comments && item.comments.length > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <MessageCircle className="w-3 h-3" />
                              <span>{item.comments.length}</span>
                            </div>
                          )}
                        </div>
                      </div>

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
                    
                    <div className="flex items-center space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-yellow-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Toggle bookmark
                        }}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-green-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          addReaction(item._id, '👍')
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
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
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription>Add content to your project quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=notes&action=add`, '_blank')}
              className="bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 justify-start h-auto p-4 flex-col"
              variant="outline"
            >
              <FileText className="w-6 h-6 mb-2" />
              <span>Add Note</span>
            </Button>
            
            <Button
              onClick={() => window.open(`/dashboard/documents?projectId=${projectId}&action=add`, '_blank')}
              className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 justify-start h-auto p-4 flex-col"
              variant="outline"
            >
              <FileText className="w-6 h-6 mb-2" />
              <span>Add Document</span>
            </Button>
            
            <Button
              onClick={() => window.open(`/dashboard/crm?projectId=${projectId}&tab=contacts&action=add`, '_blank')}
              className="bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 justify-start h-auto p-4 flex-col"
              variant="outline"
            >
              <Users className="w-6 h-6 mb-2" />
              <span>Add Contact</span>
            </Button>
            
            <Button
              onClick={() => window.open(`/dashboard/calendar?projectId=${projectId}&action=add`, '_blank')}
              className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/30 justify-start h-auto p-4 flex-col"
              variant="outline"
            >
              <Calendar className="w-6 h-6 mb-2" />
              <span>Add Event</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Comment Dialog */}
      <Dialog open={showNewComment} onOpenChange={setShowNewComment}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Project Update</DialogTitle>
            <CardDescription>Share an update with your team</CardDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
              <Input
                value={newComment.title}
                onChange={(e) => setNewComment({ ...newComment, title: e.target.value })}
                placeholder="Update title"
                className="bg-gray-700/50 border-gray-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Priority</label>
              <Select 
                value={newComment.priority} 
                onValueChange={(value) => setNewComment({ ...newComment, priority: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Content</label>
              <Textarea
                value={newComment.content}
                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                placeholder="What's the update about?"
                rows={4}
                className="bg-gray-700/50 border-gray-600"
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowNewComment(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={addComment}
                className="bg-pink-600 hover:bg-pink-700"
                disabled={!newComment.title || !newComment.content}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              {selectedActivity && (
                <>
                  {(() => {
                    const IconComponent = getActivityIcon(selectedActivity.type)
                    return <IconComponent className={`w-5 h-5 ${getActivityColor(selectedActivity.type)}`} />
                  })()}
                  <span>{selectedActivity.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500">
                      {selectedActivity.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{selectedActivity.user.name}</p>
                    <p className="text-sm text-gray-400">{formatActivityDate(selectedActivity.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedActivity.priority && (
                    <Badge variant="secondary" className={priorityColors[selectedActivity.priority]}>
                      {selectedActivity.priority}
                    </Badge>
                  )}
                  {selectedActivity.status && (
                    <Badge variant="secondary" className={`${
                      selectedActivity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      selectedActivity.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {selectedActivity.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-gray-300">{selectedActivity.description}</p>
              </div>

              {selectedActivity.tags && selectedActivity.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedActivity.reactions && selectedActivity.reactions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Reactions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        onClick={() => addReaction(selectedActivity._id, reaction.type)}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                      >
                        <span>{reaction.type}</span>
                        <span className="text-gray-400">{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedActivity.comments && selectedActivity.comments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Comments</h4>
                  <div className="space-y-2">
                    {selectedActivity.comments.map((comment, index) => (
                      <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{comment.user}</span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmark
                  </Button>
                </div>
                <Button
                  onClick={() => setSelectedActivity(null)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
