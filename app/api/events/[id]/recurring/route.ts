import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    id: string
  }
}

// Get recurring event series
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    // Find the parent event
    const parentEvent = await events.findOne({
      _id: new ObjectId(params.id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!parentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }    // If it's a recurring event, get all events in the series
    if (parentEvent.isRecurring && parentEvent.recurrence?.parentId) {
      const seriesEvents = await events
        .find({
          $and: [
            {
              $or: [
                { "recurrence.parentId": parentEvent.recurrence.parentId },
                { _id: new ObjectId(parentEvent.recurrence.parentId) }
              ]
            },
            {
              $or: [
                { userId: (session.user as any).id },
                { collaborators: (session.user as any).id }
              ]
            }
          ]
        })
        .sort({ date: 1 })
        .toArray()

      return NextResponse.json({
        parentEvent,
        seriesEvents,
        totalEvents: seriesEvents.length
      })
    }

    return NextResponse.json({
      parentEvent,
      seriesEvents: [parentEvent],
      totalEvents: 1
    })
  } catch (error) {
    console.error("Error fetching recurring events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update recurring event series
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { updateType, ...updateData } = await request.json()

    if (!updateType || !["single", "future", "all"].includes(updateType)) {
      return NextResponse.json({ error: "Valid updateType required (single, future, all)" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    // Find the target event
    const targetEvent = await events.findOne({
      _id: new ObjectId(params.id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!targetEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is owner or has edit permissions
    const isOwner = targetEvent.userId === (session.user as any).id
    const canEdit = isOwner || targetEvent.collaborators?.includes((session.user as any).id)

    if (!canEdit) {
      return NextResponse.json({ error: "No permission to edit this event" }, { status: 403 })
    }

    updateData.updatedAt = new Date()

    let updateResult

    switch (updateType) {
      case "single":
        // Update only this specific event
        await events.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        )
        updateResult = { updated: 1, message: "Single event updated" }
        break

      case "future":        // Update this event and all future occurrences
        if (targetEvent.isRecurring && targetEvent.recurrence?.parentId) {
          const targetDate = new Date(targetEvent.date)
          const result = await events.updateMany(
            {
              $and: [
                { "recurrence.parentId": targetEvent.recurrence.parentId },
                { date: { $gte: targetEvent.date } },
                {
                  $or: [
                    { userId: (session.user as any).id },
                    { collaborators: (session.user as any).id }
                  ]
                }
              ]
            },
            { $set: updateData }
          )
          updateResult = { updated: result.modifiedCount, message: "Future events updated" }
        } else {
          await events.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updateData }
          )
          updateResult = { updated: 1, message: "Single event updated" }
        }
        break

      case "all":        // Update all events in the recurring series
        if (targetEvent.isRecurring && targetEvent.recurrence?.parentId) {
          const result = await events.updateMany(
            {
              $and: [
                { "recurrence.parentId": targetEvent.recurrence.parentId },
                {
                  $or: [
                    { userId: (session.user as any).id },
                    { collaborators: (session.user as any).id }
                  ]
                }
              ]
            },
            { $set: updateData }
          )
          updateResult = { updated: result.modifiedCount, message: "All events in series updated" }
        } else {
          await events.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updateData }
          )
          updateResult = { updated: 1, message: "Single event updated" }
        }
        break
    }

    return NextResponse.json(updateResult)
  } catch (error) {
    console.error("Error updating recurring events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete recurring event series
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deleteType } = await request.json()

    if (!deleteType || !["single", "future", "all"].includes(deleteType)) {
      return NextResponse.json({ error: "Valid deleteType required (single, future, all)" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const events = db.collection("events")

    // Find the target event
    const targetEvent = await events.findOne({
      _id: new ObjectId(params.id),
      $or: [
        { userId: (session.user as any).id },
        { collaborators: (session.user as any).id }
      ]
    })

    if (!targetEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is owner
    if (targetEvent.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Only event owner can delete events" }, { status: 403 })
    }

    let deleteResult

    switch (deleteType) {
      case "single":
        // Delete only this specific event
        await events.deleteOne({ _id: new ObjectId(params.id) })
        deleteResult = { deleted: 1, message: "Single event deleted" }
        break

      case "future":
        // Delete this event and all future occurrences
        if (targetEvent.isRecurring && targetEvent.recurrence?.parentId) {
          const result = await events.deleteMany({
            "recurrence.parentId": targetEvent.recurrence.parentId,
            date: { $gte: targetEvent.date },
            userId: (session.user as any).id
          })
          deleteResult = { deleted: result.deletedCount, message: "Future events deleted" }
        } else {
          await events.deleteOne({ _id: new ObjectId(params.id) })
          deleteResult = { deleted: 1, message: "Single event deleted" }
        }
        break

      case "all":
        // Delete all events in the recurring series
        if (targetEvent.isRecurring && targetEvent.recurrence?.parentId) {
          const result = await events.deleteMany({
            "recurrence.parentId": targetEvent.recurrence.parentId,
            userId: (session.user as any).id
          })
          deleteResult = { deleted: result.deletedCount, message: "All events in series deleted" }
        } else {
          await events.deleteOne({ _id: new ObjectId(params.id) })
          deleteResult = { deleted: 1, message: "Single event deleted" }
        }
        break
    }

    return NextResponse.json(deleteResult)
  } catch (error) {
    console.error("Error deleting recurring events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
