"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function AuthSuccess() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      // Kurz warten und dann zum Dashboard weiterleiten
      const timer = setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

      return () => clearTimeout(timer)
    } else if (status === "unauthenticated") {
      // Wenn nicht authentifiziert, zurück zur Anmeldung
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
          <div className="max-w-md w-full space-y-8 p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-white">
                Authentifizierung läuft...
              </h1>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="max-w-md w-full space-y-8 p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Erfolgreich angemeldet!
            </h1>
            <p className="text-slate-300 text-lg mb-4">
              Willkommen zurück{session?.user?.email && `, ${session.user.email}`}!
            </p>
            <p className="text-slate-400 text-sm">
              Sie werden automatisch zu Ihrem Dashboard weitergeleitet...
            </p>
            <div className="mt-6">
              <div className="animate-pulse flex justify-center">
                <div className="h-2 w-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
