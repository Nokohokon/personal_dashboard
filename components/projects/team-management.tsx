"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Crown, 
  Shield, 
  User, 
  Users,
  UserPlus, 
  Trash2, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface TeamMember {
  email: string
  userId: string | null
  name: string | null
  isRegistered: boolean
  role?: 'owner' | 'collaborator'
  addedAt: Date
  permissions?: {
    canEditProject: boolean
    canEditContent: boolean
    canViewAnalytics: boolean
    canViewTimeTracking: boolean
    canManageTeam: boolean
  }
}

interface TeamManagementProps {
  projectId: string
  isOwner: boolean
  allMembers: TeamMember[]
  onTeamUpdate: () => void
}

export function TeamManagement({ projectId, isOwner, allMembers, onTeamUpdate }: TeamManagementProps) {
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        setNewMemberEmail("")
        setIsDialogOpen(false)
        onTeamUpdate()
      } else {
        const error = await response.json()
        alert(error.error || "Error adding team member")
      }
    } catch (error) {
      alert("Network error while adding team member")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the project?`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail })
      })

      if (response.ok) {
        onTeamUpdate()
      } else {
        const error = await response.json()
        alert(error.error || "Error removing team member")
      }
    } catch (error) {
      alert("Network error while removing team member")
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <span>Team Members</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage project team members and their access permissions
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
              </DialogTrigger>
              <DialogContent className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-purple-400" />
                    <span>Add Team Member</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white focus:border-purple-500"
                      placeholder="colleague@company.com"
                      required
                    />
                    <p className="text-sm text-gray-400">
                      Team members can view and edit project content, but cannot modify project settings.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? "Adding..." : "Add Member"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {allMembers && allMembers.length > 0 ? (
            allMembers.map((member: TeamMember, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:bg-gray-600/30 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name || member.email}`} />
                    <AvatarFallback className="bg-gray-600 text-white">
                      {getInitials(member.name || "", member.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-white">{member.name || member.email}</p>
                      {member.role === 'owner' && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Crown className="w-3 h-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                      {member.role === 'collaborator' && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <User className="w-3 h-3 mr-1" />
                          Collaborator
                        </Badge>
                      )}
                    </div>
                    {member.name && (
                      <p className="text-sm text-gray-400">{member.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={member.isRegistered ? "default" : "secondary"} className="text-xs">
                        {member.isRegistered ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Registered
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Invited
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Added {formatDate(member.addedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isOwner && member.role !== 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.email)}
                    disabled={isLoading}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Only the project owner is currently on the team</p>
            </div>
          )}
        </div>
        
        {/* Permissions Info */}
        <div className="mt-6 p-4 bg-gray-700/20 rounded-lg border border-gray-600/30">
          <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Team Permissions</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-yellow-400 mb-2">Project Owner:</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Full project management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Team member management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Analytics and time tracking</span>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-400 mb-2">Collaborators:</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>View and edit project content</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span>Cannot modify project settings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span>Cannot manage team members</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
