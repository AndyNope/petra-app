# Power Apps Playbook

Dieses Dokument sammelt die verifizierten Regeln, damit weitere Canvas-Apps in diesem Repo schneller und stabiler erstellt werden koennen.

## Build-Pfad

1. Source-Code liegt in `msapp-build/`.
2. Build ausfuehren mit `python build-msapp.py`.
3. Das importierbare Paket entsteht unter `powerapps-solution/petra.msapp`.

## Verifizierte Packaging-Regeln

- `build-msapp.py` muss `msapp-build/petra.msapr` vor dem Packen aus den aktuellen Metadaten neu erzeugen.
- `pac canvas pack` allein reicht nicht, wenn `Header.json`, `Properties.json`, `Controls/*.json` oder `References/Templates.json` veraltet sind.
- Fuer neue Screens muessen passende `Controls/*.json`-Eintraege vorhanden sein; `pac` erzeugt diese nicht automatisch aus `Src/*.pa.yaml`.
- Die logischen Screen-Namen muessen mit `_EditorState.pa.yaml` und den Controls konsistent sein: `SelectRoleScreen`, `DispatchScreen`, `TaxiScreen`, `EmployeeScreen`.
- Der Power-Apps-Studio-Weg `Import app -> From file (.msapp)` eignet sich als finaler Parser- und Layout-Check, kann in diesem Tenant-Kontext aber in einem read-only Bearbeitungsmodus landen. In diesem Fall validiert Studio die App sauber, speichert die importierte Datei aber nicht direkt ueber `Save` ins Environment.

## Tenant-Uebergreifende Bereitstellung

- Sobald Flows, Dataverse-Tabellen, Connection References oder Environment Variables dazukommen, sollte nicht nur die `.msapp` verteilt werden.
- Fuer andere Tenants gehoeren Canvas App, Flows und ihre Abhaengigkeiten in eine gemeinsame Power Platform `Solution`.
- Fuer portable Importe sollten Connection References und Environment Variables konsequent genutzt werden; tenant-spezifische Werte gehoeren nicht fest in App oder Flow.
- Der Zieltenant muss beim Import die Connections neu zuordnen; Custom Connectors, Secrets und externe Ressourcen muessen separat vorbereitet werden.
- Empfehlung: `.msapp` weiter fuer Quellcode-/Studio-Iteration nutzen, aber produktionsnahe Uebergaben tenant-uebergreifend als exportierte `Solution`-ZIP planen.

## Verifizierte SourceCode-Control-IDs

Diese Control-Typen wurden direkt aus einer von Studio erzeugten Canvas-App abgeleitet und funktionieren im aktuellen Schema:

- `Classic/Button@2.2.0`
- `Classic/TextInput@2.3.2`
- `Classic/DropDown@2.3.1`
- `Classic/Slider@2.1.0`
- `Timer@2.1.0`
- `Label@2.5.1`
- `Rectangle@2.3.0`
- `Gallery@2.15.0`

## Wichtige Schema-Fallen

- Control-Entity-Namen muessen global eindeutig sein, auch ueber mehrere Screens hinweg.
- `Gallery` mit `Variant: BrowseLayout` importiert nicht. Ein verifizierter Wert ist `BrowseLayout_Vertical_TwoTextOneImageVariant_ver5.0`.
- `Rectangle@2.3.0` akzeptiert beim Import keine `RadiusTopLeft`, `RadiusTopRight`, `RadiusBottomLeft`, `RadiusBottomRight`.
- `Label@2.5.1` akzeptiert diese `Radius*`-Properties ebenfalls nicht.
- Packen kann erfolgreich sein, obwohl Studio den Import spaeter mit Parserfehlern ablehnt. Der echte Check ist der Import in Power Apps Studio.

## Derzeitiger Stand

- Die aktuelle `petra.msapp` laesst sich in Power Apps Studio importieren und oeffnet ohne den frueheren Parser-Blocker.
- Die App bildet bereits die drei Hauptrollen der Web-App ab: Disposition, Taxi, Mitarbeiter.
- Der importierte Stand wurde erneut in Studio geoeffnet und zeigt `No formula errors present`.
- Weitere Arbeit sollte sich auf Feature-Paritaet und echte Datenanbindung konzentrieren, nicht mehr auf das Grundgeruest des Imports.

## Empfohlene naechste Schritte fuer weitere Apps

1. Zuerst ein kleines Studio-Baseline-App erzeugen und entpacken.
2. Control-IDs und Varianten immer an Studio-Beispielen verifizieren, nicht raten.
3. Danach erst groessere Screen-Dateien aufbauen.
4. Nach jeder strukturellen Aenderung sofort neu packen und direkt in Studio importieren.