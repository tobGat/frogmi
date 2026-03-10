# Kahoot-Klon – Claude Code Prompt

Bitte baue eine vollständige Kahoot-ähnliche Quiz-App für den Schulunterricht. Hier sind alle Details:

---

## Projektstruktur

Erstelle das Projekt unter `~/kahoot-clone/` mit folgender Struktur:

```
kahoot-clone/
├── server/
│   ├── index.js
│   ├── gameLogic.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── views/
│   │   │   ├── HomeView.jsx       ← Start: Lehrer oder Schüler?
│   │   │   ├── TeacherSetup.jsx   ← Quiz erstellen / importieren
│   │   │   ├── TeacherLobby.jsx   ← Warteraum + PIN anzeigen
│   │   │   ├── TeacherGame.jsx    ← Frage steuern, Timer, Live-Stats
│   │   │   ├── StudentJoin.jsx    ← PIN + Name eingeben
│   │   │   ├── StudentLobby.jsx   ← Warten bis Spiel startet
│   │   │   ├── StudentGame.jsx    ← Antwort-Buttons
│   │   │   └── Leaderboard.jsx    ← Nach jeder Frage + Finale
│   │   └── socket.js             ← Socket.io Client-Instanz
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Tech-Stack

- **Backend:** Node.js, Express, Socket.io
- **Frontend:** React + Vite, Socket.io-client, Tailwind CSS
- **Excel-Import:** SheetJS (xlsx) im Browser
- **Prozess-Manager:** PM2 (Anleitung in README)

---

## Server (`server/index.js` + `server/gameLogic.js`)

### Anforderungen:

- Express-Server auf Port **3001**
- Socket.io mit CORS für localhost und die Produktions-Domain
- Spielzustände werden **im Arbeitsspeicher** gehalten (kein Datenbankbedarf)

### Socket.io Events – Lehrer sendet:

| Event | Payload | Beschreibung |
|---|---|---|
| `create_game` | `{ questions }` | Neues Spiel erstellen → Server antwortet mit 6-stelligem PIN |
| `start_game` | `{ pin }` | Spiel von Lobby starten |
| `next_question` | `{ pin }` | Nächste Frage anzeigen |
| `end_game` | `{ pin }` | Spiel beenden |

### Socket.io Events – Schüler sendet:

| Event | Payload | Beschreibung |
|---|---|---|
| `join_game` | `{ pin, name }` | Spiel beitreten |
| `submit_answer` | `{ pin, answerIndex }` | Antwort einreichen |

### Socket.io Events – Server broadcastet:

| Event | An | Beschreibung |
|---|---|---|
| `game_created` | Lehrer | PIN + Status |
| `player_joined` | Lehrer (Lobby) | Aktualisierte Spielerliste |
| `game_started` | Alle | Spiel beginnt |
| `show_question` | Alle | Frage + Antworten + Timer (Sekunden) |
| `answer_result` | Schüler | Richtig/Falsch + Punkte |
| `show_leaderboard` | Alle | Top-Liste nach Frage |
| `game_over` | Alle | Endauswertung + Gesamtranking |

### Scoring-Logik (`gameLogic.js`):

- Maximale Punkte pro Frage: **1000**
- Punkte sinken linear mit der Antwortzeit: `Math.round(1000 * (1 - responseMs / (timerSeconds * 1000)))`
- Mindestpunkte bei richtiger Antwort: **100**
- Falsche Antwort: **0 Punkte**

### Spielzustand je Spiel (im RAM):

```js
{
  pin: "483921",
  status: "lobby" | "question" | "leaderboard" | "finished",
  questions: [{ text, answers: ["A","B","C","D"], correct: 0 }],
  currentQuestion: 0,
  timer: 20,           // Sekunden
  questionStart: null, // Date.now() beim Anzeigen
  players: {
    [socketId]: { name, score, answers: {} }
  },
  teacherSocketId: "..."
}
```

---

## Frontend

### HomeView

- Zwei große Buttons: **„Lehrer"** und **„Schüler"**
- Schlicht, klar, groß genug für Beamer und Handys

### TeacherSetup

- Formular zum manuellen Erfassen von Fragen:
  - Fragetext
  - 4 Antwortmöglichkeiten (A, B, C, D)
  - Richtige Antwort auswählen
  - Timer pro Frage (10 / 20 / 30 Sekunden)
  - Frage hinzufügen / löschen
- **Excel-Import** per Drag & Drop oder Datei-Button:
  - Erwartet `.xlsx` mit folgenden Spalten (erste Zeile = Header):
    `Frage | Antwort_A | Antwort_B | Antwort_C | Antwort_D | Richtig (A/B/C/D) | Timer`
  - Importierte Fragen werden in der Liste angezeigt und können bearbeitet werden
- Button **„Spiel erstellen"** → zeigt den PIN

### TeacherLobby

- **PIN groß zentriert** anzeigen (für Beamer)
- Liste der beigetretenen Schüler (Namen, live aktualisiert)
- Button **„Spiel starten"** (erst aktiv wenn ≥1 Schüler)

### TeacherGame (Beamer-Ansicht)

- Aktuelle Frage + 4 Antworten (farbcodiert: 🔴🔵🟡🟢)
- Countdown-Timer als Fortschrittsbalken
- Live-Anzeige: wie viele Schüler bereits geantwortet haben
- Nach Timer-Ablauf: automatisch Leaderboard anzeigen
- Button **„Nächste Frage"**

### StudentJoin

- Großes Eingabefeld für PIN (Ziffernpad-freundlich)
- Eingabefeld für Spitzname
- Button **„Beitreten"**

### StudentLobby

- Zeigt Spitzname + Wartemeldung
- Bestätigung, dass man im Spiel ist

### StudentGame

- 4 große farbige Buttons (kein Text nötig – optional Symbol)
- Antwort sperren nach Tippen
- Nach Antwort: Feedback (✅ / ❌ + Punkte)

### Leaderboard

- Top 5 mit Name + Punkte
- Nach letzter Frage: Endauswertung mit Platz 1–3 hervorgehoben
- Lehrer kann per Button nächste Frage starten oder Spiel beenden

---

## Vite-Konfiguration

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
}
```

