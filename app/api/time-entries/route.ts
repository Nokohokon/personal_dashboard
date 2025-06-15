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
    const timeEntries = db.collection("timeEntries")
    const projects = db.collection("projects")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const project = searchParams.get("project")

    // Time entries are only visible to the owner
    // Collaborators cannot see time tracking data
    let query: any = { userId: (session.user as any).id }
    
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    if (project) {
      query.project = project
    }

    const entries = await timeEntries
      .find(query)
      .sort({ startTime: -1 })
      .toArray()

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { project, task, startTime, endTime, description } = await request.json()

    if (!project || !task || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const timeEntries = db.collection("timeEntries")

    const newEntry = {
      userId: (session.user as any).id,
      project,
      task,
      description: description || "",
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration: endTime ? new Date(endTime).getTime() - new Date(startTime).getTime() : null,
      isActive: !endTime,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await timeEntries.insertOne(newEntry)

    return NextResponse.json(
      { ...newEntry, _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, endTime, description } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing entry ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const timeEntries = db.collection("timeEntries")

    const entry = await timeEntries.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (endTime) {
      updateData.endTime = new Date(endTime)
      updateData.duration = new Date(endTime).getTime() - entry.startTime.getTime()
      updateData.isActive = false
    }

    if (description !== undefined) {
      updateData.description = description
    }

    await timeEntries.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    const updatedEntry = await timeEntries.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error updating time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
