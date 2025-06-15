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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    const project = await projects.findOne({
      _id: new ObjectId(resolvedParams.id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Add user role information
    const isOwner = project.userId === (session.user as any).id
    const isCollaborator = project.collaborators?.includes((session.user as any).id)

    return NextResponse.json({
      ...project,
      userRole: {
        isOwner,
        isCollaborator,
        canEditProject: isOwner,
        canEditContent: isOwner || isCollaborator,
        canViewAnalytics: isOwner,
        canViewTimeTracking: isOwner
      }
    })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const updateData = await request.json()
    updateData.updatedAt = new Date()

    // Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate)
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate)
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")
    const users = db.collection("users")

    // Check if user has access to the project
    const project = await projects.findOne({
      _id: new ObjectId(resolvedParams.id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.userId === (session.user as any).id
    
    // Only owner can update project details - collaborators cannot edit projects
    if (!isOwner) {
      return NextResponse.json({ 
        error: "Only project owner can edit project details. Collaborators can only edit project content like notes, documents, etc." 
      }, { status: 403 })
    }

    // Process team members if provided (owner only)
    if (updateData.teamMembers) {
      let validatedTeamMembers = []
      const teamMemberEmails = Array.isArray(updateData.teamMembers) ? updateData.teamMembers : 
        updateData.teamMembers.split(',').map((email: string) => email.trim().toLowerCase()).filter((email: string) => email)
      
      for (const email of teamMemberEmails) {
        const user = await users.findOne({ email })
        validatedTeamMembers.push({
          email,
          userId: user ? user._id.toString() : null,
          name: user ? user.name : null,
          isRegistered: !!user,
          addedAt: new Date()
        })
      }
      
      updateData.teamMembers = validatedTeamMembers
      updateData.collaborators = validatedTeamMembers.filter(tm => tm.isRegistered).map(tm => tm.userId)
    }    await projects.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { $set: updateData }
    )

    const updatedProject = await projects.findOne({ _id: new ObjectId(resolvedParams.id) })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    const project = await projects.findOne({
      _id: new ObjectId(resolvedParams.id),
      userId: (session.user as any).id
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await projects.deleteOne({ _id: new ObjectId(resolvedParams.id) })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
