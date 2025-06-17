import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, password } = await request.json()

    if (!currentPassword || !password) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const users = client.db().collection("users")

    const user = await users.findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json({ 
        error: "User has no password set. Use add-password endpoint instead." 
      }, { status: 400 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user with new password
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      message: "Password changed successfully" 
    })

  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
