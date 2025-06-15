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
    const events = db.collection("events")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query: any = { userId: (session.user as any).id }
    
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      }
    }

    const eventList = await events
      .find(query)
      .sort({ date: 1, time: 1 })
      .toArray()

    return NextResponse.json(eventList)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, date, time, type, projectId, contactId } = await request.json()

    if (!title || !date || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    const newEvent = {
      userId: (session.user as any).id,
      title,
      description: description || "",
      date,
      time: time || null,
      type,
      projectId: projectId || null,
      contactId: contactId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await events.insertOne(newEvent)

    return NextResponse.json(
      { ...newEvent, _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    const event = await events.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await events.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    const updatedEvent = await events.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
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
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    const event = await events.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await events.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
