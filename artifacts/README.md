# 📦 Petra Taxi Dispatch - Ready to Export

## ⚡ Quick Start

Importiere `PetraFlowPlatform_solution.zip` in Deinen Power Apps Tenant:

### Methode 1: Web UI (einfach)
```
Power Apps (https://make.powerapps.com)
→ Solutions
→ Import solution
→ Wähle: PetraFlowPlatform_solution.zip
→ Klick: Import
```

### Methode 2: Command Line (pac CLI)
```powershell
cd C:\repos\petra-app-powerapps\artifacts
pac solution import --path PetraFlowPlatform_solution.zip
```

---

## 📋 Was ist in dieser Lösung?

✅ **Canvas App:** Petra (No Premium)
✅ **3 Benutzerrollen:** Dispatch, Taxi, Employee  
✅ **SharePoint-Integration:** PetraTaxis + PetraTrips Listen
✅ **Power Automate Flows:** Accept Trip, Complete Trip (werden separat hinzugefügt)
✅ **Multi-Tenant ready:** Kein Custom Connector, kein Dataverse erforderlich

---

## 🔗 Detaillierte Anleitung

Siehe: `docs/PETRA_MULTI_TENANT_IMPORT_GUIDE.md`

**Was Sie machen müssen:**
1. SharePoint-Listen in Ihrem Tenant erstellen (PetraTaxis, PetraTrips)
2. Diese Solution importieren
3. Flows hinzufügen (PetraAcceptTrip, PetraCompleteTrip)
4. Canvas App mit SharePoint-Listen verbinden
5. Veröffentlichen & testen

---

## 📁 Datei-Übersicht

| Datei | Größe | Zweck |
|-------|-------|-------|
| **PetraFlowPlatform_solution.zip** | 128.96 KB | **← DIESE DATEI IMPORTIEREN** |
| Petra_no_premium.msapp | 112.72 KB | Canvas App (für Backup/Export) |
| PetraAcceptTrip_export.zip | 2.92 KB | Flow: Trip akzeptieren |
| PetraCompleteTrip_export.zip | 2.78 KB | Flow: Trip abschließen |

---

## 🌍 Multi-Tenant Deployment

Diese Solution kann in **beliebig vielen Tenants** importiert werden:
- ✅ Kein Lizenz-Limit
- ✅ Keine Premium Connectors
- ✅ Jeder Tenant hat eigene SharePoint-Daten
- ✅ Unmanaged = Vollständig anpassbar

**Getestet in:** Default + DEV Umgebung (2026-05-22)

---

**Letzte Aktualisierung:** 2026-05-22
**Solution Version:** 1.1.0.0
**Publisher:** AndyNope (uniQconsulting)
