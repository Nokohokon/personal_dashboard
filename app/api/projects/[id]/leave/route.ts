import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Leave project (remove current user from project)
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Get project and check if user is a member
    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { "teamMembers.userId": (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or you are not a member" }, { status: 404 })
    }

    // Check if user is the project owner
    if (project.userId === (session.user as any).id) {
      return NextResponse.json({ 
        error: "Project owner cannot leave the project. Please transfer ownership or delete the project." 
      }, { status: 400 })
    }

    // Remove user from team members
    const updatedTeamMembers = (project.teamMembers || []).filter(
      (member: any) => member.userId !== (session.user as any).id
    )

    // Remove user from collaborators
    const updatedCollaborators = (project.collaborators || []).filter(
      (collaboratorId: string) => collaboratorId !== (session.user as any).id
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

    return NextResponse.json({ message: "Successfully left the project" })
  } catch (error) {
    console.error("Error leaving project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
