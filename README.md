# Vorfeld Taxi Disposition — ZRH

Digitales Disposition-System für Vorfeldtaxis am Flughafen Zürich.  
Drei Ansichten: **Mitarbeiter** (Fahrt anfordern), **Taxifahrer** (Aufträge annehmen), **Disposition** (Gesamtüberblick).

---

## Branches

| Branch | Backend | Auth | Ziel |
|---|---|---|---|
| `main` | PHP 8.2 | – | Lokale Nutzung / selbst gehostet (Plesk/Docker) |
| `microsoft-version` | ASP.NET Core 8 | MSAL / Entra ID | **Azure Deployment** ← dieser Guide |

---

## Architektur (microsoft-version)

```
┌─────────────────────────────────────────────────────────────┐
│                        Benutzer (Browser)                   │
│            React 18 + Vite + Tailwind + MSAL.js             │
│              Azure Static Web Apps (Frontend)               │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS + Bearer Token
┌────────────────────────────▼────────────────────────────────┐
│                   ASP.NET Core 8 Web API                    │
│           Microsoft.Identity.Web (Token Validation)         │
│                    Azure App Service (B1+)                  │
└────────────────────────────┬────────────────────────────────┘
                             │ EF Core 8
┌────────────────────────────▼────────────────────────────────┐
│                     Azure SQL Database                      │
│                        (Basic / S0+)                        │
└─────────────────────────────────────────────────────────────┘
                             │ Token-Ausstellung
┌────────────────────────────▼────────────────────────────────┐
│                  Microsoft Entra ID (Azure AD)              │
│     App-Rollen: Mitarbeiter · Taxifahrer · Disposition      │
│                           Admin                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Voraussetzungen

- **Azure-Abonnement** (Trial oder Pay-As-You-Go)
- **Microsoft 365 / Entra ID Mandant** (in jedem M365-Plan enthalten)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js ≥ 20](https://nodejs.org/) + npm
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
- Optional: [Azure Data Studio](https://aka.ms/azuredatastudio) für SQL-Verwaltung

---

## Schritt 1 — Entra ID App-Registrierungen anlegen

Es werden **zwei** App-Registrierungen benötigt: eine für die API und eine für den SPA-Client.

### 1a — API-App registrieren

1. Öffne das [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App-Registrierungen** → **Neue Registrierung**
2. Name: `PetraApp-API`
3. Kontotypen: *Nur Konten in diesem Organisationsverzeichnis*
4. Redirect-URI: leer lassen → **Registrieren**
5. Notiere die Werte:
   - **Anwendungs-ID (Client-ID)** → `AZURE_API_CLIENT_ID`
   - **Verzeichnis-ID (Tenant-ID)** → `AZURE_TENANT_ID`

#### App-Rollen anlegen

Navigiere zur API-App → **App-Rollen** → **App-Rolle erstellen** (je einen Eintrag):

| Anzeigename | Wert | Beschreibung | Berechtigte |
|---|---|---|---|
| Mitarbeiter | `App.Mitarbeiter` | Fahrt anfordern | Benutzer/Gruppen |
| Taxifahrer | `App.Taxifahrer` | Aufträge annehmen | Benutzer/Gruppen |
| Disposition | `App.Disposition` | Gesamtüberblick | Benutzer/Gruppen |
| Admin | `App.Admin` | Vollzugriff | Benutzer/Gruppen |

#### API-Scope freigeben

Navigiere → **Eine API verfügbar machen** → **Anwendungs-ID-URI festlegen** (Standard übernehmen) → **Bereich hinzufügen**:

| Feld | Wert |
|---|---|
| Bereichsname | `access_as_user` |
| Einwilligende | Administratoren und Benutzer |
| Anzeigename | PetraApp API zugreifen |

Notiere den vollständigen Scope: `api://<AZURE_API_CLIENT_ID>/access_as_user`

---

### 1b — SPA-Client registrieren

1. **Neue Registrierung**
2. Name: `PetraApp-SPA`
3. Redirect-URI: *Single-Page-Anwendung (SPA)* → `http://localhost:3000`
4. Notiere die **Anwendungs-ID** → `AZURE_SPA_CLIENT_ID`

#### API-Berechtigungen erteilen

Navigiere zur SPA-App → **API-Berechtigungen** → **Berechtigung hinzufügen** → **Eigene APIs** → `PetraApp-API` → `access_as_user` → **Hinzufügen** → **Administratoreinwilligung erteilen**

#### Redirect-URIs für Produktion hinzufügen

Navigiere → **Authentifizierung** → **Platform-Konfiguration (SPA)** → Redirect-URIs ergänzen:
- `https://<DEINE-STATIC-WEB-APP>.azurestaticapps.net`

---

## Schritt 2 — Azure SQL Datenbank erstellen

