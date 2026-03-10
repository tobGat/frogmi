# FrogMi – Quiz-App für den Schulunterricht

Kahoot-ähnliche Quiz-App mit Echtzeit-Multiplayer via Socket.io.

## Entwicklung (lokal)

### Terminal 1 – Server starten:
```bash
cd server
npm install
node index.js
# Server läuft auf http://localhost:3001
```

### Terminal 2 – Client starten:
```bash
cd client
npm install
npm run dev
# Client läuft auf http://localhost:5173
```

## Produktion (Hetzner-Server)

### Client bauen:
```bash
cd client && npm run build
```

### Server mit PM2 starten:
```bash
cd server
npm install -g pm2
pm2 start index.js --name "frogmi"
pm2 save
pm2 startup
```

### Statische Files nach /var/www/frogmi kopieren:
```bash
cp -r client/dist /var/www/frogmi
```

## nginx-Konfiguration

```nginx
server {
    listen 80;
    server_name quiz.DEINE-DOMAIN.at;

    location / {
        root /var/www/frogmi;
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

## Excel-Vorlage

In der App (Lehrer → Quiz erstellen) kann die Vorlage direkt heruntergeladen werden.

Spalten:
- **Frage** – Fragetext
- **Antwort_A** bis **Antwort_D** – die vier Antwortmöglichkeiten
- **Richtig** – Buchstabe der richtigen Antwort (A, B, C oder D)
- **Timer** – Zeit in Sekunden (10, 20 oder 30)

## Tech-Stack

- **Backend:** Node.js, Express, Socket.io
- **Frontend:** React + Vite, Tailwind CSS, Socket.io-client
- **Excel-Import/Export:** SheetJS (xlsx)
