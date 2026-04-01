# Petra — Vorfeld Taxi Disposition ZRH

Internes Dispositions-Tool fuer Vorfeld-Taxis am Flughafen Zuerich.

## Projektstruktur

```
petra-app/
  backend/          PHP REST API (fuer Plesk / Apache)
    api/            Endpunkt-Dateien
    config/         Datenbank + Algorithmus
    middleware/     Hilfsfunktionen
    .htaccess       URL-Rewriting
    index.php       Router
  frontend/         React + Vite + Tailwind
    src/
      pages/        EmployeePage, TaxiPage, DispatchPage, SelectRole
      components/   Wiederverwendbare UI-Komponenten
      hooks/        usePolling
      utils/        API-Client, Konstanten
  docker/
    docker-compose.yml
    init.sql        Datenbankschema
    php.ini
```

## Lokal starten (Docker)

```bash
cd petra-app/docker
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- MariaDB: localhost:3306

## Auf Plesk deployen

### Datenbank

1. In Plesk eine neue MariaDB-Datenbank erstellen (z. B. `petra`).
2. Das Schema aus `docker/init.sql` importieren (phpMyAdmin oder CLI).

### Backend

1. Den Inhalt von `backend/` in das Webroot-Verzeichnis der Domain laden (z. B. `httpdocs/`).
2. In Plesk sicherstellen, dass `mod_rewrite` aktiv ist.
3. Umgebungsvariablen in `.htaccess` oder einer PHP-Config setzen:
   ```
   SetEnv DB_HOST localhost
   SetEnv DB_NAME petra
   SetEnv DB_USER petra_user
   SetEnv DB_PASS geheimesPasswort
   ```

### Frontend

```bash
cd frontend
npm install
VITE_API_URL=https://ihre-domain.ch/api npm run build
```

Den Inhalt von `frontend/dist/` in eine Subdomain (z. B. `app.ihre-domain.ch/`) laden
oder im gleichen Webroot unter einem Unterordner.

## API-Uebersicht

| Methode | Pfad                        | Beschreibung                        |
|---------|-----------------------------|-------------------------------------|
| GET     | /api/taxis                  | Alle aktiven Taxis                  |
| POST    | /api/taxis                  | Taxi anmelden / reaktivieren        |
| PATCH   | /api/taxis/{id}/position    | Standort aktualisieren              |
| PATCH   | /api/taxis/{id}/deactivate  | Taxi abmelden                       |
| GET     | /api/trips                  | Auftraege abrufen (mit Filter)      |
| GET     | /api/trips/{id}             | Einzelauftrag abrufen               |
| POST    | /api/trips                  | Auftrag erstellen (Mitarbeiter)     |
| PATCH   | /api/trips/{id}/accept      | Auftrag annehmen (Taxi)             |
| PATCH   | /api/trips/{id}/complete    | Auftrag abschliessen (Taxi)         |
| PATCH   | /api/trips/{id}/cancel      | Auftrag stornieren                  |
| GET     | /api/dispatch               | Dispo-Uebersicht (alle Daten)       |

## Standort-Algorithmus

Platzkette: `E – F – H – I – A – B – C – D – T – G – P – W`

- Alpha (A) ist das Zentrum / Hauptquartier.
- E und W sind die entferntesten Enden.
- Prioritaet: Auftraege an den Raendern (E-Seite oder W-Seite) erhalten eine hoehere Prioritaet,
  damit das Taxi effizient bis ans Ende faehrt, bevor es zurueckkehrt.
- Score = Distanz (Taxi→Abholort) + 0.5 × Randnaehe-Malus + 2 × Seitenwechsel-Malus
- Niedrigster Score = hoechste Prioritaet.
- Taxis auf der E-Seite priorisieren Auftraege auf der E-Seite und umgekehrt.

## Kapazitaetswarnung

- Max. 8 Personen pro Taxi (konfigurierbar via `taxis.capacity`).
- Der Fahrer kann bewusst einen Auftrag annehmen, auch wenn die Kapazitaet ueberschritten ist.
- Solche Auftraege werden mit `overflow_warning = 1` markiert und in der UI rot gekennzeichnet.
