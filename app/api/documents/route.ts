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
    const projects = db.collection("projects")

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    // Get all projects the user has access to (as owner or collaborator)
    const accessibleProjects = await projects.find({
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    }).toArray()

    const accessibleProjectIds = accessibleProjects.map(p => p._id.toString())

    let query: any = {
      $or: [
        // Documents owned by user
        { userId: (session.user as any).id },
        // Documents shared with user
        { collaborators: (session.user as any).id },
        // Documents belonging to projects user has access to
        { projectId: { $in: accessibleProjectIds } }
      ]
    }

    // If projectId is specified, filter to only this project's documents
    if (projectId) {
      if (!accessibleProjectIds.includes(projectId)) {
        return NextResponse.json({ error: "Project access denied" }, { status: 403 })
      }
      
      query = {
        projectId: projectId,
        $or: [
          { userId: (session.user as any).id },
          { collaborators: (session.user as any).id },
          { projectId: projectId } // Include all documents for this project if user has access
        ]
      }
    }

    const docs = await documents
      .find(query)
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

    const { title, content, category, tags, fileType, sharedWith, projectId } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }    const client = await clientPromise
    const db = client.db()
    const documents = db.collection("documents")
    const users = db.collection("users")

    // Validate shared users if provided
    let validatedSharedWith = []
    if (sharedWith && sharedWith.length > 0) {
      const sharedEmails = Array.isArray(sharedWith) ? sharedWith : 
        sharedWith.split(',').map((email: string) => email.trim().toLowerCase()).filter((email: string) => email)
      
      for (const email of sharedEmails) {
        const user = await users.findOne({ email })
        if (user) {
          validatedSharedWith.push({
            email,
            userId: user._id.toString(),
            name: user.name,
            sharedAt: new Date()
          })
        }
      }
    }

    const newDocument = {
      userId: (session.user as any).id,
      title,
      content,
      category: category || "General",
      tags: Array.isArray(tags) ? tags : [],
      fileType: fileType || "text",
      size: content.length,
      projectId: projectId || null,
      sharedWith: validatedSharedWith,
      collaborators: validatedSharedWith.map(sw => sw.userId),
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
