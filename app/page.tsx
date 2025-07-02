"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Footer from "@/components/ui/footer"
import Navbar from "@/components/ui/navbar"
import { ArrowRight, BarChart3, Clock, Users, Zap } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect
  }  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 xs:mb-5 sm:mb-6">
              Your Personal
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {" "}Dashboard
              </span>
            </h1>
            <p className="text-base xs:text-lg sm:text-xl md:text-xl text-slate-300 mb-6 xs:mb-7 sm:mb-8 max-w-2xl xs:max-w-3xl mx-auto px-4 xs:px-0">
              Manage your time, track projects, organize your CRM, and boost productivity with our 
              comprehensive personal dashboard solution.
            </p>
            <div className="flex flex-col xs:flex-col sm:flex-row gap-3 xs:gap-4 justify-center px-4 xs:px-0">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full xs:w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm xs:text-base sm:text-base px-6 xs:px-8 py-3 xs:py-3.5">
                  Get Started <ArrowRight className="ml-2 h-4 w-4 xs:h-5 xs:w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="w-full xs:w-full sm:w-auto border-slate-600 text-white hover:bg-slate-800 text-sm xs:text-base sm:text-base px-6 xs:px-8 py-3 xs:py-3.5">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>      {/* Features Section */}
      <div id="features" className="py-12 xs:py-16 sm:py-20 md:py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-8 xs:mb-12 sm:mb-16">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-4xl font-bold text-white mb-3 xs:mb-4">
              Everything you need in one place
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto px-4 xs:px-0">
              Powerful features designed to help you stay organized and productive.
            </p>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6 sm:gap-8">
            <div className="text-center p-4 xs:p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div className="mx-auto h-10 w-10 xs:h-12 xs:w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-3 xs:mb-4">
                <Clock className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
              </div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Time Tracking</h3>
              <p className="text-sm xs:text-base text-slate-300">
                Track your time across projects and tasks with detailed analytics.
              </p>
            </div>
            
            <div className="text-center p-4 xs:p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div className="mx-auto h-10 w-10 xs:h-12 xs:w-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center mb-3 xs:mb-4">
                <Users className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
              </div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">CRM Notes</h3>
              <p className="text-sm xs:text-base text-slate-300">
                Manage contacts and keep detailed notes about your relationships.
              </p>
            </div>
            
            <div className="text-center p-4 xs:p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div className="mx-auto h-10 w-10 xs:h-12 xs:w-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-3 xs:mb-4">
                <BarChart3 className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
              </div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Analytics</h3>
              <p className="text-sm xs:text-base text-slate-300">
                Get insights into your productivity with detailed reports and charts.
              </p>
            </div>
            
            <div className="text-center p-4 xs:p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div className="mx-auto h-10 w-10 xs:h-12 xs:w-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center mb-3 xs:mb-4">
                <Zap className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
              </div>
              <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Automation</h3>
              <p className="text-sm xs:text-base text-slate-300">
                Automate repetitive tasks and streamline your workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
