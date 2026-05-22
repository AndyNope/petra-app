# Petra Taxi Dispatch - Multi-Tenant Import Guide

**Lösung:** Unmanaged Power Platform Solution für vollständig Premium-frei Deployment

---

## 📦 Was wird exportiert

Die Lösung besteht aus folgenden Komponenten:

| Datei | Größe | Zweck | Premium erforderlich |
|-------|-------|-------|----------------------|
| `PetraFlowPlatform_solution.zip` | 128.96 KB | **Hauptlösung** - Canvas App + Metadata | ❌ Nein |
| `Petra_no_premium.msapp` | 112.72 KB | Canvas App einzeln (für Backup/Testing) | ❌ Nein |
| `PetraAcceptTrip_export.zip` | 2.92 KB | Flow: Trip akzeptieren | ❌ Nein |
| `PetraCompleteTrip_export.zip` | 2.78 KB | Flow: Trip abschließen | ❌ Nein |

---

## ✅ Vorbedingungen (PRO TENANT)

Bevor Sie die Lösung importieren, erstellen Sie folgende SharePoint-Listen im **gleichen Tenant**:

### 1. **PetraTaxis** Liste
- **Site:** `https://[IhrTenant].sharepoint.com/sites/[IhreSite]`
- **Spalten:**
  - `Title` (Text) - Taxi-ID
  - `RadioId` (Text) - Funktaxi-Kennung
  - `Position` (Text) - Aktuelle Zone (z.B. "E", "F", "A")
  - `Capacity` (Zahl) - Sitzplätze (Standard: 8)
  - `Occupied` (Zahl) - Belegte Plätze
  - `Active` (Ja/Nein) - Verfügbarkeit
  - `LastSeen` (Datum/Uhrzeit) - Letztes Update

### 2. **PetraTrips** Liste
- **Site:** Gleiche wie PetraTaxis
- **Spalten:**
  - `Title` (Text) - Trip-ID
  - `Passenger` (Text) - Passagier-Name
  - `From` (Text) - Start-Zone
  - `To` (Text) - Ziel-Zone
  - `Status` (Auswahl) - Optionen: "pending", "accepted", "completed"
  - `TaxiId` (Zahl) - Zugeordnete Taxi-ID
  - `CreatedBy` (Text) - Erstellt von (Employee-ID)
  - `CreatedAt` (Datum/Uhrzeit) - Erstellungszeit
  - `AcceptedAt` (Datum/Uhrzeit) - Akzeptanzzeit
  - `CompletedAt` (Datum/Uhrzeit) - Abschlusszeit

---

## 🚀 Import-Anleitung (3 Schritte)

### Schritt 1: Solution importieren

**Option A - Web UI (einfach):**
1. Power Apps Maker Portal öffnen: https://make.powerapps.com
2. Korrekte **Umgebung** wählen (oben links: "Environment: [YourTenant]")
3. **Solutions** → **Import solution**
4. Datei auswählen: `artifacts/PetraFlowPlatform_solution.zip`
5. **Next** → **Import** klicken
6. ⏳ Warten bis "Import erfolgreich" angezeigt wird (1-2 Min.)

**Option B - Command Line (pac CLI):**
```powershell
pac solution import --path artifacts/PetraFlowPlatform_solution.zip --environment-url https://org[Code].crm[Region].dynamics.com
```

### Schritt 2: Flows importieren

1. Power Automate öffnen: https://make.powerautomate.com
2. **Meine Flows** → **Cloud Flows**
3. **+ New Flow** → **Instant Cloud Flow**
   
**Für PetraAcceptTrip Flow:**
- Name: `PetraAcceptTrip`
- Trigger: **Power Apps (V2)** - "A power app or portals calls an action"
- Inputs:
  - `TripId` (Number)
  - `TaxiId` (Number)
- Actions:
  1. SharePoint: **Update Item** → PetraTrips Liste
     - Item ID: `TripId`
     - Status: `"accepted"`
     - TaxiId: `TaxiId`
     - AcceptedAt: `utcNow()`
  2. **Return** Wert: `{ success: true }`

**Für PetraCompleteTrip Flow:**
- Name: `PetraCompleteTrip`
- Trigger: **Power Apps (V2)**
- Inputs:
  - `TripId` (Number)
- Actions:
  1. SharePoint: **Update Item** → PetraTrips Liste
     - Item ID: `TripId`
     - Status: `"completed"`
     - CompletedAt: `utcNow()`
  2. **Return** Wert: `{ success: true }`

### Schritt 3: Canvas App konfigurieren

