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
    const { email, permission } = await request.json()

    if (!email || !permission) {
      return NextResponse.json(
        { error: "Email and permission are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    
    // Überprüfen, ob das Projekt existiert und der Benutzer Berechtigung hat
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id)
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Überprüfen, ob der aktuelle Benutzer Berechtigung zum Teilen hat
    const userMember = project.members?.find((member: any) => 
      member.email === session.user.email
    )

    const canShare = project.owner === session.user.email || 
                    userMember?.role?.canManageMembers ||
                    userMember?.role?.isOwner

    if (!canShare) {
      return NextResponse.json(
        { error: "Insufficient permissions to share project" },
        { status: 403 }
      )
    }

    // Überprüfen, ob der Benutzer bereits ein Mitglied ist
    const existingMember = project.members?.find((member: any) => 
      member.email === email
    )

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      )
    }

    // Rolle basierend auf der Berechtigung definieren
    let roleData
    switch (permission) {
      case 'admin':
        roleData = {
          name: 'Admin',
          canEditProject: true,
          canManageMembers: true,
          canDeleteProject: false,
          isOwner: false
        }
        break
      case 'editor':
        roleData = {
          name: 'Editor',
          canEditProject: true,
          canManageMembers: false,
          canDeleteProject: false,
          isOwner: false
        }
        break
      case 'viewer':
      default:
        roleData = {
          name: 'Viewer',
          canEditProject: false,
          canManageMembers: false,
          canDeleteProject: false,
          isOwner: false
        }
        break
    }

    // Überprüfen, ob der eingeladene Benutzer bereits existiert
    const invitedUser = await db.collection("users").findOne({ email })
    const newMember = {
      email,
      name: invitedUser?.name || email.split('@')[0],
      userId: invitedUser?._id || null,
      role: roleData,
      joinedAt: new Date(),
      invitedBy: session.user.email
    }

    // Mitglied zum Projekt hinzufügen
    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { members: newMember },
        $set: { updatedAt: new Date() }
      }
    )

    // Optional: Einladungsbenachrichtigung senden (Email, etc.)
    // Hier könnten Sie eine Email-Service-Integration hinzufügen

    return NextResponse.json({ 
      message: "Project shared successfully",
      member: newMember
    })
  } catch (error) {
    console.error("Share project error:", error)
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
    
    // Projektmitglieder abrufen
    const project = await db.collection("projects").findOne(
      { _id: new ObjectId(id) },
      { projection: { members: 1, owner: 1 } }
    )

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      members: project.members || [],
      owner: project.owner
    })
  } catch (error) {
    console.error("Get project members error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
