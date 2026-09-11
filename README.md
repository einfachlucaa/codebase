# CodeBase

Spielerische C#-Lernplattform mit Lektionen, Übungen, 4 Arcade-Minispielen,
Coin-Wirtschaft, Leaderboard und Admin-Panel. Läuft komplett lokal über
Node.js + Express, Fortschritt und Accounts werden in MongoDB gespeichert.

## Datenbank

MongoDB-Datenbank: **`codebase`** (Name steht im Pfad der `MONGODB_URI`). Sie wird beim ersten Start **automatisch** von MongoDB angelegt — es ist kein manuelles Erstellen von Collections nötig, das passiert beim ersten gespeicherten Dokument von selbst.

Vier klar getrennte Collections (MongoDB nennt das, was in einer klassischen SQL-Datenbank eine "Tabelle" wäre, eine *Collection*):

| Collection | Model | Inhalt |
|---|---|---|
| `users` | `src/models/User.js` | Accounts: Login-Daten, Rolle, Fortschritt (XP/Coins/Gems/Level), Avatar/Banner/Bio, Abo, Cookie-Clicker- & Factory-Stand, Warnungen, Sperr-Status inkl. bekannter IPs |
| `messages` | `src/models/Message.js` | Direktnachrichten zwischen Freunden (Text + Sticker) |
| `activity_logs` | `src/models/ActivityLog.js` | Alle Ereignisse fürs Admin-Panel (Logins, Käufe, Verwarnungen, Casino-Wetten, Cheat-Flags ...), läuft automatisch nach 30 Tagen ab |
| `unban_requests` | `src/models/UnbanRequest.js` | Entsperrungs-Anfragen gesperrter Nutzer mit Status (pending/approved/denied) |

Die Namen sind in jedem Model fest über `mongoose.model(name, schema, "collection_name")` gesetzt (statt Mongoose's automatischer Pluralisierung), damit in MongoDB Atlas → "Browse Collections" immer sofort klar ist, was wo liegt.

## Ordnerstruktur

```
.
├── server.js              # Einstiegspunkt (startet DB + Express)
├── config/                # .env laden, DB-Verbindung
├── src/
│   ├── models/User.js      # Mongoose-Schema (Account + Fortschritt)
│   ├── controllers/        # Business-Logik je Bereich (auth, progress, admin, shop, leaderboard)
│   ├── routes/              # REST-Endpunkte
│   ├── middleware/          # JWT-Auth, Permission-Checks, Error-Handler
│   └── config/               # Permissions/Rollen, Shop-Items
├── scripts/createAdmin.js  # Legt den ersten Admin-Account an
└── public/                  # Frontend (statisch ausgeliefert)
```

## Setup

1. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

2. **`.env` prüfen** (liegt schon mit deiner MongoDB-URI vor, siehe `.env.example` als Vorlage)
   - `PORT` – auf welchem Port lokal gehostet wird (Standard `3000`)
   - `MONGODB_URI` – dein MongoDB-Atlas-Connection-String
   - `JWT_SECRET` – Signaturschlüssel für Login-Tokens (bereits zufällig generiert)

   ⚠️ **Wichtig:** In MongoDB Atlas unter *Network Access* muss deine aktuelle
   IP-Adresse freigegeben sein (oder `0.0.0.0/0` für "von überall", nur zum
   lokalen Testen empfehlenswert), sonst schlägt die Verbindung fehl.

3. **Ersten Admin-Account anlegen** (sonst kommt niemand ins Admin-Panel)
   ```bash
   node scripts/createAdmin.js meinAdminName einSicheresPasswort
   ```

4. **Server starten**
   ```bash
   npm start
   ```
   Danach ist alles unter **http://localhost:3000** erreichbar (Port ggf. laut `.env` anpassen).

## Funktionen

- **Accounts**: Registrierung/Login mit Nutzername + Passwort (bcrypt-gehasht), Session per httpOnly-JWT-Cookie, bleibt nach Reload/Neustart erhalten.
- **Rollen & Permissions**: `user` / `moderator` / `admin`, zusätzlich frei vergebbare Einzel-Permissions (`users.view`, `users.edit`, `users.ban`, `users.delete`, `users.roles`) pro Nutzer im Admin-Panel.
- **Admin-Panel**: Nutzer suchen, Coins/XP/Level korrigieren, Rolle ändern, sperren/entsperren, löschen, Permissions granular vergeben.
- **Wirtschaft**: Coins durch Lektionen/Übungen/Arcade verdienen, im Shop gegen Premium-Avatare eintauschen.
- **Arcade**: 4 Minispiele (Bubble Shooter, TapTap Arrow, Memory Match, Quiz Rush), schalten sich zusätzlich mit steigendem Level frei.
- **Leaderboard**: serverweite Rangliste aus MongoDB (nach XP, Coins oder Streak sortierbar), nicht mehr nur pro Browser-Tab.
- **Konfiguration**: alles Zentrale (Port, DB, Secrets) in `.env` / `config/config.js`, keine Werte hart im Code verteilt.

## Sicherheitshinweise (bitte lesen)

- `.env` enthält echte Zugangsdaten (Mongo-URI, JWT-Secret) — **niemals in ein öffentliches Git-Repo committen** (ist bereits in `.gitignore`).
- Passwörter werden mit bcrypt gehasht, nie im Klartext gespeichert; das Frontend/DB-Dumps sehen nie das Passwort.
- Login/Registrierung sind rate-limitiert (20 Versuche / 15 Min pro IP) gegen Brute-Force.
- Der Fortschritt (XP/Coins/Level) wird größtenteils so übernommen, wie ihn das Frontend meldet, weil die Spiellogik im Browser läuft. Es gibt eine grobe Plausibilitätsprüfung gegen zu große Sprünge pro Sync, aber **kein vollständiger Cheat-Schutz** — für ein wirklich manipulationssicheres System müsste die Punktevergabe serverseitig neu berechnet werden.
- `helmet` ist aktiv, aber die Content-Security-Policy ist deaktiviert, weil das Frontend mit Inline-`onclick`-Handlern arbeitet. Für höhere Sicherheit: auf `addEventListener` umstellen und eine eigene CSP aktivieren.
