import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: Promise<{
    id: string
    memberId: string
  }>
}

// Update member role specifically
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id, memberId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role } = await request.json()

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")    // Check if user is project owner or has team management permission
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { 
          "teamMembers": {
            $elemMatch: {
              userId: (session.user as any).id,
              "role.permissions.canManageTeam": true
            }
          }
        }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Find the member to update
    const teamMembers = project.teamMembers || []
    const memberIndex = teamMembers.findIndex((member: any) => member._id === memberId)

    if (memberIndex === -1) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

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
    }    // Update member role
    teamMembers[memberIndex] = {
      ...teamMembers[memberIndex],
      roleId: roleData._id,
      role: roleData.name,
      updatedAt: new Date()
    }

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          teamMembers,
          updatedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({ 
      message: "Member role updated successfully",
      member: teamMembers[memberIndex]
    })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
