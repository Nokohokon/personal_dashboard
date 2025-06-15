import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface ProjectRole {
  _id?: string
  name: string
  description?: string
  permissions: {
    canEditProject: boolean
    canDeleteProject: boolean
    canManageTeam: boolean
    canManageRoles: boolean
    canViewContent: boolean
    canCreateContent: boolean
    canEditContent: boolean
    canDeleteContent: boolean
    canViewAnalytics: boolean
    canViewTimeTracking: boolean
    canManageTimeEntries: boolean
    canViewDocuments: boolean
    canCreateDocuments: boolean
    canEditDocuments: boolean
    canDeleteDocuments: boolean
    canViewNotes: boolean
    canCreateNotes: boolean
    canEditNotes: boolean
    canDeleteNotes: boolean
    canViewContacts: boolean
    canCreateContacts: boolean
    canEditContacts: boolean
    canDeleteContacts: boolean
    canViewEvents: boolean
    canCreateEvents: boolean
    canEditEvents: boolean
    canDeleteEvents: boolean
  }
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

interface User {
  _id?: string
  email: string
  name?: string
  userId?: string
  isRegistered: boolean
  role: string
  roleId?: string
  permissions?: {
    canManageTeam: boolean
    canManageRoles: boolean
  }
  addedAt: Date
}

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Standardrollen erstellen
const createDefaultRoles = (): ProjectRole[] => [
  {
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
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
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
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
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
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Get project roles
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Check if user has access to the project
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { "teamMembers.userId": (session.user as any).id }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // If no roles exist, create default roles
    let roles = project.roles || []
    if (roles.length === 0) {
      roles = createDefaultRoles()
      await projects.updateOne(
        { _id: new ObjectId(id) },
        { $set: { roles, updatedAt: new Date() } }
      )
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching project roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create new role
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roleData = await request.json()
    const { name, description, permissions } = roleData

    if (!name || !permissions) {
      return NextResponse.json(
        { error: "Name and permissions are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Check if user is project owner or has role management permission
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { 
          "teamMembers": {
            $elemMatch: {
              userId: (session.user as any).id,
              "role.permissions.canManageRoles": true
            }
          }
        }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const newRole: ProjectRole = {
      _id: new ObjectId().toString(),
      name,
      description,
      permissions,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const currentRoles = project.roles || []
    const updatedRoles = [...currentRoles, newRole]

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: { roles: updatedRoles, updatedAt: new Date() } }
    )

    return NextResponse.json(newRole)
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roleId, name, description, permissions } = await request.json()

    if (!roleId || !name || !permissions) {
      return NextResponse.json(
        { error: "Role ID, name, and permissions are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Check permissions
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { 
          "teamMembers": {
            $elemMatch: {
              userId: (session.user as any).id,
              "role.permissions.canManageRoles": true
            }
          }
        }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const roles = project.roles || []
    const roleIndex = roles.findIndex((role: any) => role._id === roleId)

    if (roleIndex === -1) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Don't allow updating default roles
    if (roles[roleIndex].isDefault) {
      return NextResponse.json({ error: "Cannot update default roles" }, { status: 400 })
    }

    // Update the role
    roles[roleIndex] = {
      ...roles[roleIndex],
      name,
      description,
      permissions,
      updatedAt: new Date()
    }

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: { roles, updatedAt: new Date() } }
    )

    return NextResponse.json(roles[roleIndex])
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Check permissions
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { 
          "teamMembers": {
            $elemMatch: {
              userId: (session.user as any).id,
              "role.permissions.canManageRoles": true
            }
          }
        }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const roleId = new URL(request.url).pathname.split('/').pop()
    const roles = project.roles || []
    const roleToDelete = roles.find((role: any) => role._id === roleId)

    if (!roleToDelete) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Don't allow deleting default roles
    if (roleToDelete.isDefault) {
      return NextResponse.json({ error: "Cannot delete default roles" }, { status: 400 })
    }

    // Check if any team members are using this role
    const membersWithRole = (project.teamMembers || []).filter((member: any) => member.roleId === roleId)
    if (membersWithRole.length > 0) {
      return NextResponse.json({ error: "Cannot delete role that is currently assigned to team members" }, { status: 400 })
    }

    const updatedRoles = roles.filter((role: any) => role._id !== roleId)

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: { roles: updatedRoles, updatedAt: new Date() } }
    )

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
