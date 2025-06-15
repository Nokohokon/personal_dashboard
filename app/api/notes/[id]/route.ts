import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, category, tags, contactId } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const notes = db.collection("notes")

    const note = await notes.findOne({
      _id: new ObjectId(params.id),
      userId: (session.user as any).id
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const updateData = {
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || "General",
      tags: Array.isArray(tags) ? tags : [],
      contactId: contactId || null,
      updatedAt: new Date()
    }

    await notes.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    const updatedNote = await notes.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error("Error updating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const notes = db.collection("notes")

    const note = await notes.findOne({
      _id: new ObjectId(params.id),
      userId: (session.user as any).id
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await notes.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
