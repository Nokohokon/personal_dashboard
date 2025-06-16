import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get project collaborators
export async function GET(
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

    const project = await projects.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      teamMembers: project.teamMembers || [],
      collaborators: project.collaborators || []
    })
  } catch (error) {
    console.error("Error fetching project collaborators:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Add collaborators to project
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Emails array is required" }, { status: 400 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")
    const users = db.collection("users")

    // Check if user is project owner
    const project = await projects.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!project) {
      return NextResponse.json({ error: "Only project owner can add collaborators" }, { status: 403 })
    }

    // Validate and process new team members
    const newTeamMembers = []
    const validatedEmails = emails.map(email => email.trim().toLowerCase()).filter(email => email)

    for (const email of validatedEmails) {
      const user = await users.findOne({ email })
      const isAlreadyMember = project.teamMembers?.some((tm: any) => tm.email === email)
      
      if (!isAlreadyMember) {
        newTeamMembers.push({
          email,
          userId: user ? user._id.toString() : null,
          name: user ? user.name : null,
          isRegistered: !!user,
          addedAt: new Date()
        })
      }
    }

    if (newTeamMembers.length === 0) {
      return NextResponse.json({ message: "All emails are already team members" })
    }

    // Update project with new team members
    const updatedTeamMembers = [...(project.teamMembers || []), ...newTeamMembers]
    const updatedCollaborators = [
      ...(project.collaborators || []),
      ...newTeamMembers.filter(tm => tm.isRegistered).map(tm => tm.userId)
    ]

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
      message: `Added ${newTeamMembers.length} new team member(s)`,
      addedMembers: newTeamMembers
    })
  } catch (error) {
    console.error("Error adding collaborators:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Remove collaborator from project
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    // Check if user is project owner
    const project = await projects.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!project) {
      return NextResponse.json({ error: "Only project owner can remove collaborators" }, { status: 403 })
    }

    // Remove team member
    const updatedTeamMembers = (project.teamMembers || []).filter((tm: any) => tm.email !== email.toLowerCase())
    const removedMember = (project.teamMembers || []).find((tm: any) => tm.email === email.toLowerCase())
    
    let updatedCollaborators = project.collaborators || []
    if (removedMember && removedMember.userId) {
      updatedCollaborators = updatedCollaborators.filter((id: string) => id !== removedMember.userId)
    }

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

    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
