"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogIn } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 xs:h-16 sm:h-18 md:h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 xs:space-x-3 group">
              <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                <span className="text-white font-bold text-xs xs:text-sm sm:text-base">PD</span>
              </div>
              <span className="text-white font-semibold text-base xs:text-lg sm:text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Personal Dashboard
              </span>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="#features" 
              className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group text-sm lg:text-base"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="/datenschutz" 
              className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group text-sm lg:text-base"
            >
              Datenschutz
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <a 
              href="https://konja-rehm.de/impressum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group text-sm lg:text-base"
            >
              Impressum
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4">
            <Link href="/auth/signin">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/10 border border-slate-700/50 hover:border-slate-600/50 text-xs xs:text-sm px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2"
              >
                <LogIn className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                <span className="hidden xs:inline">Sign In</span>
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-glow text-xs xs:text-sm px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2"
              >
                <User className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                <span className="hidden xs:inline">Get Started</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden ml-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10 p-2"
            >
              <svg className="h-5 w-5 xs:h-6 xs:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
