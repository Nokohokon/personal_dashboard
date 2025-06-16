import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    
    // Überprüfen, ob das Projekt existiert
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id)
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Projekt als Favorit/gespeichert für den Benutzer markieren
    // Dies kann in einer separaten "saved_projects" Sammlung oder als Feld im Benutzerprofil gespeichert werden
    const result = await db.collection("user_saved_projects").updateOne(
      { 
        userId: session.user.email,
        projectId: new ObjectId(id)
      },
      {
        $set: {
          userId: session.user.email,
          projectId: new ObjectId(id),
          savedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ 
      message: "Project saved successfully",
      saved: true 
    })
  } catch (error) {
    console.error("Save project error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    
    // Projekt aus den gespeicherten Projekten entfernen
    await db.collection("user_saved_projects").deleteOne({
      userId: session.user.email,
      projectId: new ObjectId(id)
    })

    return NextResponse.json({ 
      message: "Project removed from saved",
      saved: false 
    })
  } catch (error) {
    console.error("Unsave project error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const client = await clientPromise
    const db = client.db()
    
    // Überprüfen, ob das Projekt gespeichert ist
    const savedProject = await db.collection("user_saved_projects").findOne({
      userId: session.user.email,
      projectId: new ObjectId(id)
    })

    return NextResponse.json({ 
      saved: !!savedProject 
    })
  } catch (error) {
    console.error("Check saved project error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
