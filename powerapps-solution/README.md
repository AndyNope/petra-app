# Vorfeld Taxi Disposition — Power Apps Version

Low-Code-Variante des Dispositions-Systems als **Microsoft Power Platform Solution**.  
Kein eigener Server nötig — läuft vollständig in Microsoft 365 / Power Platform.

---

## Übersicht

| Komponente | Technologie | Ersetzt |
|---|---|---|
| Datenbank | **Microsoft Dataverse** (2 Tabellen) | Azure SQL / MariaDB |
| Backend-Logik | **Power Automate** (2 Cloud Flows) | PHP API / ASP.NET Core |
| Frontend | **Canvas App** (4 Screens) | React / Vite |
| Authentifizierung | **Microsoft 365 / Entra ID** — nativ | MSAL |
| Rollen | **Dataverse Security Roles** | App-Rollen |

### Vorteile gegenüber der Webversion

- Kein Azure App Service, kein eigener Server
- Authentifizierung automatisch über bestehenden M365-Account
- App direkt im Power Apps Mobile-Client nutzbar (Scanner-freundlich)
- Keine Code-Deployments — Änderungen über Power Apps Studio
- [Power Platform License](https://www.microsoft.com/licensing/product-licensing/power-apps) oft bereits in M365 E3/E5 enthalten

---

## Solution-Struktur

```
powerapps-solution/
├── src/
│   ├── Other/
│   │   └── Solution.xml                  # Solution-Manifest
│   ├── Entities/
│   │   ├── petra_taxi/Entity.xml         # Dataverse-Tabelle: Taxis
│   │   └── petra_trip/Entity.xml         # Dataverse-Tabelle: Fahrten
│   ├── OptionSets/
│   │   └── GlobalOptionSets.xml          # Zonen-Enum + Status-Enum
│   ├── Workflows/
│   │   ├── Petra_DispatchAlgorithmus.json # Flow: Algorithmus (Zonen-Scoring)
│   │   └── Petra_ETABerechnung.json      # Flow: Wartezeit-Berechnung
│   └── CanvasApps/
│       └── PetraVorfeldTaxi_src/
│           ├── Properties.json
│           ├── Header.json
│           └── Src/
│               ├── App.pa.yaml           # App-Initialisierung, OnStart
│               ├── StartScreen.pa.yaml   # Rollenauswahl
│               ├── MitarbeiterScreen.pa.yaml  # Fahrt anfordern
│               ├── TaxiScreen.pa.yaml    # Aufträge annehmen
│               └── DispatchScreen.pa.yaml    # Dispo-Überblick
├── out/                                  # Build-Output (gitignored)
├── pack.sh                               # Build-Script (macOS/Linux)
├── pack.ps1                              # Build-Script (Windows)
└── README.md
```

---

## Voraussetzungen

- **Microsoft 365** (Business Basic / E3 / E5) **oder** Power Apps-Lizenz
- [Power Platform CLI (`pac`)](https://aka.ms/pp/cli) installiert:

  ```bash
  # macOS
  brew install --cask power-platform-tools

  # Windows
  winget install Microsoft.PowerPlatformCLI

  # Alternativ via .NET
  dotnet tool install --global Microsoft.PowerApps.CLI.Tool
  ```

- `pac` Version ≥ 1.34 prüfen: `pac --version`

---

## Solution bauen und importieren

### Schritt 1 — Solution-ZIP bauen

```bash
cd powerapps-solution

# macOS / Linux
bash pack.sh

# Windows (PowerShell)
.\pack.ps1
```

Das Script führt zwei Befehle aus:
1. `pac canvas pack` → kompiliert YAML-Quellen → `PetraVorfeldTaxi.msapp`
2. `pac solution pack` → packt alles → `out/PetraVorfeldTaxi.zip`

### Schritt 2 — Solution in Power Platform importieren

1. Öffne [make.powerapps.com](https://make.powerapps.com)
2. Oben rechts: **Umgebung wählen** (z.B. Prod oder eine Sandbox)
3. Links: **Solutions** → **Importieren** → **Durchsuchen**
4. Wähle `out/PetraVorfeldTaxi.zip`
5. Klicke **Weiter** → **Importieren**

> Beim Import werden alle Tabellen, Flows und die Canvas App automatisch angelegt.

### Schritt 3 — Verbindungen konfigurieren

Nach dem Import: **Solutions** → `PetraVorfeldTaxi` öffnen → **Verbindungen**:

| Verbindung | Typ |
|---|---|
| `shared_commondataserviceforapps` | Microsoft Dataverse |
| `shared_office365users` | Office 365 Users |

Für jeden Flow: Öffnen → **Bearbeiten** → Verbindung mit eigenem Account autorisieren → **Speichern**.

---

## Power Automate Flows

### Petra_DispatchAlgorithmus

**Trigger:** Wird von der Canvas App aufgerufen (instant/button flow)

**Eingabe:**
```json
{ "pickupZone": "E", "passengers": 3 }
```

**Ausgabe:** Alle aktiven Taxis mit Prioritäts-Score sortiert:
```json
{
  "empfehlung": [
    {
      "taxiId": "...",
      "funkId": "T1",
      "position": "F",
      "freie_plaetze": 5,
      "distanz": 1,
      "score": 1.0
    }
  ]
}
```

**Algorithmus:** Identisch mit der Web-Version:
- Score = Distanz (Zonen-Index Taxi → Abholzone) + 2 Punkte Malus bei Seitenwechsel (E-Seite / W-Seite)
- Niedrigster Score = höchste Priorität

### Petra_ETABerechnung

**Trigger:** Wird von der Canvas App aufgerufen

**Eingabe:**
```json
{ "vonZone": "H", "nachZone": "E" }
```

**Ausgabe:**
```json
{
  "eta_minuten": 3,
  "distanz_km": 3.1,
  "geschwindigkeit_kmh": 50,
  "von_zone": "H",
  "nach_zone": "E"
}
```

**Geschwindigkeit:** F↔E = 50 km/h (Schnellverbindung), alle anderen = 30 km/h

---

## Dataverse-Tabellen

### petra_taxi

| Spalte | Typ | Beschreibung |
|---|---|---|
| `petra_name` | Text | Funk-ID (z.B. „T1") |
| `petra_position` | Auswahl (Zone) | Aktuelle Zone |
| `petra_capacity` | Ganzzahl | Max. Personen (Standard: 8) |
| `petra_occupied` | Ganzzahl | Belegte Plätze |
| `petra_active` | Ja/Nein | Taxi im Dienst |
| `petra_lastseen` | Datum/Zeit | Letztes Positions-Update |

### petra_trip

| Spalte | Typ | Beschreibung |
|---|---|---|
| `petra_name` | Text | Auftragsnummer (z.B. „ZRH-20250401-0912") |
| `petra_taxi` | Lookup → petra_taxi | Zugewiesenes Taxi |
| `petra_pickupzone` | Auswahl (Zone) | Abholzone |
| `petra_dropoffzone` | Auswahl (Zone) | Zielzone |
| `petra_passengers` | Ganzzahl | Personenanzahl |
| `petra_status` | Auswahl | Ausstehend / Angenommen / Abgeschlossen / Storniert |
| `petra_overflowwarning` | Ja/Nein | Überlastungswarnung |
| `petra_acceptedat` | Datum/Zeit | Zeitpunkt der Annahme |
| `petra_completedat` | Datum/Zeit | Zeitpunkt des Abschlusses |

### Zonen-Optionssatz (`petra_zone`)

Platzkette: `E(0) – F(1) – H(2) – I(3) – A(4) – B(5) – C(6) – D(7) – T(8) – G(9) – P(10) – W(11)`

---

## Sicherheitsrollen einrichten

Nach dem Import: **make.powerapps.com** → **Einstellungen** → **Sicherheitsrollen**

| Rolle | Tabellen-Zugriff |
|---|---|
| **Petra Mitarbeiter** | petra_trip: Erstellen + Lesen eigener Einträge |
| **Petra Taxifahrer** | petra_taxi: Erstellen/Aktualisieren; petra_trip: Lesen + Patch (Accept/Complete) |
| **Petra Disposition** | petra_taxi + petra_trip: Lesen (alle Einträge) |
| **Petra Admin** | Vollzugriff |

Benutzer in M365 Admin → **Active Users** → Benutzer auswählen → **Power Apps Env** → Rolle zuweisen.

---

## Canvas App — Screens

### StartScreen
Begrüssung mit Benutzer-Name (Office365Users). 3 Kacheln: **Mitarbeiter**, **Taxifahrer**, **Disposition**.

### MitarbeiterScreen
- **Abholzone** wählen (12 Zonen-Buttons im 4-Spalten-Raster)
- **Zielzone** wählen
- **Personenanzahl** (Stepper 1–8)
- Button „**Fahrt anfordern**" → schreibt in Dataverse (`Patch()`)
- Aktive Fahrt-Karte mit ETA-Anzeige (via `Petra_ETABerechnung` Flow)

### TaxiScreen
- Funk-ID eingeben + Positions-Zone wählen → `Patch()` in Dataverse
- **Offene Fahrten** (Gallery) — sortiert nach Dispatch-Score via `Petra_DispatchAlgorithmus` Flow
- **Annehmen**-Button pro Fahrt
- Aktive Fahrt-Karte mit **Abschliessen** und **Stornieren**

### DispatchScreen
- Statistik-Kacheln: Taxis aktiv / Ausstehend / Unterwegs
- Horizontale Taxi-Gallery (Zone, Auslastung)
- Fahrten-Liste mit Status-Badge (Farben: gelb/blau/grün/grau)
- Refresh-Button

---

## Lokale Entwicklung / Änderungen

Canvas App bearbeiten:
1. [make.powerapps.com](https://make.powerapps.com) → Solutions → `PetraVorfeldTaxi` → Canvas App öffnen
2. Änderungen in Power Apps Studio vornehmen
3. Änderungen zurück in Quellcode exportieren:

```bash
# Canvas App exportieren
pac canvas unpack \
  --msapp PetraVorfeldTaxi.msapp \
  --sources src/CanvasApps/PetraVorfeldTaxi_src

# Solution exportieren (nach Änderungen im Portal)
pac solution export \
  --name PetraVorfeldTaxi \
  --path out/PetraVorfeldTaxi_export.zip

pac solution unpack \
  --zipFile out/PetraVorfeldTaxi_export.zip \
  --folder src
```

---

## Kosten (Schätzung)

> Preise CHF, Stand April 2025. Oft bereits durch M365-Lizenz abgedeckt.

### In Microsoft 365 E3/E5 enthalten (keine Zusatzkosten)

| Dienst | Warum gratis |
|---|---|
| Microsoft Dataverse (2 GB) | In Power Apps for M365 inklusive |
| Power Automate (Standard-Flows) | In M365 E3/E5 inklusive |
| Canvas App (non-premium) | In M365 E3/E5 inklusive |
| Entra ID Authentifizierung | Standard M365 |

→ **CHF 0 Zusatzkosten** bei bestehendem M365 E3/E5

### Mit eigenständiger Power Apps Lizenz

| Lizenz | CHF/Benutzer/Monat | CHF/Benutzer/Jahr |
|---|---|---|
| Power Apps Premium (pro Benutzer) | ~22 | ~264 |
| Power Apps per App (1 App) | ~6 | ~72 |

**Beispiel: 20 Benutzer mit per-App:**  
~6 × 20 = **CHF 120/Monat** = **CHF 1'440/Jahr**

**Beispiel: 20 Benutzer Premium:**  
~22 × 20 = **CHF 440/Monat** = **CHF 5'280/Jahr**

> Bei bestehendem M365 Business Premium / E3: **0 CHF Mehrkosten** für diese App.

### Vergleich mit anderen Branches

| Branch | Monatl. Infrastruktur | Auth | Code-Wartung |
|---|---|---|---|
| `main` (PHP/Docker) | ~0–30 CHF (eigener Server) | Keine | mittel |
| `microsoft-version` (Azure) | ~27–54 CHF | Entra ID MSAL | mittel |
| **`powerapps`** (Power Platform) | **0 CHF*** | Entra ID nativ | gering (Low-Code) |

*Bei bestehendem M365 E3/E5 Abonnement

---

## Einschränkungen der Power Apps Version

| Einschränkung | Erläuterung | Workaround |
|---|---|---|
| Dispatch-Algorithmus in Flow | Komplexe Sortierung nur über Select/Query Actions | Für weitere Logik: Custom Connector oder Azure Function |
| Offline-Fähigkeit | Dataverse-Canvas-Apps brauchen Verbindung | Power Apps Mobile cacht Teilweise |
| Custom Domain | Power Apps hat fixe `*.powerapps.com` URL | Nicht nötig für interne App |
| API-Zugriff von extern | Keine öffentliche REST API | Für Integrationen: Dataverse Web API nutzen |

---

## Ressourcen

- [Power Apps Canvas App Doku](https://learn.microsoft.com/power-apps/maker/canvas-apps/)
- [Dataverse Tabellen erstellen](https://learn.microsoft.com/power-apps/maker/data-platform/create-edit-entities-portal)
- [Power Automate Flows in Solutions](https://learn.microsoft.com/power-automate/overview-solution-flows)
- [pac CLI Referenz](https://learn.microsoft.com/power-platform/developer/cli/reference/)
- [Power Apps Lizenzübersicht](https://powerapps.microsoft.com/pricing/)