```bash
# Variablen setzen
RESOURCE_GROUP="rg-petraapp"
LOCATION="switzerlandnorth"
SQL_SERVER="petraapp-sql"
SQL_DB="petraapp"
SQL_ADMIN="petrasqladmin"
SQL_PASSWORD="<SICHERES_PASSWORD>"

# Ressourcengruppe anlegen
az group create --name $RESOURCE_GROUP --location $LOCATION

# SQL Server erstellen
az sql server create \
  --name $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $SQL_ADMIN \
  --admin-password $SQL_PASSWORD

# Firewall: Azure-Dienste erlauben
az sql server firewall-rule create \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Datenbank erstellen (Basic = ~5 CHF/Mt)
az sql db create \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --name $SQL_DB \
  --edition Basic \
  --capacity 5
```

#### Schema initialisieren

```bash
sqlcmd -S $SQL_SERVER.database.windows.net \
       -d $SQL_DB -U $SQL_ADMIN -P $SQL_PASSWORD \
       -i backend-dotnet/azure-sql-init.sql
```

---

## Schritt 3 — .NET-Backend auf Azure App Service deployen

```bash
APP_SERVICE_PLAN="plan-petraapp"
APP_NAME="petraapp-api"

# App Service Plan (B1 = ~13 CHF/Mt)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux

# Web App erstellen
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "DOTNETCORE:8.0"

# Umgebungsvariablen setzen
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AzureAd__TenantId="<AZURE_TENANT_ID>" \
    AzureAd__ClientId="<AZURE_API_CLIENT_ID>" \
    AzureAd__Audience="api://<AZURE_API_CLIENT_ID>" \
    "ConnectionStrings__Default=Server=tcp:<SQL_SERVER>.database.windows.net,1433;Database=<SQL_DB>;User Id=<SQL_ADMIN>;Password=<SQL_PASSWORD>;Encrypt=True;" \
    AllowedOrigins="https://<DEINE-STATIC-WEB-APP>.azurestaticapps.net"

# Build & Deploy
cd backend-dotnet
dotnet publish -c Release -o ./publish
cd publish && zip -r ../app.zip . && cd ..
az webapp deployment source config-zip \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src app.zip
```

API-URL notieren: `https://<APP_NAME>.azurewebsites.net`

---

## Schritt 4 — Frontend deployen (Azure Static Web Apps)

```bash
STATIC_APP="petraapp-frontend"

az staticwebapp create \
  --name $STATIC_APP \
  --resource-group $RESOURCE_GROUP \
  --location "westeurope" \
  --sku Standard
```

`frontend/.env.production` erstellen:

```env
VITE_AZURE_CLIENT_ID=<AZURE_SPA_CLIENT_ID>
VITE_AZURE_TENANT_ID=<AZURE_TENANT_ID>
VITE_API_SCOPE=api://<AZURE_API_CLIENT_ID>/access_as_user
VITE_API_BASE_URL=https://<APP_NAME>.azurewebsites.net
```

```bash
cd frontend && npm install && npm run build

DEPLOY_TOKEN=$(az staticwebapp secrets list \
  --name $STATIC_APP \
  --resource-group $RESOURCE_GROUP \
  --query "properties.apiKey" -o tsv)

npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token $DEPLOY_TOKEN \
  --env production
```

---

## Schritt 5 — Benutzer Rollen zuweisen

1. Azure Portal → **Microsoft Entra ID** → **Enterprise-Anwendungen** → `PetraApp-API`
2. → **Benutzer und Gruppen** → **Benutzer/Gruppe hinzufügen**
3. Benutzer auswählen → Rolle auswählen (z. B. *Taxifahrer*) → **Zuweisen**

> Tipp: Active Directory-Gruppen können einer Rolle direkt zugewiesen werden — spart Zeit bei vielen Benutzern.

---

## Lokale Entwicklung

### Backend (.NET)

```bash
cd backend-dotnet
# appsettings.Development.json anpassen (TenantId, ClientId, Connection String)
dotnet run
# API: https://localhost:5001  |  Swagger: https://localhost:5001/swagger
```

`appsettings.Development.json`:

```json
{
  "AzureAd": {
    "TenantId": "<AZURE_TENANT_ID>",
    "ClientId": "<AZURE_API_CLIENT_ID>",
    "Audience": "api://<AZURE_API_CLIENT_ID>"
  },
  "ConnectionStrings": {
    "Default": "Server=localhost,1433;Database=petraapp;User Id=sa;Password=<LOCAL_SA_PASSWORD>;TrustServerCertificate=True;"
  },
  "AllowedOrigins": "http://localhost:3000"
}
```

SQL Server lokal via Docker:

