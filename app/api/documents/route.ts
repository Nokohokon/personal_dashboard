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
    const documents = db.collection("documents")

    const docs = await documents
      .find({ userId: (session.user as any).id })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(docs)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, category, tags, fileType } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const documents = db.collection("documents")

    const newDocument = {
      userId: (session.user as any).id,
      title,
      content,
      category: category || "General",
      tags: Array.isArray(tags) ? tags : [],
      fileType: fileType || "text",
      size: content.length,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await documents.insertOne(newDocument)

    return NextResponse.json(
      { ...newDocument, _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, title, content, category, tags, fileType } = await request.json()

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const documents = db.collection("documents")

    const document = await documents.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const updateData = {
      title,
      content,
      category: category || "General",
      tags: Array.isArray(tags) ? tags : [],
      fileType: fileType || "text",
      size: content.length,
      updatedAt: new Date()
    }

    await documents.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    const updatedDocument = await documents.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Error updating document:", error)
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
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const documents = db.collection("documents")

    const document = await documents.findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).id
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    await documents.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
