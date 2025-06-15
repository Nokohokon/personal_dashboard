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
    const notes = db.collection("notes")
    const projects = db.collection("projects")

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const contactId = searchParams.get("contactId")
    const projectId = searchParams.get("projectId")

    // Get all projects the user has access to (as owner or collaborator)
    const accessibleProjects = await projects.find({
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    }).toArray()

    const accessibleProjectIds = accessibleProjects.map(p => p._id.toString())

    // Build query with project collaboration support
    let query: any = {
      $or: [
        // Notes owned by user
        { userId: (session.user as any).id },
        // Notes shared with user
        { collaborators: (session.user as any).id },
        // Notes belonging to projects user has access to
        { projectId: { $in: accessibleProjectIds } }
      ]
    }

    // If projectId is specified, check if user has access to that project
    if (projectId) {
      if (!accessibleProjectIds.includes(projectId)) {
        return NextResponse.json({ error: "Project access denied" }, { status: 403 })
      }
      
      // Filter to only this project's notes
      query = {
        projectId: projectId,
        $or: [
          { userId: (session.user as any).id },
          { collaborators: (session.user as any).id },
          { projectId: projectId } // Include all notes for this project if user has access
        ]
      }
    }

    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } }
          ]
        }
      ]
      delete query.$or
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

    const { title, content, category, tags, contactId, sharedWith, projectId } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const notes = db.collection("notes")
    const users = db.collection("users")
    const projects = db.collection("projects")

    // If projectId is provided, verify user has access to the project
    if (projectId) {
      const project = await projects.findOne({
        _id: new ObjectId(projectId),
        $or: [
          { userId: (session.user as any).id },
          { collaborators: (session.user as any).id }
        ]
      })
      
      if (!project) {
        return NextResponse.json({ error: "Project access denied" }, { status: 403 })
      }
    }

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

    const newNote = {
      userId: (session.user as any).id,
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || "General",
      tags: Array.isArray(tags) ? tags : [],
      contactId: contactId || null,
      projectId: projectId || null,
      sharedWith: validatedSharedWith,
      collaborators: validatedSharedWith.map(sw => sw.userId),
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
