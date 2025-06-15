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
    const events = db.collection("events")
    const projects = db.collection("projects")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
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
        // Events owned by user
        { userId: (session.user as any).id },
        // Events shared with user
        { collaborators: (session.user as any).id },
        // Events belonging to projects user has access to
        { projectId: { $in: accessibleProjectIds } }
      ]
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      }
    }

    // If projectId is specified, filter to only this project's events
    if (projectId) {
      if (!accessibleProjectIds.includes(projectId)) {
        return NextResponse.json({ error: "Project access denied" }, { status: 403 })
      }
      
      query = {
        projectId: projectId,
        $or: [
          { userId: (session.user as any).id },
          { collaborators: (session.user as any).id },
          { projectId: projectId } // Include all events for this project if user has access
        ]
      }
      
      if (startDate && endDate) {
        query.date = {
          $gte: startDate,
          $lte: endDate
        }
      }
    }

    const eventList = await events
      .find(query)
      .sort({ date: 1, time: 1 })
      .toArray()

    return NextResponse.json(eventList)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, date, time, type, projectId, contactId, recurrence, sharedWith } = await request.json()

    if (!title || !date || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")
    const users = db.collection("users")
    const projects = db.collection("projects")

    // Validate project access if provided
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

    // Handle recurring events
    const eventsToCreate = []
    
    if (recurrence && recurrence.type !== 'none') {
      const eventDate = new Date(date)
      const endDate = recurrence.endDate ? new Date(recurrence.endDate) : new Date(eventDate.getTime() + (365 * 24 * 60 * 60 * 1000)) // Default 1 year
      
      let currentDate = new Date(eventDate)
      let count = 0
      const maxEvents = recurrence.count || 100 // Limit to prevent infinite events
      const parentId = new ObjectId().toString()
      
      while (currentDate <= endDate && count < maxEvents) {
        eventsToCreate.push({
          userId: (session.user as any).id,
          title,
          description: description || "",
          date: currentDate.toISOString().split('T')[0],
          time: time || null,
          type,
          projectId: projectId || null,
          contactId: contactId || null,
          sharedWith: validatedSharedWith,
          collaborators: validatedSharedWith.map(sw => sw.userId),
          recurrence: {
            ...recurrence,
            parentId: parentId,
            isParent: count === 0
          },
          isRecurring: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        // Calculate next occurrence
        switch (recurrence.type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + (recurrence.interval || 1))
            break
          case 'weekly':
            if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
              // Handle specific days of week
              let nextDay = new Date(currentDate)
              let found = false
              for (let i = 1; i <= 7; i++) {
                nextDay.setDate(currentDate.getDate() + i)
                const dayOfWeek = nextDay.getDay()
                if (recurrence.daysOfWeek.includes(dayOfWeek)) {
                  currentDate = nextDay
                  found = true
                  break
                }
              }
              if (!found) {
                currentDate.setDate(currentDate.getDate() + 7 * (recurrence.interval || 1))
              }
            } else {
              currentDate.setDate(currentDate.getDate() + 7 * (recurrence.interval || 1))
            }
            break
          case 'monthly':
            if (recurrence.monthlyType === 'date') {
              // Same date each month
              currentDate.setMonth(currentDate.getMonth() + (recurrence.interval || 1))
            } else if (recurrence.monthlyType === 'weekday') {
              // Same weekday (e.g., 2nd Monday)
              const originalWeekday = eventDate.getDay()
              const originalWeekOfMonth = Math.ceil(eventDate.getDate() / 7)
              currentDate.setMonth(currentDate.getMonth() + (recurrence.interval || 1))
              currentDate.setDate(1)
              
              // Find the correct weekday occurrence
              let weekCount = 0
              while (weekCount < originalWeekOfMonth) {
                if (currentDate.getDay() === originalWeekday) {
                  weekCount++
                  if (weekCount < originalWeekOfMonth) {
                    currentDate.setDate(currentDate.getDate() + 7)
                  }
                } else {
                  currentDate.setDate(currentDate.getDate() + 1)
                }
              }
            }
            break
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + (recurrence.interval || 1))
            break
        }
        count++
      }
    } else {
      // Single event
      eventsToCreate.push({
        userId: (session.user as any).id,
        title,
        description: description || "",
        date,
        time: time || null,
        type,
        projectId: projectId || null,
        contactId: contactId || null,
        sharedWith: validatedSharedWith,
        collaborators: validatedSharedWith.map(sw => sw.userId),
        recurrence: null,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const result = await events.insertMany(eventsToCreate)

    return NextResponse.json(
      { message: `Created ${eventsToCreate.length} event(s)`, events: eventsToCreate },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, projectId, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")
    const projects = db.collection("projects")

    // Check if user has access to the event (owner or collaborator)
    const event = await events.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
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
      
      updateData.projectId = projectId
    } else {
      updateData.projectId = null
    }

    await events.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    const updatedEvent = await events.findOne({ _id: new ObjectId(id) })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
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
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    // Check if user has access to the event (owner or collaborator)
    const event = await events.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await events.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
