import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const users = client.db().collection("users")

    // Find user by email
    const user = await users.findOne({ email: session.user.email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
      message: "Password added successfully. You can now use email/password login." 
    })

  } catch (error) {
    console.error("Add password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
