#!/usr/bin/env python3
"""
Fix-Skript für Petra Canvas App msapp.
Strategie:
  1. Original msapp als Basis nehmen (alle Backslash-Pfade bleiben erhalten)
  2. Nur Src\App.pa.yaml ersetzen (OnStart mit Demo-Daten)
  3. Src\_EditorState.pa.yaml updaten (4 Screens)
  4. Screen1 (Controls\4.json) BEHALTEN -> App bleibt öffenbar
  5. 3 neue Controls JSON mit Backslash-Pfaden hinzufügen
  6. 3 neue Screen YAML mit Backslash-Pfaden hinzufügen
"""

import zipfile, io, os

SCRIPT_DIR     = os.path.dirname(os.path.abspath(__file__))
SOLUTION_IN    = os.path.join(SCRIPT_DIR, "Petra_1_0_0_0.zip")
SOLUTION_OUT   = os.path.join(SCRIPT_DIR, "Petra_CanvasApp_KEIN_FLOW.zip")
CANVAS_IN_SOL  = "CanvasApps/petra_petra_5b88e_DocumentUri.msapp"

# ── YAML Inhalte ──────────────────────────────────────────────────────────────

APP_YAML = """\
App:
  Properties:
    Theme: =PowerAppsTheme
    OnStart: |
      =Set(gZoneMap,Table({zone:"E",idx:0},{zone:"F",idx:1},{zone:"H",idx:2},{zone:"I",idx:3},{zone:"A",idx:4},{zone:"B",idx:5},{zone:"C",idx:6},{zone:"D",idx:7},{zone:"T",idx:8},{zone:"G",idx:9},{zone:"P",idx:10},{zone:"W",idx:11}));ClearCollect(gTaxis,[{ID:1,FunkID:"Taxi 1",Position:"E",Capacity:8,Occupied:0,Active:true},{ID:2,FunkID:"Taxi 2",Position:"H",Capacity:8,Occupied:0,Active:true}]);Set(gSelectedZone,"E");Set(gPassengers,1);Set(gBestTaxi,Blank());Set(gETA,0);Set(gVonZone,"E");Set(gNachZone,"H");Set(gETAResult,0)
"""

EDITOR_STATE_YAML = """\
EditorState:
  ScreensOrder:
    - DispatchScreen
    - ETAScreen
    - TaxiStatusScreen
    - Screen1
"""

DISPATCH_YAML = """\
Screens:
  DispatchScreen:
    Properties:
      Fill: =RGBA(245, 247, 250, 1)
    Children:
      - TitelLabel:
          Control: Label
          Properties:
            X: =0
            Y: =0
            Width: =Parent.Width
            Height: =80
            Text: ="PETRA \u2013 Taxi Dispatch"
            Size: =22
            FontWeight: =FontWeight.Bold
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(0, 70, 127, 1)
            Align: =Align.Center
            VerticalAlign: =VerticalAlign.Middle
      - ZoneLabel:
          Control: Label
          Properties:
            X: =40
            Y: =100
            Width: =300
            Height: =36
            Text: ="Abholzone ausw\u00e4hlen:"
            Size: =14
            FontWeight: =FontWeight.Semibold
            Color: =RGBA(50, 50, 50, 1)
      - ZoneDropdown:
          Control: Dropdown
          Properties:
            X: =40
            Y: =140
            Width: =300
            Height: =44
            Items: =["E","F","H","I","A","B","C","D","T","G","P","W"]
            OnChange: =Set(gSelectedZone, ZoneDropdown.SelectedText.Value)
            Default: ="E"
      - PassagierLabel:
          Control: Label
          Properties:
            X: =40
            Y: =205
            Width: =380
            Height: =36
            Text: ="Anzahl Passagiere: " & Text(Round(PassagierSlider.Value,0))
            Size: =14
            FontWeight: =FontWeight.Semibold
            Color: =RGBA(50, 50, 50, 1)
      - PassagierSlider:
          Control: Slider
          Properties:
            X: =40
            Y: =248
            Width: =300
            Height: =44
            Min: =1
            Max: =8
            Default: =1
            OnChange: =Set(gPassengers, Round(PassagierSlider.Value,0))
      - FindenButton:
          Control: Button
          Properties:
            X: =40
            Y: =315
            Width: =300
            Height: =52
            Text: ="Bestes Taxi finden"
            Size: =15
            FontWeight: =FontWeight.Bold
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(0, 70, 127, 1)
            HoverFill: =RGBA(0, 90, 160, 1)
            OnSelect: |
              =Set(gPickupIdx,LookUp(gZoneMap,zone=ZoneDropdown.SelectedText.Value,idx));
              ClearCollect(colScored,AddColumns(Filter(gTaxis,(Capacity-Occupied)>=Round(PassagierSlider.Value,0)),"Score",Abs(LookUp(gZoneMap,zone=Position,idx)-gPickupIdx),"FreiePlaetze",Capacity-Occupied));
              Set(gBestTaxi,First(Sort(colScored,Score,SortOrder.Ascending)));
              If(!IsBlank(gBestTaxi),Set(gETA,Round(Abs(LookUp(gZoneMap,zone=gBestTaxi.Position,idx)-gPickupIdx)*0.8/30*60,0)))
      - ErgebnisLabel:
          Control: Label
          Properties:
            X: =40
            Y: =385
            Width: =680
            Height: =160
            Text: =If(IsBlank(gBestTaxi),"Kein verf\u00fcgbares Taxi gefunden.","Fahrzeug: " & gBestTaxi.FunkID & " | Zone " & gBestTaxi.Position & " | ETA: " & Text(gETA) & " Min | Freie Pl\u00e4tze: " & Text(gBestTaxi.FreiePlaetze))
            Size: =16
            Color: =If(IsBlank(gBestTaxi),RGBA(200,30,30,1),RGBA(0,70,127,1))
            Fill: =RGBA(255, 255, 255, 1)
            BorderColor: =RGBA(200, 210, 220, 1)
            BorderThickness: =1
      - NavETABtn:
          Control: Button
          Properties:
            X: =40
            Y: =570
            Width: =200
            Height: =44
            Text: ="ETA Berechnung"
            Size: =13
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(70, 130, 180, 1)
            OnSelect: =Navigate(ETAScreen, ScreenTransition.Fade)
      - NavStatusBtn:
          Control: Button
          Properties:
            X: =260
            Y: =570
            Width: =200
            Height: =44
            Text: ="Taxi-Status"
            Size: =13
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(100, 100, 180, 1)
            OnSelect: =Navigate(TaxiStatusScreen, ScreenTransition.Fade)
"""

