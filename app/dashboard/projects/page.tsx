"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, Plus, Edit, Trash2, Calendar, Users, Target, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react"
import { format } from "date-fns"

interface Project {
  _id: string
  name: string
  description: string
  status: "active" | "completed" | "on-hold" | "planning"
  priority: "low" | "medium" | "high" | "critical"
  startDate: string
  endDate?: string
  client?: string
  budget?: number
  tags: string[]
  progress: number
  teamMembers: (string | { email?: string; name?: string; [key: string]: any })[]
  createdAt: string
  updatedAt: string
  userRole?: {
    isOwner: boolean
    isCollaborator: boolean
    canEditProject: boolean
    canEditContent: boolean
    canViewAnalytics: boolean
    canViewTimeTracking: boolean
    canManageTeam: boolean
  }
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status_, setStatus_] = useState<"active" | "completed" | "on-hold" | "planning">("planning")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [client, setClient] = useState("")
  const [budget, setBudget] = useState("")
  const [tags, setTags] = useState("")
  const [progress, setProgress] = useState(0)
  const [teamMembers, setTeamMembers] = useState("")

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
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const projectData = {
      name,
      description,
      status: status_,
      priority,
      startDate,
      endDate: endDate || undefined,
      client: client || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      progress,
      teamMembers: teamMembers.split(",").map(member => member.trim()).filter(member => member)
    }

    try {
      const url = editingProject ? `/api/projects/${editingProject._id}` : "/api/projects"
      const method = editingProject ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData)
      })

      if (res.ok) {
        fetchProjects()
        resetForm()
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error saving project:", error)
    }
  }
  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setName(project.name)
    setDescription(project.description)
    setStatus_(project.status)
    setPriority(project.priority)
    setStartDate(project.startDate.split('T')[0])
    setEndDate(project.endDate ? project.endDate.split('T')[0] : "")
    setClient(project.client || "")
    setBudget(project.budget?.toString() || "")
    setTags(project.tags.join(", "))
    setProgress(project.progress)
      // Handle teamMembers - check if they are objects or strings
    if (project.teamMembers && project.teamMembers.length > 0) {
      const teamMemberStrings = project.teamMembers.map(member => {
        // If member is an object, extract email or name
        if (typeof member === 'object' && member !== null) {
          const memberObj = member as { email?: string; name?: string; [key: string]: any }
          return memberObj.email || memberObj.name || String(member)
        }
        // If member is already a string, use it as is
        return String(member)
      })
      setTeamMembers(teamMemberStrings.join(", "))
    } else {
      setTeamMembers("")
    }
    
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setStatus_("planning")
    setPriority("medium")
    setStartDate("")
    setEndDate("")
    setClient("")
    setBudget("")
    setTags("")
    setProgress(0)
    setTeamMembers("")
    setEditingProject(null)
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-gray-400">Manage your projects and track progress</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "Edit Project" : "Create New Project"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client">Client (Optional)</Label>
                    <Input
                      id="client"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status_} onValueChange={(value: any) => setStatus_(value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-600">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-600">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget (Optional)</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0.00"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="progress">Progress (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="web, mobile, urgent"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="teamMembers">Team Members (comma-separated)</Label>
                  <Input
                    id="teamMembers"
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    placeholder="John Doe, Jane Smith"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingProject ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white sm:w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusOptions.map(status => {
            const count = projects.filter(p => p.status === status.value).length
            const StatusIcon = status.icon
            return (
              <Card key={status.value} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{status.label}</p>
                      <p className="text-2xl font-bold text-white">{count}</p>
                    </div>
                    <div className={`p-2 rounded-full ${status.color}`}>
                      <StatusIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const statusOption = statusOptions.find(s => s.value === project.status)
            const priorityOption = priorityOptions.find(p => p.value === project.priority)
            const StatusIcon = statusOption?.icon || FolderOpen

            return (
              <Card key={project._id} className="bg-gray-800 border-gray-700 min-w-0 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <StatusIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-lg truncate">
                          {project.name}
                        </CardTitle>
                        {/* Show role badge for non-owners directly under title */}
                        {!project.userRole?.isOwner && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              Mitarbeiter
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 min-w-fit">
                      {/* View Details button for all users */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 h-8 w-8"
                        title="Projektdetails anzeigen"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Edit button only for project owners */}
                      {project.userRole?.canEditProject && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(project)}
                          className="text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 h-8 w-8"
                          title="Projekt bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Delete button only for project owners */}
                      {project.userRole?.isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(project._id)}
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-700 p-1.5 h-8 w-8"
                          title="Projekt löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${statusOption?.color} text-white text-xs px-2 py-1 flex-shrink-0`}>
                      {statusOption?.label}
                    </Badge>
                    <Badge className={`${priorityOption?.color} text-white text-xs px-2 py-1 flex-shrink-0`}>
                      {priorityOption?.label}
                    </Badge>
                  </div>

                  {project.client && (
                    <div className="text-sm text-gray-400 truncate">
                      <span className="text-gray-500">Client:</span> <span className="text-blue-400">{project.client}</span>
                    </div>
                  )}

                  <div className="text-sm text-gray-300 line-clamp-2 break-words">
                    {project.description}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {project.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded truncate max-w-16 flex-shrink-0"
                          title={`#${tag}`}
                        >
                          #{tag}
                        </span>
                      ))}
                      {project.tags.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-600 text-gray-400 rounded flex-shrink-0">
                          +{project.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{format(new Date(project.startDate), "MMM dd, yyyy")}</span>
                    </div>
                    {project.teamMembers.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Users className="w-3 h-3" />
                        <span>{project.teamMembers.length}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm || selectedStatus !== "all" ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedStatus !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Create your first project to get started"
              }
            </p>
            {!searchTerm && selectedStatus === "all" && (
              <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
