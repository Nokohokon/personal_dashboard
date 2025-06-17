import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Get all team members for a project (including owner)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")
    const users = db.collection("users")

    // Get the actual user from database using email to ensure we have the correct ID
    const user = await users.findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const actualUserId = user._id.toString()

    // Check if user has access to the project
    const project = await projects.findOne({
      _id: new ObjectId(resolvedParams.id),
      $or: [
        { userId: actualUserId },
        { collaborators: actualUserId },
        { 'teamMembers.userId': actualUserId },
        { 'teamMembers.email': session.user.email.toLowerCase() }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get project owner information
    const owner = await users.findOne({ _id: new ObjectId(project.userId) })
    
    // Prepare all team members list (owner + collaborators)
    const allTeamMembers = []

    // Add owner as first member
    if (owner) {
      allTeamMembers.push({
        email: owner.email,
        userId: owner._id.toString(),
        name: owner.name,
        isRegistered: true,
        role: 'owner',
        addedAt: project.createdAt || new Date(),
        permissions: {
          canEditProject: true,
          canEditContent: true,
          canViewAnalytics: true,
          canViewTimeTracking: true,
          canManageTeam: true
        }
      })
    }

    // Add collaborators/team members
    if (project.teamMembers && project.teamMembers.length > 0) {
      for (const member of project.teamMembers) {
        // Skip if this is the owner (already added)
        if (member.email !== owner?.email) {
          // Use the actual role stored in the database, fallback to 'collaborator' if not found
          const memberRole = member.role || 'collaborator'
          
          // Get role permissions from project roles if available
          let rolePermissions = {
            canEditProject: false,
            canEditContent: member.isRegistered,
            canViewAnalytics: false,
            canViewTimeTracking: false,
            canManageTeam: false
          }

          // Try to find the role definition in project roles
          if (project.roles && member.roleId) {
            const roleDefinition = project.roles.find((r: any) => r._id === member.roleId || r.name.toLowerCase() === memberRole.toLowerCase())
            if (roleDefinition && roleDefinition.permissions) {
              rolePermissions = roleDefinition.permissions
            }
          }

          allTeamMembers.push({
            ...member,
            role: memberRole,
            permissions: rolePermissions
          })
        }
      }
    }

    return NextResponse.json({
      projectId: resolvedParams.id,
      projectName: project.name,
      totalMembers: allTeamMembers.length,
      owner: allTeamMembers.find(m => m.role === 'owner'),
      collaborators: allTeamMembers.filter(m => m.role === 'collaborator'),
      allMembers: allTeamMembers
    })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Add new member to project
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, role = 'viewer' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")
    const users = db.collection("users")

    // Get the actual user from database using email to ensure we have the correct ID
    const user = await users.findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const actualUserId = user._id.toString()

    // Check if user is project owner or has team management permission
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: actualUserId },
        { 
          "teamMembers": {
            $elemMatch: {
              userId: actualUserId,
              "role.permissions.canManageTeam": true
            }
          }
        }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Check if user is already in the project
    const isAlreadyMember = project.teamMembers?.some((member: any) => member.email === email) ||
                           project.collaborators?.includes(email)

    if (isAlreadyMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 })
    }

    // Check if user is registered
    const targetUser = await users.findOne({ email })
    
    // Default roles that are always available
    const defaultRoles = [
      {
        _id: "default-owner",
        name: "Owner",
        description: "Vollzugriff auf alle Projektfunktionen",
        permissions: {
          canEditProject: true,
          canDeleteProject: true,
          canManageTeam: true,
          canManageRoles: true,
          canViewContent: true,
          canCreateContent: true,
          canEditContent: true,
          canDeleteContent: true,
          canViewAnalytics: true,
          canViewTimeTracking: true,
          canManageTimeEntries: true,
          canViewDocuments: true,
          canCreateDocuments: true,
          canEditDocuments: true,
          canDeleteDocuments: true,
          canViewNotes: true,
          canCreateNotes: true,
          canEditNotes: true,
          canDeleteNotes: true,
          canViewContacts: true,
          canCreateContacts: true,
          canEditContacts: true,
          canDeleteContacts: true,
          canViewEvents: true,
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: true
        },
        isDefault: true
      },
      {
        _id: "default-editor",
        name: "Editor",
        description: "Kann Projektinhalte bearbeiten, aber keine Projekteinstellungen ändern",
        permissions: {
          canEditProject: false,
          canDeleteProject: false,
          canManageTeam: false,
          canManageRoles: false,
          canViewContent: true,
          canCreateContent: true,
          canEditContent: true,
          canDeleteContent: false,
          canViewAnalytics: false,
          canViewTimeTracking: false,
          canManageTimeEntries: false,
          canViewDocuments: true,
          canCreateDocuments: true,
          canEditDocuments: true,
          canDeleteDocuments: false,
          canViewNotes: true,
          canCreateNotes: true,
          canEditNotes: true,
          canDeleteNotes: false,
          canViewContacts: true,
          canCreateContacts: true,
          canEditContacts: true,
          canDeleteContacts: false,
          canViewEvents: true,
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: false
        },
        isDefault: true
      },
      {
        _id: "default-viewer",
        name: "Viewer",
        description: "Kann Projektinhalte nur anzeigen",
        permissions: {
          canEditProject: false,
          canDeleteProject: false,
          canManageTeam: false,
          canManageRoles: false,
          canViewContent: true,
          canCreateContent: false,
          canEditContent: false,
          canDeleteContent: false,
          canViewAnalytics: false,
          canViewTimeTracking: false,
          canManageTimeEntries: false,
          canViewDocuments: true,
          canCreateDocuments: false,
          canEditDocuments: false,
          canDeleteDocuments: false,
          canViewNotes: true,
          canCreateNotes: false,
          canEditNotes: false,
          canDeleteNotes: false,
          canViewContacts: true,
          canCreateContacts: false,
          canEditContacts: false,
          canDeleteContacts: false,
          canViewEvents: true,
          canCreateEvents: false,
          canEditEvents: false,
          canDeleteEvents: false
        },
        isDefault: true
      }
    ]
    
    // Combine project-specific roles with default roles
    const projectRoles = project.roles || []
    const allRoles = [...defaultRoles, ...projectRoles]
    
    // Validate role exists (check both by ID and name, case-insensitive)
    const roleData = allRoles.find((r: any) => 
      r._id === role || 
      r.name.toLowerCase() === role.toLowerCase() ||
      (role === 'editor' && r.name.toLowerCase() === 'editor') ||
      (role === 'viewer' && r.name.toLowerCase() === 'viewer') ||
      (role === 'owner' && r.name.toLowerCase() === 'owner')
    )

    if (!roleData) {
      console.log('Available roles:', allRoles.map(r => r.name))
      console.log('Requested role:', role)
      return NextResponse.json({ error: "Role not found" }, { status: 400 })
    }

    const newMember = {
      _id: new ObjectId().toString(),
      email,
      name: targetUser?.name || null,
      userId: targetUser?._id?.toString() || null,
      isRegistered: !!targetUser,
      roleId: roleData._id,
      role: roleData.name,
      addedAt: new Date(),
      addedBy: (session.user as any).id
    }

    // Add to team members
    const currentTeamMembers = project.teamMembers || []
    const updatedTeamMembers = [...currentTeamMembers, newMember]

    // Add to collaborators if user is registered
    const currentCollaborators = project.collaborators || []
    const updatedCollaborators = targetUser ? [...currentCollaborators, targetUser._id.toString()] : currentCollaborators

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          teamMembers: updatedTeamMembers,
          collaborators: updatedCollaborators,
          updatedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({ 
      message: "Member added successfully",
      member: newMember
    })
  } catch (error) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
