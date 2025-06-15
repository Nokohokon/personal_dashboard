"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { ProjectDetails } from "@/components/projects/project-details"
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
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings, 
  Share2,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Target,
  Eye,
  TrendingUp,
  FileText,
  MessageSquare,
  Activity,
  Plus,
  Star,
  Download,
  Upload,
  LinkIcon,
  Bookmark,
  Timer,
  GitBranch,
  Zap,
  Shield,
  Globe,
  Building,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  PieChart,
  Filter,
  Crown
} from "lucide-react"

export default function ProjectDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    tags: ""
  })

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
      tags: project.tags ? project.tags.join(", ") : ""
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
          tags: editForm.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
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

  const calculateProgress = () => {
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

  // Loading state with professional skeleton
  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="animate-pulse space-y-6">
              {/* Header skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-32 bg-gray-700 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-8 w-64 bg-gray-700 rounded"></div>
                    <div className="h-4 w-48 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 w-24 bg-gray-700 rounded"></div>
                  <div className="h-10 w-24 bg-gray-700 rounded"></div>
                </div>
              </div>
              
              {/* Stats cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
              
              {/* Main content skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-96 bg-gray-700 rounded-lg"></div>
                  <div className="h-64 bg-gray-700 rounded-lg"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-gray-700 rounded-lg"></div>
                  <div className="h-32 bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state - project not found
  if (!project) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
              <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
              <p className="text-gray-400 mb-8 max-w-md">
                The project you're looking for doesn't exist or you don't have permission to access it.
              </p>
              <Button 
                onClick={() => router.push("/dashboard/projects")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isOwner = project.userId === (session?.user as any)?.id
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-6 py-8 space-y-8">          {/* Enhanced Header Section with better professional layout */}
          <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-start space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard/projects")}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-3 rounded-xl transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex items-start space-x-6">
                  <div className={`p-4 rounded-2xl ${getStatusColor(project.status)} shadow-lg ring-2 ring-white/10`}>
                    {getStatusIcon(project.status)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                        {project.name}
                      </h1>
                      <div className="flex items-center space-x-2 flex-wrap">
                        {isOwner && (
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-md">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        <Badge variant="secondary" className="flex items-center space-x-1 bg-gray-700/70 hover:bg-gray-600 transition-colors">
                          {getStatusIcon(project.status)}
                          <span className="capitalize">{project.status}</span>
                        </Badge>
                        <Badge className={`${getPriorityColor(project.priority)} text-white border-none shadow-md hover:shadow-lg transition-shadow`}>
                          <Star className="w-3 h-3 mr-1" />
                          {project.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-gray-400 flex-wrap gap-y-2">
                      {project.client && (
                        <div className="flex items-center space-x-2 hover:text-gray-300 transition-colors">
                          <Building className="w-4 h-4" />
                          <span className="font-medium">{project.client}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 hover:text-gray-300 transition-colors">
                        <CalendarDays className="w-4 h-4" />
                        <span>Started {formatDate(project.startDate)}</span>
                      </div>
                      {project.endDate && (
                        <div className="flex items-center space-x-2 hover:text-gray-300 transition-colors">
                          <Timer className="w-4 h-4" />
                          <span>Due {formatDate(project.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons with better spacing */}
              <div className="flex items-center space-x-3 lg:flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-700/50 border-gray-600 hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-700/50 border-gray-600 hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </Button>
                
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProject}
                      className="bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30 transition-all duration-200 hover:scale-105"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30 transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>            {/* Professional Progress and Quick Stats Section */}
            <Separator className="my-6 bg-gray-700/50" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Project Metrics</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Progress</span>
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-300 text-sm">Overall</span>
                      <span className="text-2xl font-bold text-white">{project.progress || calculateProgress()}%</span>
                    </div>
                    <Progress value={project.progress || calculateProgress()} className="h-2.5" />
                    <p className="text-xs text-blue-300/80">
                      {project.progress || calculateProgress() >= 75 ? 'Excellent progress!' : 
                       project.progress || calculateProgress() >= 50 ? 'Good progress' : 
                       'Getting started'}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-5 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-purple-400 font-semibold text-sm uppercase tracking-wide">Team</span>
                    <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end space-x-2">
                      <span className="text-3xl font-bold text-white">
                        {(project.teamMembers?.length || 0) + 1}
                      </span>
                      <span className="text-gray-400 text-sm pb-1">members</span>
                    </div>
                    <p className="text-xs text-purple-300/80">Including project owner</p>
                  </div>
                </div>

                {project.budget && (
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-5 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">Budget</span>
                      <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                        <DollarSign className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-white block">
                        {formatCurrency(project.budget)}
                      </span>
                      <p className="text-xs text-green-300/80">Total allocated</p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-5 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-orange-400 font-semibold text-sm uppercase tracking-wide">Deadline</span>
                    <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                      <Calendar className="w-5 h-5 text-orange-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end space-x-2">
                      <span className="text-2xl font-bold text-white">
                        {project.endDate 
                          ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                          : '∞'
                        }
                      </span>
                      <span className="text-gray-400 text-sm pb-1">days left</span>
                    </div>
                    <p className="text-xs text-orange-300/80">
                      {project.endDate 
                        ? (new Date(project.endDate) > new Date() ? 'On schedule' : 'Overdue')
                        : 'No deadline set'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div></div>          {/* Enhanced Professional Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-1.5 shadow-lg">
              <TabsTrigger 
                value="overview" 
                className="flex items-center space-x-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="flex items-center space-x-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Team & Roles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center space-x-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400 transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="flex items-center space-x-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400 transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">Files</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="flex items-center space-x-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-pink-600/20 data-[state=active]:text-pink-400 transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Activity</span>
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center space-x-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-400 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Settings</span>
                </TabsTrigger>
              )}
            </TabsList>            <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Main Project Info */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Project Description Card */}
                  <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3 text-xl">
                        <div className="p-2.5 bg-blue-500/20 rounded-xl ring-1 ring-blue-500/30">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <span>Project Description</span>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Detailed overview of the project scope and objectives
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-300 leading-relaxed text-base">
                          {project.description || 'No description available for this project. Add a description to help team members understand the project goals and scope.'}
                        </p>
                      </div>
                      
                      {project.tags && project.tags.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Project Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="bg-gray-700/60 hover:bg-gray-600/60 transition-colors px-3 py-1 text-sm"
                              >
                                <span className="text-gray-300">#</span>{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Project Progress Section */}
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            <span>Project Completion</span>
                          </h4>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-white">{project.progress || calculateProgress()}%</span>
                            <p className="text-xs text-gray-400">Complete</p>
                          </div>
                        </div>
                        <Progress value={project.progress || calculateProgress()} className="h-3 mb-3" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">
                            Started: {formatDate(project.startDate)}
                          </span>
                          <span className="text-gray-400">
                            {project.endDate ? `Due: ${formatDate(project.endDate)}` : 'No deadline'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-3 text-lg">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-blue-400" />
                          </div>
                          <span>Project Health</span>
                        </CardTitle>
                        <CardDescription>Overall project status assessment</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center ring-2 ring-green-500/30">
                            <CheckCircle className="w-7 h-7 text-green-400" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white">Excellent</p>
                            <p className="text-sm text-gray-400">Project is on track</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-xs text-green-400">Active</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-3 text-lg">
                          <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-400" />
                          </div>
                          <span>Time Management</span>
                        </CardTitle>
                        <CardDescription>Timeline and deadline tracking</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center ring-2 ring-orange-500/30">
                            <Timer className="w-7 h-7 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white">
                              {project.endDate 
                                ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                                : '∞'
                              } days
                            </p>
                            <p className="text-sm text-gray-400">Until deadline</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                project.endDate && new Date(project.endDate) < new Date() 
                                  ? 'bg-red-400' 
                                  : 'bg-orange-400'
                              }`}></div>
                              <span className={`text-xs ${
                                project.endDate && new Date(project.endDate) < new Date() 
                                  ? 'text-red-400' 
                                  : 'text-orange-400'
                              }`}>
                                {project.endDate && new Date(project.endDate) < new Date() ? 'Overdue' : 'On Schedule'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>                {/* Enhanced Professional Sidebar */}
                <div className="space-y-6">
                  {/* Project Timeline Card */}
                  <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <span>Timeline</span>
                      </CardTitle>
                      <CardDescription>Project schedule and milestones</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-400 font-medium">Start Date</span>
                          <span className="font-semibold text-white">{formatDate(project.startDate)}</span>
                        </div>
                        {project.endDate && (
                          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                            <span className="text-gray-400 font-medium">End Date</span>
                            <span className="font-semibold text-white">{formatDate(project.endDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-400 font-medium">Duration</span>
                          <span className="font-semibold text-white">
                            {project.endDate 
                              ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
                              : 'Ongoing'
                            } days
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-400 font-medium">Last Updated</span>
                          <span className="font-semibold text-white">{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Quick Actions Card */}
                  <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <Zap className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span>Quick Actions</span>
                      </CardTitle>
                      <CardDescription>Frequently used project actions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gray-700/30 border-gray-600 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02]"
                      >
                        <FileText className="w-4 h-4 mr-3 text-blue-400" />
                        <span>View Documents</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gray-700/30 border-gray-600 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02]"
                      >
                        <BarChart3 className="w-4 h-4 mr-3 text-green-400" />
                        <span>Analytics Dashboard</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gray-700/30 border-gray-600 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02]"
                      >
                        <MessageSquare className="w-4 h-4 mr-3 text-purple-400" />
                        <span>Team Chat</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gray-700/30 border-gray-600 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02]"
                      >
                        <Download className="w-4 h-4 mr-3 text-orange-400" />
                        <span>Export Data</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Project Stats Summary */}
                  <Card className="bg-gradient-to-br from-gray-800/60 to-gray-700/30 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <PieChart className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span>At a Glance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}></div>
                            <span className="text-sm text-gray-400">Status</span>
                          </div>
                          <span className="text-sm font-medium text-white capitalize">{project.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className="text-sm text-gray-400">Priority</span>
                          </div>
                          <span className="text-sm font-medium text-white capitalize">{project.priority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span className="text-sm text-gray-400">Team Size</span>
                          </div>
                          <span className="text-sm font-medium text-white">{(project.teamMembers?.length || 0) + 1}</span>
                        </div>
                        {project.budget && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-3 h-3 text-green-400" />
                              <span className="text-sm text-gray-400">Budget</span>
                            </div>
                            <span className="text-sm font-medium text-white">{formatCurrency(project.budget)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div></TabsContent>            <TabsContent value="team" className="animate-in fade-in-50 duration-200">
              <ProjectDetails
                project={project}
                isOwner={isOwner}
                onProjectUpdate={handleProjectUpdate}
              />
            </TabsContent>

            <TabsContent value="analytics" className="animate-in fade-in-50 duration-200">
              <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl ring-1 ring-blue-500/30">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <span>Project Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive insights and performance metrics for your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-20">
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-10 max-w-lg mx-auto border border-blue-500/30">
                      <div className="mb-6">
                        <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-blue-500/30">
                          <BarChart3 className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Analytics Dashboard</h3>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                          Advanced analytics and insights are being developed to provide you with detailed project performance metrics
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                          <PieChart className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">Performance</p>
                          <p className="text-xs text-gray-500">Metrics & KPIs</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                          <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">Trends</p>
                          <p className="text-xs text-gray-500">Growth Analysis</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Request Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="animate-in fade-in-50 duration-200">
              <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2.5 bg-green-500/20 rounded-xl ring-1 ring-green-500/30">
                      <FileText className="w-5 h-5 text-green-400" />
                    </div>
                    <span>Project Files</span>
                  </CardTitle>
                  <CardDescription>
                    Manage documents, images, and other project assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-20">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-10 max-w-lg mx-auto border border-green-500/30">
                      <div className="mb-6">
                        <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-green-500/30">
                          <FileText className="w-10 h-10 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">File Management</h3>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                          Advanced file management system with version control and collaboration features coming soon
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                          <Upload className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">Upload</p>
                          <p className="text-xs text-gray-500">Add Files</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                          <Download className="w-5 h-5 text-green-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">Download</p>
                          <p className="text-xs text-gray-500">Export</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                          <Share2 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">Share</p>
                          <p className="text-xs text-gray-500">Collaborate</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="animate-in fade-in-50 duration-200">
              <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-500/20 rounded-xl ring-1 ring-purple-500/30">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <span>Project Activity</span>
                  </CardTitle>
                  <CardDescription>
                    Track recent changes and team activity across your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-20">
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-10 max-w-lg mx-auto border border-purple-500/30">
                      <div className="mb-6">
                        <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-purple-500/30">
                          <Activity className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Activity Feed</h3>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                          Real-time activity tracking with notifications and team collaboration features
                        </p>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="bg-gray-700/50 rounded-xl p-4 flex items-center space-x-3 hover:bg-gray-600/50 transition-colors">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-300">Team Communications</p>
                            <p className="text-xs text-gray-500">Chat & Comments</p>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4 flex items-center space-x-3 hover:bg-gray-600/50 transition-colors">
                          <GitBranch className="w-5 h-5 text-green-400" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-300">Project Updates</p>
                            <p className="text-xs text-gray-500">Changes & Milestones</p>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4 flex items-center space-x-3 hover:bg-gray-600/50 transition-colors">
                          <Clock className="w-5 h-5 text-orange-400" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-300">Timeline Events</p>
                            <p className="text-xs text-gray-500">Deadlines & Tasks</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="bg-purple-600/20 border-purple-500 text-purple-400 hover:bg-purple-600/30">
                        <Eye className="w-4 h-4 mr-2" />
                        View Activity
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>            {isOwner && (
              <TabsContent value="settings" className="animate-in fade-in-50 duration-200">
                <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2.5 bg-gray-500/20 rounded-xl ring-1 ring-gray-500/30">
                        <Settings className="w-5 h-5 text-gray-400" />
                      </div>
                      <span>Project Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure project settings, permissions, and advanced options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-20">
                      <div className="bg-gradient-to-br from-gray-500/20 to-slate-500/20 rounded-2xl p-10 max-w-lg mx-auto border border-gray-500/30">
                        <div className="mb-6">
                          <div className="w-20 h-20 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-gray-500/30">
                            <Settings className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">Advanced Settings</h3>
                          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                            Comprehensive project configuration with advanced permissions and integration options
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-300">Security</p>
                            <p className="text-xs text-gray-500">Access Control</p>
                          </div>
                          <div className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-600/50 transition-colors">
                            <Globe className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-300">Integrations</p>
                            <p className="text-xs text-gray-500">Third-party Apps</p>
                          </div>
                        </div>
                        
                        <Button variant="outline" className="bg-gray-600/20 border-gray-500 text-gray-400 hover:bg-gray-600/30">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>          {/* Enhanced Professional Edit Project Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 text-white max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <DialogHeader className="pb-6">
                <DialogTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Edit className="w-5 h-5 text-blue-400" />
                  </div>
                  <span>Edit Project</span>
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Update your project details and settings. Changes will be saved automatically.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleUpdateProject} className="space-y-6">
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-sm font-medium text-gray-300">Project Name *</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="Enter project name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-client" className="text-sm font-medium text-gray-300">Client</Label>
                        <Input
                          id="edit-client"
                          value={editForm.client}
                          onChange={(e) => setEditForm(prev => ({ ...prev, client: e.target.value }))}
                          className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="Client name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description" className="text-sm font-medium text-gray-300">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                        rows={4}
                        placeholder="Describe your project goals and scope..."
                      />
                    </div>
                  </div>

                  {/* Project Status Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Project Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-status" className="text-sm font-medium text-gray-300">Status</Label>
                        <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="planning">🎯 Planning</SelectItem>
                            <SelectItem value="active">⚡ Active</SelectItem>
                            <SelectItem value="on-hold">⏸️ On Hold</SelectItem>
                            <SelectItem value="completed">✅ Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority" className="text-sm font-medium text-gray-300">Priority</Label>
                        <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="low">🟢 Low</SelectItem>
                            <SelectItem value="medium">🟡 Medium</SelectItem>
                            <SelectItem value="high">🟠 High</SelectItem>
                            <SelectItem value="critical">🔴 Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Timeline & Budget Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Timeline & Budget</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-start-date" className="text-sm font-medium text-gray-300">Start Date</Label>
                        <Input
                          id="edit-start-date"
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                          className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-end-date" className="text-sm font-medium text-gray-300">End Date</Label>
                        <Input
                          id="edit-end-date"
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                          className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-budget" className="text-sm font-medium text-gray-300">Budget ($)</Label>
                        <Input
                          id="edit-budget"
                          type="number"
                          value={editForm.budget}
                          onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                          className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-tags" className="text-sm font-medium text-gray-300">Tags</Label>
                        <Input
                          id="edit-tags"
                          value={editForm.tags}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Enhanced Professional Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="bg-gray-800/90 backdrop-blur-xl border border-red-500/30 text-white shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3 text-red-400">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span>Delete Project</span>
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  Are you sure you want to delete <span className="font-semibold text-white">"{project.name}"</span>? 
                  This action cannot be undone and will permanently remove all project data, including:
                </DialogDescription>
              </DialogHeader>
              
              <div className="my-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>All project files and documents</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Team member assignments and roles</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Project timeline and milestones</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Activity history and analytics</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  className="bg-red-600 hover:bg-red-700 transition-colors shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  )
}
