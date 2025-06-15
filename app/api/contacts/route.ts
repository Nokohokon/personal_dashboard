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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query: any = { userId: (session.user as any).id }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ]
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

    const { name, email, phone, company, position, notes, tags } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const contacts = db.collection("contacts")

    // Check if contact with same email already exists for this user
    const existingContact = await contacts.findOne({
      userId: (session.user as any).id,
      email: email.toLowerCase()
    })

    if (existingContact) {
      return NextResponse.json(
        { error: "Contact with this email already exists" },
        { status: 400 }
      )
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