1. **Power Apps Maker Portal** → **Solutions**
2. `anp_PetraFlowPlatform` Solution öffnen
3. Canvas App `Petra` klicken → **Edit**
4. Im App-Designer:
   - **Data Pane** → **Add Data Source**
   - SharePoint → Ihre Site auswählen
   - `PetraTaxis` Liste hinzufügen
   - `PetraTrips` Liste hinzufügen
5. **Flows verbinden:**
   - Im Power Fx Editor folgende Formeln aktualisieren:
     ```
     // Taxi akzeptiert Trip
     PetraAcceptTrip.Run(ThisItem.ID, SelectedTaxiId)
     
     // Trip abschließen
     PetraCompleteTrip.Run(ThisItem.ID)
     ```
6. **Speichern** und **Veröffentlichen**

---

## 📋 Bestandteile nach Import

| Komponente | Typ | Status |
|-----------|------|--------|
| `anp_PetraFlowPlatform` | Solution | Unmanaged, bereit zur Anpassung |
| `Petra` | Canvas App | Enthält UI für 3 Rollen (Dispatch, Taxi, Employee) |
| SharePoint-Connector | Standard | Bereits in Lösung enthalten |
| Power Automate Flows | Cloud Flows | Müssen manuell hinzugefügt werden (siehe Schritt 2) |

---

## ⚙️ Konfiguration nach Import (Pro Tenant)

### 1. SharePoint-Standort anpassen
Die App ist vorkonfiguriert für:
```
Site: https://uniqconsultingch.sharepoint.com/sites/T-int-ProfessionalServices
```

**Für anderen Standort:**
- App bearbeiten → Data Pane
- Neue SharePoint-Site auswählen
- Alle Gallery- und Form-Controls neu binden

### 2. Zonen-Zuordnung
Die Standard-Zonen (E, F, H, I, A, B, C, D, T, G, P, W) sind im App-Code fest. Für andere Zonen:
- App öffnen → Power Fx → `gZoneMap` Variable bearbeiten
- Neue Zonen in Tabelle eintragen

### 3. Benutzerrollen
Die App unterscheidet 3 Rollen via Login:
- **Dispatch:** Kann Trips erstellen, Zuweisung verwalten
- **Taxi:** Kann Trip akzeptieren/ablehnen, Status updaten
- **Employee:** Kann Trips anfragen

Rollen sind in der `SelectRoleScreen` hartcodiert. Für dynamische Rollen:
- Azure AD / Entra ID Gruppen verwenden
- App-Rollen in AAD konfigurieren

---

## 🔐 Sicherheit & Multi-Tenant Deployment

✅ **Premium-frei:** Keine custom connectors, Premium licenses oder Dataverse erforderlich
✅ **Standard-Connectors:** SharePoint + Power Automate (in allen Plans enthalten)
✅ **Datenisolation:** Jeder Tenant hat separate SharePoint-Listen
✅ **Unmanaged Solution:** Kann in jedem Tenant angepasst werden

---

## ❌ Bekannte Limitierungen (Kein Premium)

| Feature | Premium-Version | Diese Version |
|---------|-----------------|---------------|
| Echtzeitdaten (>1 Min) | ✅ SQL- oder Dataverse-Integration | ⚠️ SharePoint (5-10 Min Polling) |
| Offline-Zugriff | ✅ Mobile App + Sync | ❌ Nur Online |
| Advanced Analytics | ✅ Power BI Embedded | ❌ Manuelle Reports |
| Custom Connectors | ✅ REST APIs, Webhooks | ❌ SharePoint/Power Automate nur |

---

## 📞 Support & Troubleshooting

### Problem: "Cannot find table 'PetraTaxis'"
**Lösung:** SharePoint-Listen müssen VOR App-Start erstellt sein
```powershell
# Oder: Manuell in SharePoint Online admin center erstellen
```

### Problem: "Flow not found when app runs"
**Lösung:** Flows müssen mit **Power Apps (V2) trigger** erstellt sein (nicht Button trigger)

### Problem: "App shows only 2000 items"
**Lösung:** SharePoint-Delegation - 
- Im App-Code: `First(PetraTrips, 100)` verwenden statt `PetraTrips`
- Für >100 Items: Pagination implementieren

---

## 📦 Export aus dieser Lösung

Wenn Sie die App in Ihrem Tenant angepasst haben und exportieren möchten:

```powershell
# Solution exportieren
pac solution export --name anp_PetraFlowPlatform --path ./PetraFlowPlatform_custom.zip --managed false

# Canvas App einzeln exportieren
pac canvas unpack --msapp Petra_custom.msapp --sources ./Petra_CustomSource --layout SourceCode
```

---

**Version:** 1.1.0.0 (2026-05-22)
**Publisher:** AndyNope
**License:** No Premium Required ✅
