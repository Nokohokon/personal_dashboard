# MongoDB Setup Anleitung

## Option 1: MongoDB Community Server (Lokal)

### Windows Installation:
1. Downloaden Sie MongoDB Community Server von: https://www.mongodb.com/try/download/community
2. Führen Sie den Installer aus und folgen Sie den Anweisungen
3. MongoDB wird als Windows Service installiert und automatisch gestartet
4. Standardmäßig läuft MongoDB auf Port 27017

### macOS Installation:
```bash
# Mit Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux Installation:
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Option 2: MongoDB Atlas (Cloud)

1. Gehen Sie zu https://www.mongodb.com/atlas
2. Erstellen Sie einen kostenlosen Account
3. Erstellen Sie ein neues Cluster (M0 ist kostenlos)
4. Klicken Sie auf "Connect" und wählen Sie "Connect your application"
5. Kopieren Sie die Connection String
6. Ersetzen Sie `<password>` mit Ihrem Datenbankpasswort
7. Fügen Sie die Connection String in `.env.local` unter `MONGODB_URI` ein

Beispiel Atlas Connection String:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/personal-dashboard?retryWrites=true&w=majority
```

## Option 3: Docker (Schnellstart)

```bash
# MongoDB in Docker Container starten
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Mit Datenvolume (persistent)
docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
```

## Verbindung testen

Nach der Installation können Sie die Verbindung testen:

1. Starten Sie das Dashboard: `npm run dev`
2. Gehen Sie zu `http://localhost:3000`
3. Registrieren Sie einen neuen Account
4. Wenn die Registrierung erfolgreich ist, funktioniert MongoDB

## Troubleshooting

### "Connection refused" Fehler:
- Überprüfen Sie, ob MongoDB läuft
- Windows: Prüfen Sie den Windows Service
- macOS/Linux: `sudo systemctl status mongod`

### "Authentication failed":
- Überprüfen Sie Username/Passwort in der Connection String
- Stellen Sie sicher, dass der Benutzer die richtigen Berechtigungen hat

### Atlas Connection Probleme:
- Stellen Sie sicher, dass Ihre IP-Adresse in der Atlas Whitelist steht
- Überprüfen Sie die Firewall-Einstellungen
