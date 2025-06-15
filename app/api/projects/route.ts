import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query: any = {
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    }
    
    if (status && status !== "all") {
      query.status = status
    }    const projectList = await projects
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()

    // Add user role information to each project
    const projectsWithRoles = projectList.map(project => {
      const isOwner = project.userId === (session.user as any).id
      const isCollaborator = project.collaborators?.includes((session.user as any).id)

      return {
        ...project,
        userRole: {
          isOwner,
          isCollaborator,
          canEditProject: isOwner, // Only owner can edit project details
          canEditContent: isOwner || isCollaborator, // Both can edit content
          canViewAnalytics: isOwner, // Only owner can view analytics
          canViewTimeTracking: isOwner, // Only owner can view time tracking
          canManageTeam: isOwner // Only owner can manage team
        }
      }
    })

    return NextResponse.json(projectsWithRoles)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      name, 
      description, 
      status, 
      priority, 
      startDate, 
      endDate, 
      client, 
      budget, 
      tags, 
      progress, 
      teamMembers 
    } = await request.json()

    if (!name || !description || !status || !priority || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }    const client_ = await clientPromise
    const db = client_.db()
    const projects = db.collection("projects")
    const users = db.collection("users")
    
    // Validate team member emails and check if they are registered users
    let validatedTeamMembers = []
    if (teamMembers && teamMembers.length > 0) {
      const teamMemberEmails = Array.isArray(teamMembers) ? teamMembers : 
        teamMembers.split(',').map((email: string) => email.trim().toLowerCase()).filter((email: string) => email)
      
      // Check which team members are registered users
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
    }

    const newProject = {
      userId: (session.user as any).id,
      name,
      description,
      status,
      priority,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      client: client || null,
      budget: budget || null,
      tags: tags || [],
      progress: progress || 0,      teamMembers: validatedTeamMembers,
      collaborators: validatedTeamMembers.filter(tm => tm.isRegistered).map(tm => tm.userId),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await projects.insertOne(newProject)

    return NextResponse.json(
      { ...newProject, _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 })
    }

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
    const users = db.collection("users")    // Check if user is owner or collaborator
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

    const isOwner = project.userId === (session.user as any).id

    // Only project owner can update project details - collaborators cannot edit projects
    if (!isOwner) {
      return NextResponse.json({ 
        error: "Only project owner can edit project details. Collaborators can only edit project content like notes, documents, etc." 
      }, { status: 403 })
    }

    // Process team members if provided
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
    }

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    const updatedProject = await projects.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const projects = db.collection("projects")

    const project = await projects.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await projects.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
