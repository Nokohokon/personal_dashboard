"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogIn } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                <span className="text-white font-bold text-sm">PD</span>
              </div>
              <span className="text-white font-semibold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Personal Dashboard
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="#features" 
              className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="/datenschutz" 
              className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group"
            >
              Datenschutz
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <a 
              href="https://konja-rehm.de/impressum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group"
            >
              Impressum
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/10 border border-slate-700/50 hover:border-slate-600/50"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-glow"
              >
                <User className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
