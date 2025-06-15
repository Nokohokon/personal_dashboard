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
    const contacts = db.collection("contacts")
    const projects = db.collection("projects")

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
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
        // Contacts owned by user
        { userId: (session.user as any).id },
        // Contacts shared with user
        { collaborators: (session.user as any).id },
        // Contacts belonging to projects user has access to
        { projectId: { $in: accessibleProjectIds } }
      ]
    }

    // If projectId is specified, filter to only this project's contacts
    if (projectId) {
      if (!accessibleProjectIds.includes(projectId)) {
        return NextResponse.json({ error: "Project access denied" }, { status: 403 })
      }
      
      query = {
        projectId: projectId,
        $or: [
          { userId: (session.user as any).id },
          { collaborators: (session.user as any).id },
          { projectId: projectId } // Include all contacts for this project if user has access
        ]
      }
    }
    
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { company: { $regex: search, $options: "i" } }
          ]
        }
      ]
      delete query.$or
    }

    const contactList = await contacts
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(contactList)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone, company, position, notes, tags, sharedWith, projectId } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }    const client = await clientPromise
    const db = client.db()
    const contacts = db.collection("contacts")
    const users = db.collection("users")

    // Check if contact with same email already exists for this user or collaborators
    const existingContact = await contacts.findOne({
      $or: [
        { userId: (session.user as any).id, email: email.toLowerCase() },
        { collaborators: (session.user as any).id, email: email.toLowerCase() }
      ]
    })

    if (existingContact) {
      return NextResponse.json(
        { error: "Contact with this email already exists" },
        { status: 400 }
      )
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

    const newContact = {
      userId: (session.user as any).id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      notes: notes?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      projectId: projectId || null,
      sharedWith: validatedSharedWith,
      collaborators: validatedSharedWith.map(sw => sw.userId),
      lastContact: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await contacts.insertOne(newContact)

    return NextResponse.json(
      { ...newContact, _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
