import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface ChatMessage {
  _id?: ObjectId
  projectId: string
  userId: string
  userName: string
  userEmail: string
  message: string
  timestamp: Date
  type: 'message' | 'system'
  isEdited?: boolean
  editedAt?: Date
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = id
    const client = await clientPromise
    const db = client.db()
    const userId = (session.user as any).id

    // Check if user has access to this project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { userId: userId },
        { 'teamMembers.userId': userId },
        { 'teamMembers.email': session.user.email }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Fetch chat messages for this project
    const messages = await db.collection('projectChat')
      .find({ projectId: projectId })
      .sort({ timestamp: 1 })
      .limit(200) // Limit to last 200 messages
      .toArray()

    return NextResponse.json({ 
      success: true, 
      messages: messages.map(msg => ({
        ...msg,
        _id: msg._id.toString()
      }))
    })

  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = id
    const { message } = await request.json()
    const client = await clientPromise
    const db = client.db()
    const userId = (session.user as any).id

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 })
    }

    // Check if user has access to this project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { userId: userId },
        { 'teamMembers.userId': userId },
        { 'teamMembers.email': session.user.email }
      ]
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Create new chat message
    const newMessage: ChatMessage = {
      projectId: projectId,
      userId: userId,
      userName: session.user.name || '',
      userEmail: session.user.email || '',
      message: message.trim(),
      timestamp: new Date(),
      type: 'message'
    }

    const result = await db.collection('projectChat').insertOne(newMessage)

    const createdMessage = {
      ...newMessage,
      _id: result.insertedId.toString()
    }

    return NextResponse.json({ 
      success: true, 
      message: createdMessage 
    })

  } catch (error) {
    console.error('Error sending chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const { messageId } = await request.json()
    const { db } = await connectToDatabase()
    const userId = (session.user as any).id

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Check if user owns the message or is project owner
    const message = await db.collection('projectChat').findOne({
      _id: new ObjectId(messageId),
      projectId: projectId
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId)
    })

    const isProjectOwner = project?.userId === userId
    const isMessageOwner = message.userId === userId

    if (!isProjectOwner && !isMessageOwner) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete the message
    await db.collection('projectChat').deleteOne({
      _id: new ObjectId(messageId)
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
