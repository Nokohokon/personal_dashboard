"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { TeamChat } from "@/components/projects/team-chat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MessageSquare, Users, FolderOpen } from "lucide-react"

interface Project {
  _id: string
  name: string
  description: string
  status: string
  priority: string
  userId: string
  members?: any[]
  createdAt: string
  updatedAt: string
}

interface TeamMember {
  email: string
  userId: string | null
  name: string | null
  isRegistered: boolean
  role: 'owner' | 'collaborator'
  addedAt: Date
  isOnline?: boolean
  lastSeen?: Date
}

function TeamChatContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Handle URL parameter for pre-selected project
  useEffect(() => {
    const projectId = searchParams.get("projectId")
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p._id === projectId)
      if (project) {
        setSelectedProject(project)
        fetchTeamMembers(projectId)
      }
    }
  }, [searchParams, projects])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setTeamMembers([])
    }
  }

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p._id === projectId)
    if (project) {
      setSelectedProject(project)
      fetchTeamMembers(projectId)
      
      // Update URL without triggering navigation
      const url = new URL(window.location.href)
      url.searchParams.set("projectId", projectId)
      window.history.replaceState({}, "", url.toString())
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

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-6 py-4 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <MessageSquare className="w-8 h-8 mr-3 text-purple-400" />
                  Team Chat
                </h1>
                <p className="text-gray-400 mt-1">
                  Collaborate with your team in real-time
                </p>
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <FolderOpen className="w-5 h-5 mr-2 text-blue-400" />
                Select Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select
                    value={selectedProject?._id || ""}
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Choose a project to chat about..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {projects.map((project) => (
                        <SelectItem
                          key={project._id}
                          value={project._id}
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="w-4 h-4 text-blue-400" />
                            <span>{project.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProject && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{teamMembers.length} members</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Chat */}
          {selectedProject ? (
            <div className="flex-1 space-y-4 min-h-0">
              <TeamChat
                projectId={selectedProject._id}
                projectName={selectedProject.name}
                allMembers={teamMembers}
              />
            </div>
          ) : (
            <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Project Selected
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  Select a project from the dropdown above to start chatting with your team members.
                </p>
                {projects.length === 0 && (
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push("/dashboard/projects")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

export default function TeamChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse" />
                <div className="w-32 h-6 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="w-48 h-10 bg-gray-700 rounded-lg animate-pulse" />
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
              <div className="lg:col-span-1 space-y-4">
                <div className="w-full h-32 bg-gray-700/50 rounded-lg animate-pulse" />
                <div className="w-full h-48 bg-gray-700/50 rounded-lg animate-pulse" />
              </div>
              <div className="lg:col-span-3">
                <div className="w-full h-full bg-gray-700/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <TeamChatContent />
    </Suspense>
  )
}
