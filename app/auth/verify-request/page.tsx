"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft } from "lucide-react"

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="max-w-md w-full space-y-8 p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              E-Mail verschickt!
            </h1>
            <div className="space-y-4">
              <p className="text-slate-300 text-lg">
                Wir haben Ihnen einen Magic Link gesendet.
              </p>
              <p className="text-slate-400 text-sm">
                Prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Link, um sich anzumelden. 
                Der Link ist 24 Stunden gültig.
              </p>
              <div className="bg-slate-800 rounded-lg p-4 mt-6">
                <p className="text-slate-300 text-sm">
                  <strong>Tipp:</strong> Wenn Sie die E-Mail nicht finden können, prüfen Sie auch Ihren Spam-Ordner.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-6">
            <Link href="/auth/signin">
              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Anmeldung
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
