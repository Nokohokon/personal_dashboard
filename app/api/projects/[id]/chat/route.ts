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
    console.log('🔍 Chat GET - Starting request')
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ Chat GET - No session or email')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = id
    console.log('🔍 Chat GET - Project ID:', projectId, 'User:', session.user.email)
    
    const client = await clientPromise
    const db = client.db()
    const sessionUserId = (session.user as any).id

    console.log('🔍 Chat GET - Session User ID:', sessionUserId)
    console.log('🔍 Chat GET - User email from session:', session.user.email)

    // Get the actual user from database using email to ensure we have the correct ID
    const user = await db.collection('users').findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      console.log('❌ Chat GET - User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const actualUserId = user._id.toString()
    console.log('🔍 Chat GET - Actual User ID from DB:', actualUserId)

    // Check if user has access to this project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { userId: actualUserId },
        { collaborators: actualUserId },
        { 'teamMembers.userId': actualUserId },
        { 'teamMembers.email': session.user.email.toLowerCase() }
      ]
    })

    console.log('🔍 Chat GET - Project access check result:', !!project)
    if (!project) {
      console.log('❌ Chat GET - Project not found or access denied')
      console.log('🔍 Chat GET - Checked for userId:', actualUserId)
      console.log('🔍 Chat GET - Checked for email:', session.user.email.toLowerCase())
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Fetch chat messages for this project
    console.log('🔍 Chat GET - Querying messages for projectId:', projectId)
    const messages = await db.collection('projectChat')
      .find({ projectId: projectId })
      .sort({ timestamp: 1 })
      .limit(200) // Limit to last 200 messages
      .toArray()

    console.log('✅ Chat GET - Found', messages.length, 'messages')
    console.log('🔍 Chat GET - Sample messages:', messages.slice(0, 2).map(msg => ({
      _id: msg._id.toString(),
      userId: msg.userId,
      message: msg.message?.substring(0, 50) + '...',
      timestamp: msg.timestamp
    })))

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
    console.log('📝 Chat POST - Starting request')
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ Chat POST - No session or email')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = id
    const { message } = await request.json()
    console.log('📝 Chat POST - Project ID:', projectId, 'User:', session.user.email)
    
    const client = await clientPromise
    const db = client.db()

    // Get the actual user from database using email to ensure we have the correct ID
    const user = await db.collection('users').findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      console.log('❌ Chat POST - User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const actualUserId = user._id.toString()
    console.log('📝 Chat POST - Actual User ID from DB:', actualUserId)

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
        { userId: actualUserId },
        { collaborators: actualUserId },
        { 'teamMembers.userId': actualUserId },
        { 'teamMembers.email': session.user.email.toLowerCase() }
      ]
    })

    if (!project) {
      console.log('❌ Chat POST - Project not found or access denied')
      console.log('📝 Chat POST - Checked userId:', actualUserId)
      console.log('📝 Chat POST - Checked email:', session.user.email.toLowerCase())
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Create new chat message
    const newMessage: ChatMessage = {
      projectId: projectId,
      userId: actualUserId,
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

    console.log('✅ Chat POST - Message created successfully')
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = id
    const { messageId } = await request.json()
    const client = await clientPromise
    const db = client.db()

    // Get the actual user from database using email
    const user = await db.collection('users').findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const actualUserId = user._id.toString()

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

    const isProjectOwner = project?.userId === actualUserId
    const isMessageOwner = message.userId === actualUserId

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
