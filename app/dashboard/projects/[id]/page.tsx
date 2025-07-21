"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { ProjectDetails } from "@/components/projects/project-details"
import { TeamChat } from "@/components/projects/team-chat"
import { ProjectAnalyticsEnhanced } from "@/components/projects/project-analytics-enhanced"
import { ProjectFilesEnhanced } from "@/components/projects/project-files-enhanced"
import { ProjectActivity } from "@/components/projects/project-activity"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bookmark,
  Building,
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  Crown,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  GitBranch,
  Globe,
  Lightbulb,
  MessageSquare,
  PieChart,
  Plus,
  Settings,
  Share2,
  Shield,
  Star,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Zap
} from "lucide-react"

interface ProjectMember {
  email: string
  userId: string | null
  name: string | null
  isRegistered: boolean
  role: 'owner' | 'collaborator'
  addedAt: Date
  permissions: {
    canEditProject: boolean
    canEditContent: boolean
    canViewAnalytics: boolean
    canViewTimeTracking: boolean
    canManageTeam: boolean
  }
}

export default function ProjectDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<any>(null)
  const [allMembers, setAllMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [sharePermission, setSharePermission] = useState("collaborator")
  const [isSharing, setIsSharing] = useState(false)

  // Form states for editing
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "",
    priority: "",
    client: "",
    budget: "",
    startDate: "",
    endDate: "",
    tags: "",
    progress: 0
  })

  const statusOptions = [
    { value: "planning", label: "Planning", icon: Target, color: "bg-yellow-500" },
    { value: "active", label: "Active", icon: Clock, color: "bg-blue-500" },
    { value: "on-hold", label: "On Hold", icon: AlertCircle, color: "bg-orange-500" },
    { value: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-500" }
  ]

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-gray-500" },
    { value: "medium", label: "Medium", color: "bg-blue-500" },
    { value: "high", label: "High", color: "bg-orange-500" },
    { value: "critical", label: "Critical", color: "bg-red-500" }
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && projectId) {
      fetchProject()
    }
  }, [status, projectId, router])

  const fetchProject = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        
        // Team-Mitglieder laden
        await fetchTeamMembers()
      } else {
        console.error("Failed to fetch project")
        router.push("/dashboard/projects")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      router.push("/dashboard/projects")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setAllMembers(data.allMembers || [])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setAllMembers([])
    }
  }

  const handleProjectUpdate = () => {
    fetchProject()
  }

  const handleEditProject = () => {
    setEditForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "",
      priority: project.priority || "",
      client: project.client || "",
      budget: project.budget?.toString() || "",
      startDate: project.startDate ? project.startDate.split('T')[0] : "",
      endDate: project.endDate ? project.endDate.split('T')[0] : "",
      tags: project.tags ? project.tags.join(", ") : "",
      progress: project.progress || 0
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          budget: editForm.budget ? parseFloat(editForm.budget) : undefined,
          tags: editForm.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
          progress: editForm.progress
        })
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchProject()
      }
    } catch (error) {
      console.error("Error updating project:", error)
    }
  }

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        router.push("/dashboard/projects")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const handleShareProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSharing(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: shareEmail,
          role: sharePermission
        })
      })

      if (response.ok) {
        setIsShareDialogOpen(false)
        setShareEmail("")
        setSharePermission("collaborator")
        fetchProject()
      } else {
        const error = await response.json()
        alert(error.error || "Error sharing project")
      }
    } catch (error) {
      console.error("Error sharing project:", error)
      alert("Network error while sharing project")
    } finally {
      setIsSharing(false)
    }
  }

  const handleExportProject = () => {
    try {
      const exportData = {
        project: {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          client: project.client,
          budget: project.budget,
          startDate: project.startDate,
          endDate: project.endDate,
          tags: project.tags,
          progress: project.progress,
          teamMembers: project.teamMembers,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        },
        exportedAt: new Date().toISOString(),
        exportedBy: session?.user?.email
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`
      
      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      console.error("Error exporting project:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateTimeProgress = () => {
    if (!project.startDate || !project.endDate) return 0
    const start = new Date(project.startDate).getTime()
    const end = new Date(project.endDate).getTime()
    const now = new Date().getTime()
    
    if (now < start) return 0
    if (now > end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'on-hold': return <Clock className="w-4 h-4" />
      case 'planning': return <Target className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'on-hold': return 'bg-yellow-500'
      case 'planning': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Function to get initials from name or email

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  // Loading state with professional skeleton


  // Error state - project not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Project not found</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          The requested project does not exist or you do not have permission to access it.
        </p>
        <Button 
          onClick={() => router.push("/dashboard/projects")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const isOwner = project.userId === (session?.user as any)?.id
  const timeProgress = calculateTimeProgress()

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-start space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/projects")}
              className="text-gray-400 hover:text-white flex-shrink-0 mt-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Projects
            </Button>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {project.name}
                </h1>
                {isOwner && (
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex-shrink-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Owner
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center flex-wrap gap-4 text-sm text-gray-400">
                {project.client && (
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{project.client}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{allMembers.filter(m => m.isRegistered).length} Members</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-gray-600 hover:bg-gray-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Share Project</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Invite team members to this project
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleShareProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shareEmail">Email Address</Label>
                    <Input
                      id="shareEmail"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="bg-gray-700 border-gray-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sharePermission">Role</Label>
                    <Select value={sharePermission} onValueChange={setSharePermission}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="collaborator">Collaborator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSharing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSharing ? "Sharing..." : "Send Invitation"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleExportProject}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            {(isOwner || project.userRole?.canEditProject) && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleEditProject}
                className="border-gray-600 hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            {isOwner && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </DialogTrigger>              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Delete Project</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    This action cannot be undone. All data will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    Delete Permanently
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Project Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Status Card */}
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                    <span className="font-semibold capitalize">{project.status}</span>
                  </div>
                </div>
                {getStatusIcon(project.status)}
              </div>
            </CardContent>
          </Card>

          {/* Priority Card */}
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Priority</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`}></div>
                    <span className="font-semibold capitalize">{project.priority}</span>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Progress</p>
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tasks</span>
                  <span>{project.progress || 0}%</span>
                </div>
                <Progress value={project.progress || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Budget Card */}
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Budget</p>
                  <p className="font-semibold">
                    {project.budget ? formatCurrency(project.budget) : "Not specified"}
                  </p>
                </div>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Progress Bar */}
        {project.startDate && project.endDate && (
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white mb-1">Time Progress</h3>
                  <p className="text-sm text-gray-400">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </p>
                </div>
                <div className="text-sm text-gray-400 mt-2 sm:mt-0">
                  {timeProgress}% of time elapsed
                </div>
              </div>
              <Progress value={timeProgress} className="h-3" />
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b border-gray-700/50 overflow-x-auto">
            <TabsList className="bg-transparent gap-1 w-full justify-start">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gray-700/60 data-[state=active]:text-white px-4 py-2"
              >
                <Eye className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-gray-700/60 data-[state=active]:text-white px-4 py-2"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="data-[state=active]:bg-gray-700/60 data-[state=active]:text-white px-4 py-2"
              >
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="data-[state=active]:bg-gray-700/60 data-[state=active]:text-white px-4 py-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Files
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-gray-700/60 data-[state=active]:text-white px-4 py-2"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Team Chat
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-gray-700/60 data-[state=active]:text-white px-4 py-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Description */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Project Description</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 leading-relaxed">
                      {project.description || "No description available."}
                    </p>
                    
                    {project.tags && project.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Team Members */}
              <div className="space-y-6">
                <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Team</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {allMembers.filter(m => m.isRegistered).slice(0, 5).map((member, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name || member.email}`} />
                            <AvatarFallback className="bg-gray-600 text-white text-xs">
                              {getInitials(member.name || "", member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {member.name || member.email}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {member.role === 'owner' ? 'Owner' : 'Collaborator'}
                            </p>
                          </div>
                          {member.role === 'owner' && (
                            <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                      
                      {allMembers.filter(m => m.isRegistered).length > 5 && (
                        <p className="text-sm text-gray-400 text-center pt-2 border-t border-gray-700">
                          +{allMembers.filter(m => m.isRegistered).length - 5} more members
                        </p>
                      )}
                      
                      {allMembers.filter(m => m.isRegistered).length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No team members
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setActiveTab("chat")} 
                      variant="ghost" 
                      className="w-full justify-start text-left hover:bg-gray-700/50"
                    >
                      <MessageSquare className="w-4 h-4 mr-3" />
                      Open Team Chat
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("files")} 
                      variant="ghost" 
                      className="w-full justify-start text-left hover:bg-gray-700/50"
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      Manage Files
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("analytics")} 
                      variant="ghost" 
                      className="w-full justify-start text-left hover:bg-gray-700/50"
                    >
                      <BarChart3 className="w-4 h-4 mr-3" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <ProjectAnalyticsEnhanced projectId={projectId} project={project} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ProjectActivity projectId={projectId} project={project} />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <ProjectFilesEnhanced projectId={projectId} project={project} />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <div className="h-[70vh] min-h-[600px]">
              <TeamChat 
                projectId={projectId} 
                projectName={project.name} 
                allMembers={allMembers}
              />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ProjectDetails 
              project={project} 
              isOwner={isOwner} 
              onProjectUpdate={handleProjectUpdate}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the project details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Project Name</Label>
                  <Input
                    id="editName"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editClient">Client</Label>
                  <Input
                    id="editClient"
                    value={editForm.client}
                    onChange={(e) => setEditForm({...editForm, client: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="bg-gray-700 border-gray-600"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select value={editForm.priority} onValueChange={(value) => setEditForm({...editForm, priority: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editBudget">Budget (EUR)</Label>
                  <Input
                    id="editBudget"
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({...editForm, budget: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProgress">Progress (%)</Label>
                  <Input
                    id="editProgress"
                    type="number"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value) || 0})}
                    className="bg-gray-700 border-gray-600"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTags">Tags (comma-separated)</Label>
                <Input
                  id="editTags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  className="bg-gray-700 border-gray-600"
                  placeholder="Design, Development, Frontend"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  )
}