"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} Konja Rehm. Alle Rechte vorbehalten.
          </div>
          
          <div className="flex space-x-6 text-sm">
            <Link 
              href="/datenschutz" 
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Datenschutz
            </Link>
            <a 
              href="https://konja-rehm.de/impressum"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Impressum
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Diese Anwendung verarbeitet Ihre Daten ausschließlich lokal und gibt keine Informationen an Dritte weiter.
          </p>
        </div>
      </div>
    </footer>
  )
}
