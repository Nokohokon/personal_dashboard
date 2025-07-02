import Link from "next/link"
import { ExternalLink } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-3 sm:mb-4">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">PD</span>
              </div>
              <span className="text-white font-semibold text-lg">Personal Dashboard</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs mx-auto md:mx-0">
              Your comprehensive productivity solution for time tracking, CRM, and project management.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-white mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="#features" 
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  href="/datenschutz" 
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <a 
                  href="https://konja-rehm.de/impressum" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center"
                >
                  Impressum
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-white mb-3 sm:mb-4">Informationen</h3>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Konja Rehm
              </p>
              <p className="text-xs text-slate-500">
                Daten werden nur lokal verarbeitet
              </p>
              <p className="text-xs text-slate-500">
                Sichere Authentifizierung mit NextAuth.js
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
              Built with Next.js, TypeScript, MongoDB, and Tailwind CSS
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-500">v1.0.0</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="System Online"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
