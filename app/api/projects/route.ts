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

    let query: any = { userId: (session.user as any).id }
    
    if (status && status !== "all") {
      query.status = status
    }

    const projectList = await projects
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(projectList)
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
    }

    const client_ = await clientPromise
    const db = client_.db()
    const projects = db.collection("projects")

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
      progress: progress || 0,
      teamMembers: teamMembers || [],
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

    const project = await projects.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
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
