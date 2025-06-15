import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    id: string
    roleId: string
  }
}

// Delete specific role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      _id: new ObjectId(params.id),
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
    const roleToDelete = roles.find((role: any) => role._id === params.roleId)

    if (!roleToDelete) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Don't allow deleting default roles
    if (roleToDelete.isDefault) {
      return NextResponse.json({ error: "Cannot delete default roles" }, { status: 400 })
    }

    // Check if role is in use
    const membersWithRole = project.teamMembers?.filter((member: any) => member.roleId === params.roleId) || []
    if (membersWithRole.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete role that is assigned to team members" 
      }, { status: 400 })
    }

    const updatedRoles = roles.filter((role: any) => role._id !== params.roleId)

    await projects.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { roles: updatedRoles, updatedAt: new Date() } }
    )

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
