import Footer from "@/components/ui/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Navbar from "@/components/ui/navbar"

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link 
              href="/" 
              className="text-purple-600 hover:text-purple-700 text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              ← Back to Homepage
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white">
                Privacy Policy
              </CardTitle>
              <p className="text-slate-400">
                Last updated: {new Date().toLocaleDateString('en-US')}
              </p>
            </CardHeader>
            
            <CardContent className="prose prose-slate prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Data Controller</h2>
                <p className="mb-4">
                  The data controller for data processing on this website is:
                </p>
                <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                  <p>
                    For more information, please see the{" "}
                    <a 
                      href="https://konja-rehm.de/impressum" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 text-purple-400 hover:text-purple-300"
                    >
                      Legal Notice
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Data Collection</h2>
                <p className="mb-4">
                  This personal dashboard application collects and processes the following data:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 text-blue-300 mb-2">User Account Data</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Email address (for login and identification)</li>
                      <li>Name (optional, if provided)</li>
                      <li>Encrypted password</li>
                      <li>Creation and last login time</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 text-green-300 mb-2">Time Tracking Data</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Project name and task description</li>
                      <li>Start and end times of time tracking</li>
                      <li>Additional notes on time entries</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 bg-orange-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 text-orange-300 mb-2">CRM and Contact Data</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Contact information (name, email, phone, company)</li>
                      <li>Notes on contacts</li>
                      <li>Tags and categorizations</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 text-purple-300 mb-2">Documents and Projects</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Document content and metadata</li>
                      <li>Project descriptions and status</li>
                      <li>Calendar entries and appointments</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Purpose of Data Processing</h2>
                <p className="mb-4">
                  Your data is processed exclusively for the following purposes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Providing personal dashboard functionalities</li>
                  <li>Authentication and user account management</li>
                  <li>Storing your personal productivity data</li>
                  <li>Enabling temporal analysis of your activities</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Data Storage and Security</h2>
                <div className="bg-green-50 bg-green-900/20 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-green-900 text-green-300 mb-2">🔒 Local Data Storage</h3>
                  <p className="text-sm">
                    All your data is stored in a MongoDB database that is used exclusively 
                    for this application. The database is password-protected and encrypted.
                  </p>
                </div>
                
                <div className="bg-blue-50 bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 text-blue-300 mb-2">🛡️ Security Measures</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Passwords are hashed and encrypted with bcrypt</li>
                    <li>Secure session management with NextAuth.js</li>
                    <li>HTTPS encryption for all data transmissions</li>
                    <li>Access control - only you can view your data</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Data Sharing</h2>
                <div className="bg-red-50 bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 text-red-300 mb-2">❌ No Data Sharing</h3>
                  <p className="text-sm font-medium">
                    Your data is NEVER shared with third parties, sold, or used for 
                    marketing purposes. This application is exclusively for your 
                    personal use.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Cookies and Tracking</h2>
                <p className="mb-4">
                  This application uses:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Session-Cookies:</strong> Für die Anmeldung und Authentifizierung (erforderlich)
                  </li>
                  <li>
                    <strong>Theme-Einstellungen:</strong> Zur Speicherung Ihrer Design-Präferenzen im lokalen Browser-Speicher
                  </li>
                  <li>
                    <strong>Keine Tracking-Cookies:</strong> Es werden keine Analyse- oder Werbe-Cookies verwendet
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Ihre Rechte</h2>
                <p className="mb-4">
                  Sie haben folgende Rechte bezüglich Ihrer Daten:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">🔍 Auskunftsrecht</h3>
                    <p className="text-sm">Sie können jederzeit Auskunft über Ihre gespeicherten Daten verlangen.</p>
                  </div>
                  <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">✏️ Berichtigungsrecht</h3>
                    <p className="text-sm">Sie können Ihre Daten jederzeit in der Anwendung selbst ändern.</p>
                  </div>
                  <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">🗑️ Löschungsrecht</h3>
                    <p className="text-sm">Sie können Ihr Konto und alle Daten jederzeit löschen lassen.</p>
                  </div>
                  <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">📤 Datenübertragbarkeit</h3>
                    <p className="text-sm">Sie können Ihre Daten in einem maschinenlesbaren Format erhalten.</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">8. Kontakt</h2>
                <p className="mb-4">
                  Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:
                </p>
                <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                  <p>
                    Siehe{" "}
                    <a 
                      href="https://konja-rehm.de/impressum" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 text-purple-400 hover:text-purple-300"
                    >
                      Impressum
                    </a>{" "}
                    für Kontaktinformationen
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">9. Änderungen dieser Datenschutzerklärung</h2>
                <p>
                  Diese Datenschutzerklärung kann gelegentlich aktualisiert werden. 
                  Änderungen werden auf dieser Seite veröffentlicht und das Datum der letzten 
                  Aktualisierung wird oben angezeigt.
                </p>
              </section>

              <div className="bg-green-50 bg-green-900/20 p-6 rounded-lg mt-8">
                <h3 className="font-semibold text-green-900 text-green-300 mb-2">
                  ✅ Zusammenfassung
                </h3>
                <p className="text-sm">
                  Ihr Datenschutz ist uns wichtig. Diese Anwendung sammelt nur die für die 
                  Funktionalität notwendigen Daten, gibt diese niemals weiter und ermöglicht 
                  Ihnen die vollständige Kontrolle über Ihre Informationen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
