"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TeamManagement } from "./team-management"
import RoleManagement from "./role-management-v2"

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

interface ProjectDetailsProps {
  project: any
  isOwner: boolean
  onProjectUpdate: () => void
}

export function ProjectDetails({ project, isOwner, onProjectUpdate }: ProjectDetailsProps) {
  const [allMembers, setAllMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (project._id) {
      fetchAllMembers()
    }
  }, [project._id])

  const fetchAllMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${project._id}/members`)
      if (response.ok) {
        const data = await response.json()
        setAllMembers(data.allMembers || [])
      } else {
        console.error("Failed to fetch team members")
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeamUpdate = () => {
    fetchAllMembers()
    onProjectUpdate()
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'default'
      case 'on-hold': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }
  return (
    <div className="space-y-6">
      {/* Team Management and Role Management in Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TeamManagement
            projectId={project._id}
            isOwner={isOwner}
            allMembers={allMembers}
            onTeamUpdate={handleTeamUpdate}
          />
        </div>

        <div>
          <RoleManagement
            projectId={project._id}
            canManageRoles={isOwner || project.userRole?.canManageRoles}
            onRolesUpdate={handleTeamUpdate}
          />
        </div>
      </div>

      {/* Enhanced Project Statistics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <p className="text-3xl font-bold text-blue-400">{allMembers.length}</p>
              <p className="text-gray-400 text-sm">Total Members</p>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <p className="text-3xl font-bold text-green-400">
                {allMembers.filter(m => m.isRegistered).length}
              </p>
              <p className="text-gray-400 text-sm">Active Members</p>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <p className="text-3xl font-bold text-orange-400">
                {allMembers.filter(m => !m.isRegistered).length}
              </p>
              <p className="text-gray-400 text-sm">Pending Invites</p>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <p className="text-3xl font-bold text-purple-400">
                {allMembers.filter(m => m.role === 'owner').length}
              </p>
              <p className="text-gray-400 text-sm">Owners</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced User Permissions Info */}
      {project.userRole && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Access Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${project.userRole.isOwner ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                <div>
                  <p className="text-white font-medium">Role</p>
                  <p className="text-gray-400 text-sm">
                    {project.userRole.isOwner ? "Project Owner" : "Team Member"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${project.userRole.canEditProject ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <p className="text-white font-medium">Edit Project</p>
                  <p className="text-gray-400 text-sm">
                    {project.userRole.canEditProject ? "Allowed" : "Restricted"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${project.userRole.canEditContent ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <p className="text-white font-medium">Edit Content</p>
                  <p className="text-gray-400 text-sm">
                    {project.userRole.canEditContent ? "Allowed" : "Restricted"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${project.userRole.canViewAnalytics ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <p className="text-white font-medium">View Analytics</p>
                  <p className="text-gray-400 text-sm">
                    {project.userRole.canViewAnalytics ? "Allowed" : "Restricted"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${project.userRole.canViewTimeTracking ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <p className="text-white font-medium">Time Tracking</p>
                  <p className="text-gray-400 text-sm">
                    {project.userRole.canViewTimeTracking ? "Allowed" : "Restricted"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${isOwner || project.userRole.canManageTeam ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <p className="text-white font-medium">Team Management</p>
                  <p className="text-gray-400 text-sm">
                    {isOwner || project.userRole.canManageTeam ? "Allowed" : "Restricted"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
