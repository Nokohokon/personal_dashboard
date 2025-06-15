import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const notes = db.collection("notes")

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const contactId = searchParams.get("contactId")

    let query: any = { userId: (session.user as any).id }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ]
    }

    if (category) {
      query.category = category
    }

    if (contactId) {
      query.contactId = contactId
    }

    const noteList = await notes
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(noteList)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const newNote = {
      userId: (session.user as any).id,
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || "General",
      tags: Array.isArray(tags) ? tags : [],
      contactId: contactId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await notes.insertOne(newNote)

    return NextResponse.json(
      { ...newNote, _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
