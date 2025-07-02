"use client"

import { useState } from "react"

export default function ProjectDetailsPage() {
  const [project, setProject] = useState<any>(null)
  const isOwner = true

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full">
        <h1>Test Project Details</h1>
      </div>
    </div>
  )
}