```bash
docker run -e ACCEPT_EULA=Y -e SA_PASSWORD=<PW> -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

### Frontend (React)

```bash
cd frontend
# .env.local erstellen:
# VITE_AZURE_CLIENT_ID=<AZURE_SPA_CLIENT_ID>
# VITE_AZURE_TENANT_ID=<AZURE_TENANT_ID>
# VITE_API_SCOPE=api://<AZURE_API_CLIENT_ID>/access_as_user
# VITE_API_BASE_URL=http://localhost:5001
npm install && npm run dev
# http://localhost:3000
```

---

## API-Endpunkte

| Methode | Pfad | Rolle | Beschreibung |
|---|---|---|---|
| GET | `/api/taxis` | Disposition | Alle aktiven Taxis |
| POST | `/api/taxis` | Taxifahrer | Taxi registrieren |
| PATCH | `/api/taxis/{id}/position` | Taxifahrer | Standort aktualisieren |
| PATCH | `/api/taxis/{id}/deactivate` | Taxifahrer | Taxi abmelden |
| GET | `/api/trips` | Taxifahrer | Offene Aufträge |
| GET | `/api/trips/{id}` | Mitarbeiter | Auftrag-Detail |
| POST | `/api/trips` | Mitarbeiter | Fahrt anfordern |
| PATCH | `/api/trips/{id}/accept` | Taxifahrer | Auftrag annehmen |
| PATCH | `/api/trips/{id}/complete` | Taxifahrer | Auftrag abschliessen |
| PATCH | `/api/trips/{id}/cancel` | Taxifahrer | Auftrag stornieren |
| GET | `/api/dispatch` | Disposition | Gesamtüberblick |

---

## App-Rollen (Entra ID)

| Rolle | Wert | Zugriff |
|---|---|---|
| Mitarbeiter | `App.Mitarbeiter` | Fahrt anfordern, Status verfolgen |
| Taxifahrer | `App.Taxifahrer` | Taxi registrieren, Aufträge annehmen/abschliessen |
| Disposition | `App.Disposition` | Dispatch-Überblick (read-only) |
| Admin | `App.Admin` | Vollzugriff auf alle Bereiche |

---

## Standort-Algorithmus

Platzkette: `E – F – H – I – A – B – C – D – T – G – P – W`

- Score = Distanz (Taxi→Abholort) + 0.5 × Randnähe-Malus + 2 × Seitenwechsel-Malus
- Niedrigster Score = höchste Priorität
- Wartezeit-Schätzung: F↔E = 50 km/h, alle anderen Zonen = 30 km/h

---

## Azure-Kosten (Schätzung)

> Preise in CHF, Region **Switzerland North** (April 2025).  
> Microsoft Entra ID ist in jedem Microsoft 365-Abonnement enthalten (keine Zusatzkosten).

### Kleines Setup (~5 gleichzeitige Benutzer)

| Dienst | SKU | CHF/Monat | CHF/Jahr |
|---|---|---|---|
| Azure Static Web Apps | Standard | ~9 | ~108 |
| Azure App Service | B1 (1 vCore, 1.75 GB RAM) | ~13 | ~156 |
| Azure SQL Database | Basic (5 DTU, 2 GB) | ~5 | ~60 |
| Microsoft Entra ID | Free / M365 inklusive | 0 | 0 |
| **Total** | | **~27** | **~324** |

### Mittleres Setup (~20–50 gleichzeitige Benutzer)

| Dienst | SKU | CHF/Monat | CHF/Jahr |
|---|---|---|---|
| Azure Static Web Apps | Standard | ~9 | ~108 |
| Azure App Service | B2 (2 vCore, 3.5 GB RAM) | ~26 | ~312 |
| Azure SQL Database | S1 (20 DTU, 250 GB) | ~19 | ~228 |
| Microsoft Entra ID | M365 inklusive | 0 | 0 |
| **Total** | | **~54** | **~648** |

### Tipps zur Kostenoptimierung

- Dev/Test: App Service Plan auf **F1 Free** herunterstufen
- **Azure Reservations**: 1-Jahres-Reservierung spart ~30% auf App Service und SQL
- **Azure SQL Serverless**: Bei unregelmässiger Nutzung günstiger als Provisioned (zahle nur für aktive CPU-Zeit)
- Exakte Kalkulation: [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

---

## Sicherheit

- Alle API-Endpunkte erfordern ein gültiges Entra ID JWT Bearer Token
- Token-Validierung serverseitig via `Microsoft.Identity.Web`
- CORS auf die Static Web App URL eingeschränkt
- `requester_oid` in der Trips-Tabelle speichert die Entra-OID des Anforderers (Audit-Trail)
- Tokens im `sessionStorage` (sicherer auf geteilten Geräten wie Barcode-Scanner)

---

## Projektstruktur

```
petra-app/
├── backend-dotnet/           # ASP.NET Core 8 Web API (microsoft-version)
│   ├── Controllers/
│   ├── Data/
│   ├── Dtos/
│   ├── Models/
│   ├── Services/
│   ├── azure-sql-init.sql
│   ├── appsettings.json
│   └── PetraApp.Api.csproj
├── backend/                  # PHP 8.2 REST API (main branch)
├── frontend/                 # React 18 + Vite + Tailwind
│   └── src/
│       ├── auth/             # MSAL Konfiguration + AuthProvider
│       ├── components/shared/# Layout, ProtectedRoute
│       ├── pages/            # EmployeePage, TaxiPage, DispatchPage, SelectRole
│       └── utils/            # API-Client (mit Bearer Token)
├── docker/                   # Docker Compose (main branch, lokale Entwicklung)
└── README.md
```

---

## Lizenz

Internes Projekt — Flughafen Zürich AG, Vorfeld-Logistik.
