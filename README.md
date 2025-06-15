# Personal Dashboard

Ein hochprofessionelles und modernes Personal Dashboard mit umfassenden Produktivitäts-Features, entwickelt mit Next.js 15, TypeScript, MongoDB und NextAuth.js.

## 🌟 Features

### 🔐 Authentifizierung & Sicherheit
- **NextAuth.js Integration** - Sichere Authentifizierung mit E-Mail/Passwort
- **Passwort-Hashing** - Sichere Speicherung mit bcryptjs
- **Session Management** - JWT-basierte Sessions
- **E-Mail Authentifizierung** - Optional verfügbar

### ⏱️ Time Tracking
- **Projekt-basiertes Zeiterfassung** - Organisiert nach Projekten und Aufgaben
- **Live Timer** - Echtzeit-Zeiterfassung mit Start/Stop-Funktionalität
- **Automatische Berechnungen** - Dauer wird automatisch berechnet
- **Verlauf & Analytics** - Detaillierte Zeiterfassung mit Berichten

### 👥 CRM & Kontakte
- **Kontakt-Management** - Vollständige Kontaktdatenbank
- **Tagging System** - Kategorisierung von Kontakten
- **Firmen-Integration** - Verknüpfung mit Unternehmen und Positionen
- **Suchfunktion** - Schnelle Kontaktsuche

### 📝 Notizen-System
- **Kategorisierte Notizen** - Organisiert nach Kategorien
- **Markdown-Unterstützung** - Rich-Text Notizen
- **Kontakt-Verknüpfung** - Notizen können mit Kontakten verknüpft werden
- **Tag-System** - Flexible Kategorisierung

### 📊 Analytics & Berichte
- **Produktivitäts-Dashboard** - Detaillierte Einblicke in Ihre Arbeit
- **Zeit-Visualisierung** - Charts und Grafiken mit Recharts
- **Projekt-Verteilung** - Analyse der Zeitverteilung
- **Trend-Analyse** - Langzeit-Produktivitätstrends

### 📅 Kalender
- **Event-Management** - Termine und Aufgaben verwalten
- **Verschiedene Event-Typen** - Meetings, Tasks, Reminders
- **Monatsansicht** - Übersichtlicher Kalender
- **Upcoming Events** - Anstehende Termine im Überblick

### 🎨 Modernes Design
- **Dark Mode Only** - Konsistentes dunkles Design
- **Responsive Design** - Optimiert für alle Bildschirmgrößen
- **Tailwind CSS** - Moderne und konsistente UI
- **Radix UI Components** - Hochwertige, barrierefreie Komponenten

### ⚙️ Einstellungen
- **Profil-Management** - Persönliche Daten verwalten
- **Passwort ändern** - Sichere Passwort-Updates
- **Theme-Einstellungen** - Personalisierte Darstellung
- **Daten-Export** - Vollständiger Datenexport als JSON
- **Benachrichtigungen** - Anpassbare Notification-Einstellungen

## 🛠️ Technologie-Stack

### Frontend
- **Next.js 15** - React Framework mit App Router
- **TypeScript** - Type-sichere Entwicklung
- **Tailwind CSS** - Utility-first CSS Framework
- **Radix UI** - Primitive UI Komponenten
- **Lucide React** - Moderne Icon-Library
- **Recharts** - Datenvisualisierung
- **date-fns** - Datum-Utilities

### Backend
- **Next.js API Routes** - Serverless API Endpunkte
- **MongoDB** - NoSQL Datenbank
- **NextAuth.js** - Authentifizierung
- **bcryptjs** - Passwort-Hashing

### Entwicklung
- **ESLint** - Code-Qualität
- **TypeScript** - Type-Checking
- **Turbopack** - Schneller Development Server

## 📦 Installation & Setup

### Voraussetzungen
- Node.js 18.17.0 oder höher
- MongoDB (lokal oder Atlas)
- Git

### 1. Repository klonen
```bash
git clone [repository-url]
cd personal_dashboard
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Umgebungsvariablen einrichten
Erstellen Sie eine `.env.local` Datei im Root-Verzeichnis:

```env
# Auth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/personal-dashboard

# Email Configuration (Optional - für E-Mail Authentifizierung)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 4. MongoDB einrichten