ETA_YAML = """\
Screens:
  ETAScreen:
    Properties:
      Fill: =RGBA(245, 247, 250, 1)
    Children:
      - ETATitelLabel:
          Control: Label
          Properties:
            X: =0
            Y: =0
            Width: =Parent.Width
            Height: =80
            Text: ="PETRA \u2013 ETA Berechnung"
            Size: =22
            FontWeight: =FontWeight.Bold
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(0, 70, 127, 1)
            Align: =Align.Center
            VerticalAlign: =VerticalAlign.Middle
      - VonLabel:
          Control: Label
          Properties:
            X: =40
            Y: =110
            Width: =300
            Height: =36
            Text: ="Von Zone:"
            Size: =14
            FontWeight: =FontWeight.Semibold
            Color: =RGBA(50, 50, 50, 1)
      - VonDropdown:
          Control: Dropdown
          Properties:
            X: =40
            Y: =150
            Width: =300
            Height: =44
            Items: =["E","F","H","I","A","B","C","D","T","G","P","W"]
            OnChange: =Set(gVonZone, VonDropdown.SelectedText.Value)
            Default: ="E"
      - NachLabel:
          Control: Label
          Properties:
            X: =40
            Y: =215
            Width: =300
            Height: =36
            Text: ="Nach Zone:"
            Size: =14
            FontWeight: =FontWeight.Semibold
            Color: =RGBA(50, 50, 50, 1)
      - NachDropdown:
          Control: Dropdown
          Properties:
            X: =40
            Y: =255
            Width: =300
            Height: =44
            Items: =["E","F","H","I","A","B","C","D","T","G","P","W"]
            OnChange: =Set(gNachZone, NachDropdown.SelectedText.Value)
            Default: ="H"
      - ETABerechnenBtn:
          Control: Button
          Properties:
            X: =40
            Y: =325
            Width: =300
            Height: =52
            Text: ="ETA Berechnen"
            Size: =15
            FontWeight: =FontWeight.Bold
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(0, 70, 127, 1)
            OnSelect: =Set(gETAResult,Round(Abs(LookUp(gZoneMap,zone=VonDropdown.SelectedText.Value,idx)-LookUp(gZoneMap,zone=NachDropdown.SelectedText.Value,idx))*0.8/30*60,0))
      - ETAErgebnisLabel:
          Control: Label
          Properties:
            X: =40
            Y: =400
            Width: =680
            Height: =100
            Text: ="Route: Zone " & VonDropdown.SelectedText.Value & " \u2192 Zone " & NachDropdown.SelectedText.Value & " | Fahrzeit: " & Text(gETAResult) & " Minuten"
            Size: =18
            FontWeight: =FontWeight.Bold
            Color: =RGBA(0, 70, 127, 1)
            Fill: =RGBA(255, 255, 255, 1)
            BorderColor: =RGBA(200, 210, 220, 1)
            BorderThickness: =1
      - ETAZurueckBtn:
          Control: Button
          Properties:
            X: =40
            Y: =530
            Width: =200
            Height: =44
            Text: ="Dispatch"
            Size: =13
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(100, 100, 180, 1)
            OnSelect: =Navigate(DispatchScreen, ScreenTransition.Fade)
      - ETAStatusBtn:
          Control: Button
          Properties:
            X: =260
            Y: =530
            Width: =200
            Height: =44
            Text: ="Taxi-Status"
            Size: =13
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(70, 130, 180, 1)
            OnSelect: =Navigate(TaxiStatusScreen, ScreenTransition.Fade)
"""

