# Petra Flow Platform Import

## Lokale Ablage

- Loesungs-ZIP fuer den Import: `artifacts/PetraFlowPlatform_solution.zip`
- Solution-Quelle: `PetraPlatformSolution/`
- Canvas-App-Quelle: `PetraLiveSource/`

## Was im ZIP steckt

- Unmanaged Power Platform Solution mit Unique Name `anp_PetraFlowPlatform`
- Eingebettete no-premium Canvas App `Petra`
- Basis ist die lokal verpackte no-premium App aus `PetraLiveSource`, nicht der alte Premium-Connector-Stand

## Was nicht im ZIP steckt

- Keine SharePoint-Listen
- Keine solution-aware Cloud Flows
- Kein alter Premium Custom Connector `Petra API`

## Import-Ort

- Die `Solution.zip` wird im Maker Portal unter `Power Apps -> Solutions -> Import solution` importiert.
- Alternativ per CLI: `pac solution import --path artifacts/PetraFlowPlatform_solution.zip`
- Das ist kein direkter Import in der normalen Power-Automate-Flow-Liste.

## Zusatzartefakte

- Fruehere native Flow-Exporte liegen lokal unter `artifacts/PetraAcceptTrip_export.zip` und `artifacts/PetraCompleteTrip_export.zip`.
- Diese beiden Flow-ZIPs stammen aus dem frueheren Default-Environment-Lauf und nicht aus einer neuen DEV-Bereitstellung.

## Aktueller Stand

- Die lokale Solution wurde neu gebaut und verifiziert.
- Der alte Premium-Connector wurde aus der Solution-Quelle entfernt.
- Das erzeugte ZIP enthaelt die Canvas App und keine Connector-Artefakte mehr.

## Noch offen fuer eine vollstaendige DEV-Bereitstellung

1. Zugriff auf die gewuenschte DEV-Umgebung im Maker Portal oder per PAC.
2. Erneute Erstellung der Flows `PetraAcceptTrip` und `PetraCompleteTrip` als solution-aware Cloud Flows in dieser DEV-Umgebung.
3. Erstellung der SharePoint-Listen `PetraTaxis` und `PetraTrips` im Zieltenant.
4. Oeffnen der App in Power Apps Studio und Rebinding von SharePoint-Datenquellen und Flows im Zieltenant.

## Rebuild lokal

1. `pac canvas pack --sources PetraLiveSource --msapp .tmp_dev_probe.msapp --layout SourceCode --overwrite`
2. `dotnet build PetraPlatformSolution/PetraPlatformSolution.cdsproj -c Debug`
3. Ergebnis: `PetraPlatformSolution/bin/Debug/PetraPlatformSolution.zip`