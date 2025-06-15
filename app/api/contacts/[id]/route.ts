import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    const { name, email, phone, company, position, notes, tags, projectId } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    const contacts = db.collection("contacts")
    const projects = db.collection("projects")
    
    // Check if user has access to the contact (owner or collaborator)
    const contact = await contacts.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // If projectId is provided, validate that user has access to that project
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

    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      notes: notes?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      projectId: projectId || null,
      updatedAt: new Date()
    }

    await contacts.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    const updatedContact = await contacts.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    const contacts = db.collection("contacts")

    // Check if user has access to the contact (owner or collaborator)
    const contact = await contacts.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    await contacts.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Contact deleted successfully" })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