---

## Excel-Vorlage

Erstelle zusätzlich eine Datei `quiz-vorlage.xlsx` mit:
- Header-Zeile: `Frage | Antwort_A | Antwort_B | Antwort_C | Antwort_D | Richtig | Timer`
- 3 Beispiel-Fragen (Schulthemen)

---

## README.md

Schreibe ein README mit:

### Entwicklung (lokal)
```bash
cd server && npm install && node index.js
cd client && npm install && npm run dev
```

### Produktion (Hetzner-Server)
```bash
# Client bauen:
cd client && npm run build

# Server starten mit PM2:
cd server
npm install -g pm2
pm2 start index.js --name "kahoot"
pm2 save
pm2 startup

# Statische Files nach /var/www/kahoot kopieren:
cp -r client/dist /var/www/kahoot
```

### nginx-Konfiguration
```nginx
server {
    listen 80;
    server_name quiz.DEINE-DOMAIN.at;

    location / {
        root /var/www/kahoot;
        try_files $uri /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Wichtige Hinweise

- Alle Texte auf **Deutsch**
- Design: **mobiloptimiert**, große Touch-Targets (min. 48px)
- Beamer-Ansicht (TeacherGame): Schriftgröße mind. 2rem, hoher Kontrast
- Kein Login, keine Datenbank – alles im RAM, DSGVO-konform
- Fehlerbehandlung: falls PIN falsch → klare Fehlermeldung auf StudentJoin
- Falls Verbindung abbricht → Schüler sehen Reconnect-Hinweis