TAXI_YAML = """\
Screens:
  TaxiStatusScreen:
    Properties:
      Fill: =RGBA(245, 247, 250, 1)
    Children:
      - StatusTitelLabel:
          Control: Label
          Properties:
            X: =0
            Y: =0
            Width: =Parent.Width
            Height: =80
            Text: ="PETRA \u2013 Taxi Status"
            Size: =22
            FontWeight: =FontWeight.Bold
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(0, 70, 127, 1)
            Align: =Align.Center
            VerticalAlign: =VerticalAlign.Middle
      - AnzahlLabel:
          Control: Label
          Properties:
            X: =40
            Y: =100
            Width: =680
            Height: =32
            Text: ="Aktive Fahrzeuge: " & Text(CountRows(Filter(gTaxis,Active))) & " / " & Text(CountRows(gTaxis))
            Size: =14
            FontWeight: =FontWeight.Semibold
            Color: =RGBA(50, 50, 50, 1)
      - TaxiGallery:
          Control: Gallery
          Variant: BrowseLayout
          Properties:
            X: =40
            Y: =140
            Width: =680
            Height: =460
            Items: =gTaxis
            TemplateSize: =110
          Children:
            - TaxiNameLabel:
                Control: Label
                Properties:
                  X: =16
                  Y: =8
                  Width: =400
                  Height: =30
                  Text: =ThisItem.FunkID
                  Size: =16
                  FontWeight: =FontWeight.Bold
                  Color: =RGBA(0, 70, 127, 1)
            - TaxiStatusLabel:
                Control: Label
                Properties:
                  X: =16
                  Y: =42
                  Width: =400
                  Height: =26
                  Text: =If(ThisItem.Active, "Aktiv", "Inaktiv") & " | Zone: " & ThisItem.Position & " | Freie Pl\u00e4tze: " & Text(ThisItem.Capacity - ThisItem.Occupied)
                  Size: =13
                  Color: =If(ThisItem.Active, RGBA(0,140,60,1), RGBA(200,30,30,1))
      - StatusDispatchBtn:
          Control: Button
          Properties:
            X: =40
            Y: =625
            Width: =200
            Height: =44
            Text: ="Dispatch"
            Size: =13
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(100, 100, 180, 1)
            OnSelect: =Navigate(DispatchScreen, ScreenTransition.Fade)
      - StatusETABtn:
          Control: Button
          Properties:
            X: =260
            Y: =625
            Width: =200
            Height: =44
            Text: ="ETA"
            Size: =13
            Color: =RGBA(255, 255, 255, 1)
            Fill: =RGBA(70, 130, 180, 1)
            OnSelect: =Navigate(ETAScreen, ScreenTransition.Fade)
"""

# ── Controls JSON für neue Screens ───────────────────────────────────────────

import json

def make_screen_json(name, uid, index):
    return json.dumps({
        "TopParent": {
            "Type": "ControlInfo",
            "Name": name,
            "Template": {
                "Id": "http://microsoft.com/appmagic/screen",
                "Version": "1.0",
                "LastModifiedTimestamp": "0",
                "Name": "screen",
                "FirstParty": True,
                "IsPremiumPcfControl": False,
                "IsCustomGroupControlTemplate": False,
                "CustomGroupControlTemplateName": "",
                "IsComponentDefinition": False,
                "OverridableProperties": {}
            },
            "Index": index,
            "PublishOrderIndex": index,
            "VariantName": "",
            "LayoutName": "",
            "MetaDataIDKey": "",
            "PersistMetaDataIDKey": False,
            "IsFromScreenLayout": False,
            "StyleName": "defaultScreenStyle",
            "Parent": "",
            "IsDataControl": False,
            "AllowAccessToGlobals": True,
            "OptimizeForDevices": "Off",
            "IsGroupControl": False,
            "IsAutoGenerated": False,
            "Rules": [
                {"Property": "Fill", "Category": "Design", "InvariantScript": "RGBA(245, 247, 250, 1)", "RuleProviderType": "Unknown"},
                {"Property": "ImagePosition", "Category": "Design", "InvariantScript": "ImagePosition.Fit", "RuleProviderType": "Unknown"},
                {"Property": "Height", "Category": "Design", "InvariantScript": "Max(App.Height, App.MinScreenHeight)", "RuleProviderType": "Unknown"},
                {"Property": "Width", "Category": "Design", "InvariantScript": "Max(App.Width, App.MinScreenWidth)", "RuleProviderType": "Unknown"},
                {"Property": "Size", "Category": "Design", "InvariantScript": "1 + CountRows(App.SizeBreakpoints) - CountIf(App.SizeBreakpoints, Value >= Self.Width)", "RuleProviderType": "Unknown"},
                {"Property": "Orientation", "Category": "Design", "InvariantScript": "If(Self.Width < Self.Height, Layout.Vertical, Layout.Horizontal)", "RuleProviderType": "Unknown"},
                {"Property": "LoadingSpinner", "Category": "Design", "InvariantScript": "LoadingSpinner.None", "RuleProviderType": "Unknown"},
                {"Property": "LoadingSpinnerColor", "Category": "Design", "InvariantScript": "RGBA(56, 96, 178, 1)", "RuleProviderType": "Unknown"},
            ],
            "ControlPropertyState": ["Fill", "ImagePosition", "Height", "Width", "Size", "Orientation", "LoadingSpinner", "LoadingSpinnerColor"],
            "IsLocked": False,
            "ControlUniqueId": str(uid),
            "Children": []
        }
    }, indent=2)


