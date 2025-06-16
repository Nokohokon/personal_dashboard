"use client"

import { useState, useEffect } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Footer from "@/components/ui/footer"
import Navbar from "@/components/ui/navbar"
import { Eye, EyeOff, Lock, Mail, Send } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [error, setError] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [signInMethod, setSignInMethod] = useState<'credentials' | 'magic-link'>('credentials')
  const router = useRouter()
  const { data: session, status } = useSession()

  // Bereits angemeldete Benutzer zum Dashboard weiterleiten
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
      } else {
        // Refresh the session
        await getSession()
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsMagicLinkLoading(true)
    setError("")

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
      })

      if (result?.error) {
        setError("Fehler beim Senden des Magic Links")
      } else {
        setMagicLinkSent(true)
      }
    } catch (error) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setIsMagicLinkLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 from-slate-950 via-purple-950 to-slate-950">
          <div className="max-w-md w-full space-y-8 p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Magic Link gesendet!
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Wir haben Ihnen einen Anmelde-Link an <strong>{email}</strong> gesendet.
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Link, um sich anzumelden.
              </p>
              <Button
                onClick={() => {
                  setMagicLinkSent(false)
                  setEmail("")
                }}
                variant="outline"
                className="mt-6 w-full"
              >
                Zurück zur Anmeldung
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 from-slate-950 via-purple-950 to-slate-950">
      <div className="max-w-md w-full space-y-8 p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to your personal dashboard
          </p>
        </div>

        {/* Sign-in method toggle */}
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setSignInMethod('credentials')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              signInMethod === 'credentials'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Passwort
          </button>
          <button
            type="button"
            onClick={() => setSignInMethod('magic-link')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              signInMethod === 'magic-link'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        {signInMethod === 'credentials' ? (
          <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
            {error && (
              <div className="bg-red-50 bg-red-900/20 border border-red-200 border-red-800 text-red-600 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-700 text-slate-300">
                  Email address
                </Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 text-slate-300">
                  Password
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleMagicLinkSubmit}>
            {error && (
              <div className="bg-red-50 bg-red-900/20 border border-red-200 border-red-800 text-red-600 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Wir senden Ihnen einen sicheren Link zum Anmelden per E-Mail zu.
              </p>
            </div>

            <div>
              <Label htmlFor="magic-email" className="text-slate-700 text-slate-300">
                Email address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="magic-email"
                  name="magic-email"
                  type="email"
                  required
                  className="pl-10"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              disabled={isMagicLinkLoading}
            >
              {isMagicLinkLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sende Magic Link...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="h-4 w-4 mr-2" />
                  Send Magic Link
                </div>
              )}
            </Button>
          </form>
        )}

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-purple-600 hover:text-purple-500 text-purple-400"
            >
              Sign up
            </Link>            </p>
        </div>
      </div>
      </div>

    </div>
  )
}
