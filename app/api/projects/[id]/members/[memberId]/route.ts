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

// Update member role
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
    const projects = db.collection("projects")

    // Check if user is project owner or has team management permission
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

    // Validate role exists
    const roles = project.roles || []
    const roleExists = roles.find((r: any) => r._id === role || r.name.toLowerCase() === role.toLowerCase())

    if (!roleExists) {
      return NextResponse.json({ error: "Role not found" }, { status: 400 })
    }

    // Update member role
    teamMembers[memberIndex] = {
      ...teamMembers[memberIndex],
      roleId: roleExists._id,
      role: roleExists.name,
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

// Remove member from project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id, memberId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Check if user is project owner or has team management permission
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

    // Remove member from team
    const updatedTeamMembers = (project.teamMembers || []).filter(
      (member: any) => member._id !== memberId
    )

    // Also remove from collaborators if present
    const updatedCollaborators = (project.collaborators || []).filter(
      (collaboratorId: string) => {
        const member = (project.teamMembers || []).find((m: any) => m._id === memberId)
        return collaboratorId !== member?.userId
      }
    )

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

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