# ── Hauptlogik ────────────────────────────────────────────────────────────────

def build():
    print(f"Quelle:  {SOLUTION_IN}")
    print(f"Ausgabe: {SOLUTION_OUT}")

    # Original msapp einlesen
    with zipfile.ZipFile(SOLUTION_IN, "r") as sol:
        orig_msapp_bytes = sol.read(CANVAS_IN_SOL)

    # msapp patchen
    new_msapp_buf = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(orig_msapp_bytes), "r") as orig:
        with zipfile.ZipFile(new_msapp_buf, "w", zipfile.ZIP_DEFLATED) as new:
            for item in orig.infolist():
                fname = item.filename  # original Pfad mit Backslash behalten!

                # Normierter Vergleich (ignore slash style)
                fname_norm = fname.replace("\\", "/")

                if fname_norm == "Src/App.pa.yaml":
                    new.writestr(item, APP_YAML.encode("utf-8"))
                    print(f"  ✓ {fname}  (OnStart hinzugefügt)")

                elif fname_norm == "Src/_EditorState.pa.yaml":
                    new.writestr(item, EDITOR_STATE_YAML.encode("utf-8"))
                    print(f"  ✓ {fname}  (Screens aktualisiert)")

                else:
                    new.writestr(item, orig.read(item.filename))
                    print(f"  ✓ {fname}  (unverändert)")

            # Neue Screen YAML Dateien (mit Backslash = Windows-Pfad)
            for path, content in [
                ("Src\\DispatchScreen.pa.yaml", DISPATCH_YAML),
                ("Src\\ETAScreen.pa.yaml",      ETA_YAML),
                ("Src\\TaxiStatusScreen.pa.yaml", TAXI_YAML),
            ]:
                new.writestr(path, content.encode("utf-8"))
                print(f"  ✓ {path}  (NEU)")

            # Neue Screen Controls JSON (mit Backslash = Windows-Pfad)
            screens = [
                ("Controls\\5.json", "DispatchScreen",    5, 1),
                ("Controls\\6.json", "ETAScreen",         6, 2),
                ("Controls\\7.json", "TaxiStatusScreen",  7, 3),
            ]
            for path, name, uid, idx in screens:
                new.writestr(path, make_screen_json(name, uid, idx).encode("utf-8"))
                print(f"  ✓ {path}  ({name}, NEU)")

    new_msapp_bytes = new_msapp_buf.getvalue()
    print(f"\nmsapp: {len(new_msapp_bytes):,} Bytes")

    # Neue Solution ZIP
    out_buf = io.BytesIO()
    with zipfile.ZipFile(SOLUTION_IN, "r") as sol:
        with zipfile.ZipFile(out_buf, "w", zipfile.ZIP_DEFLATED) as out:
            for item in sol.infolist():
                if item.filename == CANVAS_IN_SOL:
                    out.writestr(item, new_msapp_bytes)
                    print(f"  ✓ {item.filename}  (ersetzt)")
                else:
                    out.writestr(item, sol.read(item.filename))
                    print(f"  ✓ {item.filename}  (unverändert)")

    out_buf.seek(0)
    with open(SOLUTION_OUT, "wb") as f:
        f.write(out_buf.read())

    size_kb = os.path.getsize(SOLUTION_OUT) // 1024
    print(f"\n✅ Fertig: {SOLUTION_OUT}  ({size_kb} KB)")
    print()
    print("Import: make.powerapps.com → Solutions → Petra → Importieren")
    print("→ Datei: Petra_CanvasApp_KEIN_FLOW.zip")


if __name__ == "__main__":
    build()
