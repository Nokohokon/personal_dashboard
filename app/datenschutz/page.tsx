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
              ← Zurück zur Startseite
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white">
                Datenschutzerklärung
              </CardTitle>
              <p className="text-slate-400">
                Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}
              </p>
            </CardHeader>
            
            <CardContent className="prose prose-slate prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Verantwortlicher</h2>
                <p className="mb-4">
                  Verantwortlicher für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="bg-slate-100 bg-slate-800 p-4 rounded-lg">
                  <p>
                    Weitere Informationen finden Sie im{" "}
                    <a 
                      href="https://konja-rehm.de/impressum" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 text-purple-400 hover:text-purple-300"
                    >
                      Impressum
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Erhobene Daten</h2>
                <p className="mb-4">
                  Diese Personal Dashboard Anwendung sammelt und verarbeitet folgende Daten:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 text-blue-300 mb-2">Benutzerkonto-Daten</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>E-Mail-Adresse (für Anmeldung und Identifikation)</li>
                      <li>Name (optional, falls angegeben)</li>
                      <li>Verschlüsseltes Passwort</li>
                      <li>Erstellungs- und letzte Anmeldungszeit</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 text-green-300 mb-2">Zeiterfassungs-Daten</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Projektname und Aufgabenbeschreibung</li>
                      <li>Start- und Endzeiten der Zeiterfassung</li>
                      <li>Zusätzliche Notizen zu Zeiteinträgen</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 bg-orange-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 text-orange-300 mb-2">CRM und Kontakt-Daten</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Kontaktinformationen (Name, E-Mail, Telefon, Unternehmen)</li>
                      <li>Notizen zu Kontakten</li>
                      <li>Tags und Kategorisierungen</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 text-purple-300 mb-2">Dokumente und Projekte</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Dokumentinhalte und Metadaten</li>
                      <li>Projektbeschreibungen und Status</li>
                      <li>Kalendereinträge und Termine</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Zweck der Datenverarbeitung</h2>
                <p className="mb-4">
                  Ihre Daten werden ausschließlich für folgende Zwecke verarbeitet:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Bereitstellung der Personal Dashboard Funktionalitäten</li>
                  <li>Authentifizierung und Benutzerkontenverwaltung</li>
                  <li>Speicherung Ihrer persönlichen Produktivitätsdaten</li>
                  <li>Ermöglichung der zeitlichen Analyse Ihrer Aktivitäten</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Datenspeicherung und -sicherheit</h2>
                <div className="bg-green-50 bg-green-900/20 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-green-900 text-green-300 mb-2">🔒 Lokale Datenspeicherung</h3>
                  <p className="text-sm">
                    Alle Ihre Daten werden in einer MongoDB-Datenbank gespeichert, die ausschließlich 
                    für diese Anwendung verwendet wird. Die Datenbank ist passwortgeschützt und 
                    verschlüsselt.
                  </p>
                </div>
                
                <div className="bg-blue-50 bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 text-blue-300 mb-2">🛡️ Sicherheitsmaßnahmen</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Passwörter werden mit bcrypt gehasht und verschlüsselt</li>
                    <li>Sichere Session-Verwaltung mit NextAuth.js</li>
                    <li>HTTPS-Verschlüsselung für alle Datenübertragungen</li>
                    <li>Zugriffskontrolle - nur Sie können Ihre Daten einsehen</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Weitergabe von Daten</h2>
                <div className="bg-red-50 bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 text-red-300 mb-2">❌ Keine Datenweitergabe</h3>
                  <p className="text-sm font-medium">
                    Ihre Daten werden NIEMALS an Dritte weitergegeben, verkauft oder zu 
                    Marketingzwecken verwendet. Diese Anwendung ist ausschließlich für Ihren 
                    persönlichen Gebrauch bestimmt.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Cookies und Tracking</h2>
                <p className="mb-4">
                  Diese Anwendung verwendet:
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
