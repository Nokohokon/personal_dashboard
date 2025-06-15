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

    const document = await documents.findOne({
      _id: new ObjectId(params.id),
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
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    const updatedDocument = await documents.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Error updating document:", error)
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
    const documents = db.collection("documents")

    const document = await documents.findOne({
      _id: new ObjectId(params.id),
      userId: (session.user as any).id
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    await documents.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