#### Option A: Lokale MongoDB Installation
1. Installieren Sie MongoDB Community Server
2. Starten Sie MongoDB Service
3. Die Anwendung erstellt automatisch die benötigten Collections

#### Option B: MongoDB Atlas (Cloud)
1. Erstellen Sie einen Account bei [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Erstellen Sie ein neues Cluster
3. Kopieren Sie die Connection String in `MONGODB_URI`

### 5. Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung ist nun unter `http://localhost:3000` verfügbar.

## 🚀 Deployment

### Vercel (Empfohlen)
1. Pushen Sie Ihren Code zu GitHub
2. Verbinden Sie Ihr Repository mit Vercel
3. Konfigurieren Sie die Umgebungsvariablen in Vercel
4. Deploy!

### Andere Hosting-Anbieter
Die Anwendung kann auf jeder Plattform deployed werden, die Next.js unterstützt:
- Netlify
- Railway
- Digital Ocean
- AWS
- Google Cloud

## 📚 Nutzung

### Erste Schritte
1. Registrieren Sie sich über `/auth/signup`
2. Melden Sie sich an über `/auth/signin`
3. Erkunden Sie das Dashboard

### Time Tracking
1. Klicken Sie auf "Start Timer" im Dashboard
2. Wählen Sie Projekt und Aufgabe
3. Starten Sie die Zeiterfassung
4. Beenden Sie den Timer wenn fertig

### CRM & Kontakte
1. Navigieren Sie zu "CRM Notes"
2. Fügen Sie neue Kontakte hinzu
3. Organisieren Sie mit Tags
4. Erstellen Sie verknüpfte Notizen

### Analytics
1. Besuchen Sie die Analytics-Seite
2. Wählen Sie den gewünschten Zeitraum
3. Analysieren Sie Ihre Produktivitätstrends

## 🔧 Konfiguration

### Theme-Anpassung
Das Theme kann in `components/providers/theme-provider.tsx` angepasst werden.

### Datenbank-Schema
Die MongoDB Collections werden automatisch erstellt:
- `users` - Benutzer-Accounts
- `accounts` - NextAuth Account-Verknüpfungen
- `sessions` - Aktive Sessions
- `timeEntries` - Zeiterfassungs-Einträge
- `contacts` - CRM Kontakte
- `notes` - Notizen

### API Endpunkte
- `/api/auth/*` - Authentifizierung (NextAuth)
- `/api/time-entries` - Zeiterfassung CRUD
- `/api/contacts` - Kontakte CRUD
- `/api/notes` - Notizen CRUD

## 🧪 Entwicklung

### Code-Struktur
```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentifizierung Pages
│   ├── dashboard/         # Dashboard Pages
│   └── globals.css        # Globale Styles
├── components/            # React Komponenten
│   ├── dashboard/         # Dashboard-spezifische Komponenten
│   ├── providers/         # Context Providers
│   └── ui/                # Wiederverwendbare UI Komponenten
├── lib/                   # Utilities und Konfiguration
│   ├── auth.ts           # NextAuth Konfiguration
│   ├── mongodb.ts        # MongoDB Connection
│   └── utils.ts          # Utility Funktionen
└── public/               # Statische Assets
```

### Neue Features hinzufügen
1. Erstellen Sie neue API Routes in `app/api/`
2. Entwickeln Sie UI Komponenten in `components/`
3. Fügen Sie neue Seiten in `app/dashboard/` hinzu
4. Erweitern Sie das Navigation in `dashboard-layout.tsx`

## 🔒 Sicherheit

- Alle Passwörter werden mit bcryptjs gehasht
- JWT-basierte Session-Verwaltung
- CSRF-Protection durch NextAuth.js
- Input-Validierung auf Server-Seite
- Sichere HTTP-Only Cookies

## 📝 Lizenz

Dieses Projekt ist für persönliche und kommerzielle Nutzung verfügbar.

## 🤝 Beitragen

Contributions sind willkommen! Bitte:
1. Forken Sie das Repository
2. Erstellen Sie einen Feature Branch
3. Commiten Sie Ihre Änderungen
4. Erstellen Sie eine Pull Request

## 📞 Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.

---

**Viel Erfolg mit Ihrem Personal Dashboard! 🚀**
